# 最新 Pi 的可选流程 IPD benchmark 入口

## 源码与范围

- 本机实际源码为 `/home/nepham/Agent/pi`；用户提到的 `/home/Agent/pi` 不存在。已核对 HEAD `e3a438af4cbd5d662ebe5471484f2f98f8d88deb`，原 Pi 工作区未修改。
- 新源码的 `createRun(..., runSkillId?)` 已允许省略业务 Skill；原生 `/ipd` 支持用户选择流程或交给 ST 自动选择。不能继续使用上一轮“业务 Skill 必填”的旧结论。
- 新增默认且必需的 `general-purpose` Profile，包含 Node 24.19.0、Python 3.12.14 与结构化数据工具；这道任务不需要 `office-pptx`。
- 单 Agent 旧 `/tmp/pi-single-control.wXrqHw` 已不在本次环境中；旧分数仅保留在 experiment 文档。本次脚本持久保存在 `experiment/effective-control-state-L5-036/ipd/`，操作文档是同级 `multi-agent.md`。

## 接入方式

- `prepare` 创建独立源码与 node_modules 快照，不修改原 Pi，不加载旧 Run/答案/评分反馈，不新增业务 Skill。题目从数据集重新导出。
- 只在快照内导出已有 `createDefaultService` 并调整 Docker CLI、Docker 配置和节点存储路径，将 Profile 目录限定为本题所需的 general-purpose；真实 ST、Designer、Runtime、Session、评审和最终封存逻辑复用 Pi 原实现。
- `controller.mjs select` 只保存流程选择，不创建 Run。选 0 后由 ST 选择；手动选 ProcessSpec 后调用 `createRunFromTemplates(..., undefined, selection)`，跳过 ST，但仍让 Designer 新建 Workflow。
- 控制器在服务受理后保持存活，轮询真正终态；全题期限为 4800 秒，systemd service 4830 秒提供清理兜底。暂停/阻塞结束本次独立尝试，不无界恢复。
- 只有 succeeded 的 Runtime finalSubmission 中唯一、哈希匹配的 effective_control_state.json 会被映射到 `state/workspace/output/`；不改 JSON 内容。失败时保留诊断和初始评分工作区。
- Session 用量聚合包含缓存读取/写入；分别报告请求的工具数和有结果的工具数，不重复累计流式增量；记录缺失 usage 和 compaction 数量。

## 总资源边界

- 本机 Docker Engine 已确认 systemd driver、cgroup v2，宿主 systemd running。
- 每个 trial 有独立顶层 slice：CPUQuota=200%、MemoryMax=4 GiB、MemorySwapMax=0。控制服务和 Docker 包装器创建的全部节点均归该 slice；包装器使用 Docker 原生 `--cgroup-parent`，保留节点原本的局部限制。
- Controller 和 Docker create 前会校验实际 cgroup 文件与进程所属路径；磁盘文件系统容量也在 Run 创建前校验。准备脚本创建 10 GiB ext4 loop 文件系统，包含项目、材料、Run、Session、Home、tmp、节点存储和配置。源码、镜像与 Docker 自身元数据不计入任务数据配额。
- DockerCli 会清理继承环境，不能只靠外部 DOCKER_HOST/DOCKER_CONTEXT 切换后端；此脚本限定本机 `/var/run/docker.sock` Engine。
- 当前 sudo 需要交互认证，无法在代理会话中执行安装 slice／loop mount 的真实验证。操作文档明确由用户运行 prepare；不能把这部分标成已验证通过。

## 验证与排障

- Shell/Node 语法检查、4 个定向 Node 测试通过：共享 cgroup 参数、拒绝覆盖父组、上游接口漂移拒绝、交付边界/哈希/歧义检查、跨 Session token 与工具统计。
- 隔离源码准备成功；真实服务工厂预检成功，businessSkill=null，模型 aliyun/qwen3.8-max；列出四个可执行 ProcessSpec。
- 自动选择 0 与手动选择 Minimal General Delivery 两条菜单分支均保存了正确配置，未创建 Run。
- 选择菜单的 EOF/取消返回非零，阻止启动器继续执行；已验证取消后没有 started.json 或 Run，避免误用上一次保存的流程选择。
- general-purpose 与评分镜像构建完成，测试镜像 tag 在 `/tmp/wb-ipd-preflight.PRjoRz/images.txt`。
- Docker Hub 对额外的 `docker/dockerfile:1` frontend token 请求曾返回 EOF。该通用 Dockerfile 只使用普通指令，因此实验快照去掉该 frontend 指令，使用引擎内置 frontend，重建成功；未修改上游 Dockerfile。
- 初次评分因 base image 中 `/workspace` 属于 UID 1000，而 verifier 使用 root，触发 Git dubious ownership。评分恢复初始文件后仅在容器内修正 `/workspace` 所有权，原始数据集不改。
- 修正后空答案评分成功，`no_pass`、0/653、reward=0，输出 `/tmp/wb-ipd-preflight.PRjoRz/verifier.eBEkK4`；普通用户可读取评分 JSON。这是管线测试，不是真实解题得分。
- 未配置共享 slice 的启动拒绝检查通过：在读取该 slice 的 cpu.max 时拒绝，未写 started.json、未创建 Run；没有调用模型。
- 未执行真实 IPD 模型请求、整题解题、付费 LLM judge 或 systemd/loop 的特权配置。
