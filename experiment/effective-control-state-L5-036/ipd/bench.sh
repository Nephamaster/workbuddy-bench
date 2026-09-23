#!/usr/bin/env bash
set -euo pipefail
tools=$(cd "$(dirname "$0")" && pwd)
bench=$(cd "$tools/../../.." && pwd)
action=${1:-help}
trial=${2:-}
node_bin=${PI_NODE_BIN:-}
if [[ -z "$node_bin" ]]; then
    for candidate in "$(command -v node || true)" "$HOME/.nvm/versions/node/v24.19.0/bin/node"; do
        if [[ -x "$candidate" ]] && "$candidate" -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 24 ? 0 : 1)'; then
            node_bin=$candidate
            break
        fi
    done
fi
[[ -n "$node_bin" ]] || { echo 'Set PI_NODE_BIN to a Node.js >=24 executable.' >&2; exit 1; }
field() { "$node_bin" -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"))[process.argv[2]])' "$trial/config.json" "$1"; }
check_host() {
    [[ -z "${DOCKER_HOST:-}" || "$DOCKER_HOST" == unix:///var/run/docker.sock ]] || {
        echo 'Use the local /var/run/docker.sock Engine; remote Docker cannot share this host slice.' >&2; exit 1;
    }
    [[ $(docker context inspect --format '{{.Endpoints.docker.Host}}') == unix:///var/run/docker.sock ]] || {
        echo 'The selected Docker context must use unix:///var/run/docker.sock.' >&2; exit 1;
    }
    [[ $(docker info --format '{{.CgroupDriver}}:{{.CgroupVersion}}') == systemd:2 ]] || {
        echo 'This runner requires a local Docker Engine using systemd cgroup v2.' >&2; exit 1;
    }
    systemctl show --property=Version --value >/dev/null
}
controller() {
    env PI_CODING_AGENT_DIR="$state/pi-agent" PI_OFFLINE=1 PI_TELEMETRY=0 \
        HOME="$state/home" TMPDIR="$state/tmp" TSX_TSCONFIG_PATH="$runtime/tsconfig.json" \
        "$node_bin" --import "$runtime/node_modules/tsx/dist/loader.mjs" "$runtime/wbbench/controller.mjs" "$1"
}

if [[ "$action" == help || -z "$trial" ]]; then
    echo 'Usage: bash bench.sh prepare TRIAL [PI_SOURCE]'
    echo '       bash bench.sh build|check|run|metrics|score|cleanup TRIAL [JUDGE_ENV]'
    exit 0
fi
trial=$(realpath -m "$trial")
if [[ "$action" == prepare ]]; then
    source=${3:-${PI_SOURCE:-}}
    if [[ -z "$source" ]]; then
        if [[ -d /home/Agent/pi ]]; then source=/home/Agent/pi; else source=/home/nepham/Agent/pi; fi
    fi
    [[ ! -e "$trial" ]] || { echo "Refusing to overwrite existing trial: $trial" >&2; exit 1; }
    test -f "$source/packages/ipd/src/tool/default-ipd-extension.ts"
    test -d "$source/node_modules/tsx"
    check_host
    for command in rsync mkfs.ext4 mountpoint sudo; do command -v "$command" >/dev/null; done
    mkdir -m 700 -p "$trial"
    truncate -s 10G "$trial/state.ext4"
    chmod 600 "$trial/state.ext4"
    mkfs.ext4 -q -F -m 0 "$trial/state.ext4"
    mkdir "$trial/state"
    sudo mount -o loop,nodev,nosuid "$trial/state.ext4" "$trial/state"
    sudo chown "$(id -u):$(id -g)" "$trial/state"
    "$node_bin" "$tools/init.mjs" "$trial" "$source" "$node_bin"
    slice=$(field slice)
    sudo install -m 644 "$trial/$slice" "/run/systemd/system/$slice"
    sudo systemctl daemon-reload
    sudo systemctl start "$slice"
    echo "Prepared $trial; next: bash $0 build $trial"
    exit 0
fi

test -f "$trial/config.json"
runtime=$(field runtime)
state=$(field state)
slice=$(field slice)
id=$(field id)
node_bin=$(field nodeBinary)
image=$(field image)
verifier_image=$(field verifierImage)
[[ "$slice" =~ ^wbbench[0-9a-f]+\.slice$ ]] || { echo 'Invalid slice name' >&2; exit 1; }

case "$action" in
build)
    [[ ! -e "$state/logs/started.json" ]] || { echo 'Do not rebuild a trial after it has started; prepare a fresh trial.' >&2; exit 1; }
    "$node_bin" "$runtime/scripts/generate-ipd-bridges.mjs" --check
    docker build -f "$runtime/packages/ipd/environments/general-purpose/Dockerfile" \
        --build-arg DEBIAN_MIRROR=https://mirrors.tuna.tsinghua.edu.cn/debian \
        --build-arg DEBIAN_SECURITY_MIRROR=https://mirrors.tuna.tsinghua.edu.cn/debian-security \
        --build-arg PIP_INDEX_URL=https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple \
        -t "$image" "$runtime/packages/ipd/environments"
    context="$trial/verifier-build"
    mkdir -p "$context/workbuddy"
    cp "$(command -v uv)" "$context/uv"
    cp "$bench/pyproject.toml" "$bench/uv.lock" "$bench/LICENSE" "$context/workbuddy/"
    rsync -a --delete --exclude __pycache__ "$bench/src/" "$context/workbuddy/src/"
    cp "$tools/score.py" "$context/score.py"
    docker build -f "$tools/Dockerfile.verifier" --build-arg "BASE_IMAGE=$image" -t "$verifier_image" "$context"
    docker image inspect "$image" "$verifier_image" --format '{{.RepoTags}} {{.Id}}' > "$trial/images.txt"
    ;;
check)
    check_host
    mountpoint -q "$state" || { echo 'The 10 GiB state filesystem is not mounted.' >&2; exit 1; }
    docker image inspect "$image" "$verifier_image" --format '{{.RepoTags}} {{.Id}}'
    controller check
    ;;
run)
    check_host
    mountpoint -q "$state" || { echo 'The state filesystem is not mounted.' >&2; exit 1; }
    [[ ! -e "$state/logs/started.json" ]] || { echo 'Trial already started; prepare a fresh trial for another attempt.' >&2; exit 1; }
    controller select
    cleanup_nodes() {
        mapfile -t ids < <(docker ps -aq --filter "label=wb.bench.trial=$id")
        if [[ ${#ids[@]} -gt 0 ]]; then docker rm -f "${ids[@]}" >/dev/null; fi
    }
    trap cleanup_nodes EXIT
    trap 'sudo systemctl stop "wbbench${id}-controller.service" || true; exit 130' INT TERM
    sudo systemctl start "$slice"
    rc=0
    sudo systemd-run --wait --pipe --collect --unit="wbbench${id}-controller" --slice="$slice" \
        --uid="$(field uid)" --gid="$(field gid)" --working-directory="$state/project" \
        --property="SupplementaryGroups=$(id -Gn)" \
        --property=RuntimeMaxSec=4830 --property=TimeoutStopSec=15 --property=KillMode=control-group \
        --setenv="HOME=$state/home" --setenv="TMPDIR=$state/tmp" \
        --setenv="PI_CODING_AGENT_DIR=$state/pi-agent" --setenv=PI_OFFLINE=1 --setenv=PI_TELEMETRY=0 \
        --setenv="TSX_TSCONFIG_PATH=$runtime/tsconfig.json" \
        "$node_bin" --import "$runtime/node_modules/tsx/dist/loader.mjs" "$runtime/wbbench/controller.mjs" run \
        2>&1 | tee "$state/logs/controller.log" || rc=$?
    printf '%s\n' "$rc" > "$state/logs/launcher-exit-code.txt"
    cleanup_nodes
    tar -czf "$trial/final-workspace.tar.gz" -C "$state/workspace" .
    echo "Workspace: $state/workspace"
    echo "Run logs: $state/logs"
    exit "$rc"
    ;;
metrics)
    controller metrics
    ;;
score)
    test -f "$trial/final-workspace.tar.gz"
    result=$(mktemp -d "$trial/verifier.XXXXXX")
    args=(--rm --init --cpus=2 --memory=4g --memory-swap=4g --add-host host.docker.internal:host-gateway
        --env "WB_RESULT_UID=$(id -u)" --env "WB_RESULT_GID=$(id -g)"
        --mount "type=bind,src=$bench/datasets/wb-bench-office-v1.0,dst=/dataset,readonly"
        --mount "type=bind,src=$trial/initial-workspace.tar.gz,dst=/initial.tar.gz,readonly"
        --mount "type=bind,src=$trial/final-workspace.tar.gz,dst=/final.tar.gz,readonly"
        --mount "type=bind,src=$result,dst=/logs/verifier")
    if [[ -n "${3:-}" ]]; then args+=(--env-file "$3"); fi
    rc=0
    docker run "${args[@]}" "$verifier_image" bash -c '
        trap "chown -hR $WB_RESULT_UID:$WB_RESULT_GID /logs/verifier" EXIT
        timeout --signal=TERM --kill-after=30s 3600s python /opt/runner/score.py
    ' || rc=$?
    echo "Verifier output: $result"
    exit "$rc"
    ;;
cleanup)
    if systemctl is-active --quiet "wbbench${id}-controller.service"; then
        echo 'Controller is still active; stop it explicitly before cleanup.' >&2; exit 1
    fi
    [[ -z $(docker ps -aq --filter "label=wb.bench.trial=$id") ]] || {
        echo 'Trial containers remain; inspect them before cleanup.' >&2; exit 1;
    }
    if mountpoint -q "$state"; then sudo umount "$state"; fi
    sudo systemctl stop "$slice"
    echo "State retained in $trial/state.ext4; no experiment data deleted."
    ;;
*) echo "Unknown action: $action" >&2; exit 2;;
esac
