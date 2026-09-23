# CodeBuddy Code harness mount image. The CLI version is supplied by harness YAML build args.

ARG CBC_VERSION

FROM node:20-slim AS build
ARG PI_ORGANIZE_VERSION
ARG MOUNT_PATH=/opt/pi-organize
ENV MOUNT_PATH=${MOUNT_PATH}
RUN test -n "${PI_ORGANIZE_VERSION}" && \
    npm install -g "@huahua-ai/pi-organize@${PI_ORGANIZE_VERSION}"
RUN set -eux; \
    mkdir -p /out/bin /out/lib; \
    cp -r /usr/local/lib/node_modules /out/lib/node_modules; \
    cp /usr/local/bin/node /out/bin/node; \
    node -e 'const fs = require("fs"); const path = require("path"); const pkgPath = "/usr/local/lib/node_modules/@huahua-ai/pi-organize/package.json"; const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")); const rawBin = pkg.bin; let piOrganizeEntry; if (typeof rawBin === "string") { piOrganizeEntry = rawBin; } else { const bin = rawBin && typeof rawBin === "object" ? rawBin : {}; piOrganizeEntry = bin.pi-organize; } if (!piOrganizeEntry) { throw new Error("Cannot find pi-organize bin entry in @huahua-ai/pi-organize package.json"); } const mountPath = process.env.MOUNT_PATH || "/opt/pi-organize"; function writeLauncher(name, entry) { const normalized = entry.replace(/^\.\//, ""); const target = path.posix.join(mountPath, "lib/node_modules/@huahua-ai/pi-organize", normalized); const nodeBin = path.posix.join(mountPath, "bin/node"); fs.writeFileSync(`/out/bin/${name}`, `#!/usr/bin/env bash\nexec "${nodeBin}" "${target}" "$@"\n`, { mode: 0o755 }); } writeLauncher("pi-organize", piOrganizeEntry);'

FROM scratch
COPY --from=build /out/bin/ /bin/
COPY --from=build /out/lib/ /lib/
