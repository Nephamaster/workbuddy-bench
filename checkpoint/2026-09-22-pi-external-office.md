# Pi 外部执行 Office 单题的接入核对

- 目标题目：`effective-control-state-L5-036`；用户已经导出到 `/tmp/pi-single-control.wXrqHw`。
- 本机 Pi 源码位于 `/home/nepham/Agent/pi`。当前源码入口为 `packages/coding-agent/src/cli.ts`，用 Node 24 + tsx + 仓库 tsconfig 可直接运行；容器内报告版本 `0.87.0`。shell 未安装 `pi` / `pi-organize` 命令。不能把 `@huahua-ai/pi-organize` 当成已核实的本机安装产物。
- 原先说明中的 `bench-score` 是假设接口，仓库没有该命令。此次单题临时工具放在 `/tmp/pi-single-control.wXrqHw/run-tools/`，不修改已有 `configs/harnesses/pi-organize/`。
- 运行镜像 `pi-office-runtime:local` 使用 Node 24.19.0、Python 3.12 与题目 Python 依赖；只读挂载 Pi 的 packages/node_modules/配置入口文件，不挂整个用户 Home 或 benchmark 数据集。通过 tsx 使用当前源码，运行期间需保持该源码不变。
- `prepare-state.sh` 计划创建 10 GiB ext4 loop 文件系统，工作区、日志、配置、Home 和临时目录均放在该文件系统内；挂载需用户本机 sudo。原始 workspace 保留，实际执行结果在 `state/workspace`。此挂载步骤尚未执行。
- 单 Agent 容器限制合计 2 CPU、4 GiB、不额外使用 swap；rootfs 只读；默认任务截止时间为 Office 默认倍率后的 4800 秒。新配置目录只复制模型和认证配置以及必要设置，不复制扩展、Skill 或历史 Session。
- 当前 IPD 的 Docker Provider 为每个节点创建独立容器。各节点 `--cpus` / `--memory` 不会自动合并为单题总额；当前源码未提供共享 cgroup parent 的接入。`createRun()` 返回受理回执，服务关闭会暂停未完成 Run。因此单 Agent 脚本不能直接加 `-e ipd-extension.ts` 就声称得到了同资源预算的完整 IPD benchmark。
- Office `tests/test.sh` 是占位符。临时评分器复用数据集 `build_registry`、rule command、CompositeVerifierEngine 和 finalize_score，在独立评分容器恢复原始 Git baseline 后导入整个最终工作区。规则命令必须由 Bash 执行（含 Bash array/herestring），不能直接落到 `/bin/sh`。
- 本题完整分数是 0.7 规则分 + 0.3 LLM rubric 分；没有配置 `WORKBUDDY_VERIFIER_LLM_*` 时仅规则评分。LLM judge 要求 OpenAI Chat Completions 兼容路由，不能默认把 Pi 的 Anthropic provider 地址原样当 judge 地址。

## 验证范围

- 已通过：Shell/Node 脚本语法检查；源码 CLI 容器启动；完整运行镜像构建；断网容器内假 OpenAI 服务驱动两次交互及原生 write 工具产物检查。
- 构建排障：默认 Debian 源停在 apt Packages 下载，取消本次构建后改用 Pi 原 Dockerfile 使用的 TUNA 源，apt 和运行镜像构建完成。基础镜像下载已成功，不能把此问题归因于 Docker registry。
- 已通过：评分镜像 `pi-office-verifier:local` 构建；独立空答案样本完整评分，`test_status=no_pass`、`test_pass_rate=0.0`、`tests_passed=0`、`tests_total=653`，正常生成 reward/score 文件。最终可由普通用户读取的测试目录为 `/tmp/pi-office-score-smoke.4OsuXk/verifier.igNDFl`，不是用户真实解题结果。
- 评分文件归属：ArtifactWriter 用 mkstemp 原子写 JSON，root 评分容器会留下 root:0600 的输出。score.sh 在容器 EXIT trap 中将本次日志目录归还调用者 UID/GID；已重跑评分并验证普通用户读取成功。
- 容器内 LLM 路由：数据集 LLM runner 原本在宿主执行，会把 host.docker.internal 改为 localhost；临时适配器在评分容器内先将该主机名解析为网关 IP，避免地址被错误改写。真实 LLM judge 尚未执行。
- 评分构建排障：Harbor Git smart-HTTP 拉取出现 GnuTLS recv error / early EOF；改为导出 uv.lock 中其他依赖的版本与哈希，并从官方 codeload 下载相同锁定提交 `527d50deb63a5d279e8c20593c18a2cbc7f61f9e` 安装 Harbor 0.18.0，评分构建完成。未修改项目原始 uv.lock。
- 未执行：真实模型解题、付费 LLM judge、IPD 完整 Run、10 GiB loop mount。
