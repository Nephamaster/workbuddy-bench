# effective-control-state-L5-036：Pi-IPD 多 Agent 实验

本流程使用当前 Pi 的原生 `IpdService`、流程选择器、Workflow Designer、节点 Session、Docker Provider 和评审闭环。业务 Skill 省略。启动时提供流程选择菜单：选 `0` 由 ST 自动选择；手动选择某个 ProcessSpec 会跳过 ST，仍由 Designer 根据原始题目生成工作流，不使用预制任务答案或 Workflow。

2026-09-23 核对的 Pi 源码为 `/home/nepham/Agent/pi`，HEAD `e3a438af4cbd5d662ebe5471484f2f98f8d88deb`。当前环境不存在 `/home/Agent/pi`；准备命令可以显式传入其他实际源码路径。单 Agent 基线使用的是 `724049ef7...`，两个实验的代码版本不同，不能把全部差异归因于协作。

旧 `/tmp/pi-single-control.wXrqHw` 已不在当前环境。脚本保存在本仓库；下面将新实验放在 Git 忽略的 `.workspace/` 中，避免依赖临时目录。

## 1. 准备独立实验

在宿主 WSL/Linux 终端执行，使用平时能够访问 Docker 的非 root 用户：

```bash
cd /home/nepham/Agent/Benchmark/workbuddy-bench
runner=experiment/effective-control-state-L5-036/ipd/bench.sh
trial="$PWD/.workspace/ipd-control-001"
pi_source=/home/nepham/Agent/pi

bash "$runner" prepare "$trial" "$pi_source"
```

前提是本地 Docker Engine 使用 systemd cgroup v2、宿主启用了 systemd，且已安装 Node >=24、rsync、e2fsprogs、uv。脚本检查这些条件。Node 若不在自动发现的位置，可先设置 `PI_NODE_BIN=/绝对路径/node`。

`prepare` 会通过 sudo 挂载 10 GiB ext4 文件系统，并创建专用 systemd slice。Pi 模型配置从 `~/.pi/agent/` 复制到 `state/pi-agent/`；如使用其他配置目录，在准备前设置 `PI_BENCH_CONFIG_SOURCE`。真实凭据不进入镜像或 Git。

准备脚本拒绝覆盖已有实验。新尝试请使用新目录。

原 Pi 仓库不修改。实验目录包含当前源码、依赖的独立快照；仅在快照内：

- 导出已有 `createDefaultService`，供评测入口直接复用；
- 把 Docker CLI 指向本实验包装器，将所有新节点置于同一个 slice；
- 把节点存储和 Docker 配置放进本实验配额盘；
- 使用本次构建的 `general-purpose` Profile，不引入 PPT 环境。
- 通用环境的普通 Dockerfile 指令使用 Docker 内置 frontend，避免额外拉取 `docker/dockerfile:1`。

这些替换有严格源码匹配检查；未来 Pi 接口变化时准备会报错，不会静默使用错误适配。

## 2. 构建镜像

```bash
bash "$runner" build "$trial"
```

构建任务专属的 IPD `general-purpose` 镜像与 WorkBuddy 评分镜像。镜像 tag 含源码提交和 trial ID，不覆盖原来的 `pi-ipd/*:1.0.0`。

通用环境沿用最新 Pi Dockerfile：Node 24.19.0、Python 3.12.14、数据处理工具与 IPD bridge。下载使用构建参数指定的 TUNA 源。评分镜像沿用 WorkBuddy 锁定依赖；Harbor 从相同锁定提交的官方源码归档安装。

## 3. 不调用模型的预检

```bash
bash "$runner" check "$trial"
```

这一步核对镜像、模型配置、资产装配，并列出可选流程，不创建 Run、不发起解题模型请求。需要换模型时，在运行前修改 `$trial/state/pi-agent/settings.json` 的 `defaultProvider/defaultModel`；对应模型和认证仍须在隔离配置中可用。

若认证依赖环境变量，可在 `$trial/model.env` 放置必要的 `*_API_KEY` / `*_AUTH_TOKEN` / `*_OAUTH_TOKEN` 或代理变量，采用不带 shell 展开的 `KEY=value` 格式；不要把运行控制参数混入该文件。

## 4. 由你启动真实实验

```bash
bash "$runner" run "$trial"
```

启动后先显示实际注册的 ProcessSpec 菜单。例如：

```text
0: 由 ST 自动选择 IPD 流程
1: IPD-PTM ... API Software Release ...
2: Minimal General Delivery (...@2.0.0)
3: Important Meeting Presentation - Simple (...@1.0.3)
4: Reviewed Content Development and Delivery (...@2.0.0)
```

编号以实时菜单为准。要测试包括 ST 在内的完整 IPD 链路，输入 `0`。如果自行选择通用流程，选择 `Minimal General Delivery`；这是人工确定流程，不再额外让 ST 重选。此题无需 PPT 流程。选择后才会启动真实模型工作。

程序自动读取原始 `instruction.md`，将初始工作区作为只读任务材料传入，省略业务 Skill，让 Designer 编译工作流，然后等待执行、评审、返工与最终交付结束。无需人工粘贴题目或重复输入材料路径。

资源口径：

- 控制进程与所有节点容器共享 2 CPU、4 GiB 内存，swap 上限为 0；这是整题合计，而非每节点各得一份。
- 项目 Run、Session、工作区、节点存储、Home、临时文件等位于同一个 10 GiB 配额盘。源码、依赖、镜像和 Docker 自身元数据不属于任务可写数据。
- 整题业务期限 4800 秒；systemd 另提供 4830 秒硬截止与清理兜底。不是给每个节点各自 4800 秒。
- 未启用额外业务 Skill或外部搜索；流程设计和执行沿用当前 IPD。默认模型是隔离配置中的模型，run 默认 thinking 为 high；AgentCard 自身的 thinking 覆盖仍按 Pi 原实现生效。
- 运行前验证控制进程所在 cgroup 及实际资源文件；Docker 包装器在创建节点前再次验证，未生效则拒绝执行。

日志查看：

```bash
tail -f "$trial/state/logs/controller.log"
```

Run 回执中会打印只读 dashboard 地址。暂停、阻塞或失败会结束本次 benchmark 尝试，不自动重新开 Run、追加人工提示或无限恢复。Ctrl+C 会停止该实验的控制服务并清理带本 trial 标签的节点容器。

## 5. 查看产物与指标

成功交付后目标文件为：

```text
state/workspace/output/effective_control_state.json
```

程序从 Runtime 的 `finalSubmission` 清单选择唯一的目标文件，核对文件类型、目录边界和 SHA-256，再映射到评分目录；不修改 JSON 内容。未成功的 Run 不会把未批准候选冒充最终答案。Run 记录和封存候选保留用于诊断。

```bash
cat "$trial/state/logs/launcher-exit-code.txt"
cat "$trial/state/logs/timing.json"
cat "$trial/state/logs/metrics.json"
ls -lh "$trial/final-workspace.tar.gz"
```

`metrics.json` 汇总所有原生 Session 的最终 assistant usage，包含缓存读取／写入，区分工具请求与已记录的工具结果。规划、设计、执行、评审和返工均纳入；流式增量不重复计数。它统计已落盘的 usage，不代表供应商账单；没有 usage 的响应和压缩次数会单独记录。

正式状态位于 `state/logs/result.json`。完整 Run、Session、Workflow、评审和遥测位于 `state/project/.pi/ipd/`。

如需重新生成统计：

```bash
bash "$runner" metrics "$trial"
```

## 6. 评分

规则评分：

```bash
bash "$runner" score "$trial"
```

完整的 70% 规则＋30% LLM rubric 评分：

```bash
cp experiment/effective-control-state-L5-036/ipd/judge.env.example "$trial/judge.env"
chmod 600 "$trial/judge.env"
# 在 IDE 中填写 OpenAI Chat Completions 兼容的 judge URL、API key、模型 ID。
bash "$runner" score "$trial" "$trial/judge.env"
```

评分器与 Agent 分离，Agent 不接触 `tests/` 或 `gold/`。结果写入新建的 `verifier.XXXXXX/`，检查 `score.json` 的 `test_status`、`metadata.score_merge.applied` 以及各项诊断。退出码 0 不等于任务满分。

## 7. 结束后卸载配额盘

```bash
bash "$runner" cleanup "$trial"
```

此命令要求控制服务和本 trial 容器均已停止，只卸载数据盘、停止 slice；不删除 `state.ext4`、源码快照或评分结果。卸载后原始 Run 日志仍在数据盘内；需查看时重新挂载：

```bash
sudo mount -o loop,nodev,nosuid "$trial/state.ext4" "$trial/state"
```

## 验证范围

已检查最新可选业务 Skill 和流程选择接口；适配层定向测试、源快照准备、模型与流程工厂预检、镜像构建通过。最终评分冒烟和权限检查结果记在 `checkpoint/2026-09-23-ipd-benchmark-runner.md`。

宿主启用 systemd、Docker systemd/cgroup v2 已核实。当前会话的 sudo 需要交互认证，因此没有代你执行 loop mount、slice 安装或受限服务启动；这些步骤由你在终端执行。未启动真实 IPD 解题或付费 LLM judge。
