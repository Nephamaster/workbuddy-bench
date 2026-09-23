"""Restore this task's final workspace and reuse its unmodified verifier plugin."""
import asyncio
import importlib
import json
import os
import shutil
import socket
import subprocess
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

from workbuddy_bench.judge import ArtifactWriter, EvaluationContext, RegistryBuildContext
from workbuddy_bench.judge.registry import load_registry_builder, load_verifier_contract, maybe_await
from workbuddy_bench.judge.runtime.command import LocalCommandExecutor


class BashExecutor(LocalCommandExecutor):
    def run(self, command, *, shell=None, **kwargs):
        argv = ["bash", "-c", command] if isinstance(command, str) else command
        return super().run(argv, shell=False, **kwargs)


def restore_workspace(task_dir):
    for path in ["/workspace", "/submitted", "/tests", "/logs/verifier"]:
        Path(path).mkdir(parents=True, exist_ok=True)
    subprocess.run(["tar", "-xzf", "/initial.tar.gz", "-C", "/workspace"], check=True)
    # The IPD base image creates this directory for UID 1000; the verifier runs as root.
    os.chown("/workspace", os.getuid(), os.getgid())
    for args in [["init", "-q"], ["add", "-A"],
                 ["-c", "user.name=Benchmark", "-c", "user.email=benchmark@localhost", "commit", "-qm", "initial"]]:
        subprocess.run(["git", "-C", "/workspace", *args], check=True)
    subprocess.run(["tar", "-xzf", "/final.tar.gz", "-C", "/submitted"], check=True)
    for child in Path("/workspace").iterdir():
        if child.name == ".git":
            continue
        if child.is_dir() and not child.is_symlink():
            shutil.rmtree(child)
        else:
            child.unlink()
    for child in Path("/submitted").iterdir():
        if child.name == ".git":
            continue
        target = Path("/workspace") / child.name
        if child.is_dir() and not child.is_symlink():
            shutil.copytree(child, target, symlinks=True)
        else:
            shutil.copy2(child, target, follow_symlinks=False)
    shutil.copytree(task_dir / "tests", "/tests", dirs_exist_ok=True)


async def main():
    task_id = "effective-control-state-L5-036"
    task_dir = Path("/dataset/tasks") / task_id
    restore_workspace(task_dir)
    contract = load_verifier_contract(task_dir)
    builder = load_registry_builder(contract)
    registry = builder(RegistryBuildContext(contract=contract))
    registry.judge_runners["rule_script"].executor = BashExecutor()
    route = {key: value for key, value in os.environ.items() if key.startswith("WORKBUDDY_VERIFIER_LLM_")}
    required = ["WORKBUDDY_VERIFIER_LLM_BASE_URL", "WORKBUDDY_VERIFIER_LLM_API_KEY", "WORKBUDDY_VERIFIER_LLM_MODEL"]
    if route and not all(route.get(key) for key in required):
        raise ValueError("Incomplete verifier LLM configuration")
    if route:
        endpoint = urlsplit(route[required[0]])
        if endpoint.hostname == "host.docker.internal":
            port = f":{endpoint.port}" if endpoint.port else ""
            route[required[0]] = urlunsplit(endpoint._replace(netloc=socket.gethostbyname(endpoint.hostname) + port))
    context = EvaluationContext(
        dataset_id=contract.dataset_id, task_id=task_id, workspace="/workspace", tests_dir="/tests",
        verifier_dir="/logs/verifier", env=route,
        host_paths={"task_dir": str(task_dir), "dataset_root": str(contract.dataset_root),
                    "tests_dir": str(task_dir / "tests"), "verifier_dir": "/logs/verifier"},
    )
    rule_module = importlib.import_module(builder.__module__.rsplit(".", 1)[0] + ".rule")
    subprocess.run(["bash", "-c", rule_module.prepare_command()], check=True)
    plan = await maybe_await(registry.plan_builder(context))
    score = await registry.engine().run(context, plan)
    if registry.finalize_score:
        score = await maybe_await(registry.finalize_score(score, context, plan))
    ArtifactWriter(Path("/logs/verifier/reward.json"), Path("/logs/verifier/score.json")).write(score)
    print(json.dumps(score.reward_payload(), ensure_ascii=False, indent=2))
    if score.test_status in {"build_error", "judge_error"}:
        raise SystemExit(2)
    if route and not score.metadata.get("score_merge", {}).get("applied"):
        raise SystemExit("LLM score merge was not applied; inspect score.json")


if __name__ == "__main__":
    asyncio.run(main())
