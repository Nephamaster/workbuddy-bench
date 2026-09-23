0. **导出题目和初始工作区**

    ```bash
    bench_root=/home/nepham/Agent/Benchmark/workbuddy-bench
    task_id=effective-control-state-L5-036
    task_dir="$bench_root/datasets/wb-bench-office-v1.0/tasks/$task_id"
    trial_dir=$(mktemp -d /tmp/pi-single-control.XXXXXX)

    mkdir -p "$trial_dir/workspace" "$trial_dir/logs"
    cp "$task_dir/instruction.md" "$trial_dir/instruction.md"
    cp "$task_dir/environment/workspace.tar.gz" "$trial_dir/initial-workspace.tar.gz"
    tar -xzf "$trial_dir/initial-workspace.tar.gz" -C "$trial_dir/workspace"

    sha256sum \
    "$task_dir/instruction.md" \
    "$task_dir/environment/workspace.tar.gz" \
    > "$trial_dir/input.sha256"
    ```

1. **设置路径，确认镜像**

   ```bash
   trial=/tmp/pi-single-control.wXrqHw
   tools="$trial/run-tools"

   docker image inspect pi-office-runtime:local pi-office-verifier:local \
     --format '{{.RepoTags}} {{.Id}}'
   ```

   镜像已建好。如果以后需要重建，执行：

   ```bash
   bash "$tools/build.sh" runtime
   bash "$tools/build.sh" verifier
   ```

   [Dockerfile](/tmp/pi-single-control.wXrqHw/run-tools/Dockerfile) 使用 Node 24、Python 3.12。运行时只读挂载你本机 `/home/nepham/Agent/pi` 的源码和依赖，因此**运行期间保持 Pi 源码不变**。

2. **初始化带磁盘上限的工作区**

   ```bash
   bash "$tools/prepare-state.sh"
   ```

   这一步会请求 sudo，用于挂载一个 **10 GiB ext4 文件系统**，然后：

   - 将现有材料复制到 `state/workspace/`。
   - 将必要的 Pi 模型配置、认证配置复制到隔离目录。
   - 为日志、Home、临时文件准备目录。

   **原来的 `workspace/` 保留；接下来实际执行的是 `state/workspace/`。**

   当前会继承你的默认模型：`aliyun / qwen3.8-max`。需要换模型时，修改：

   ```text
   /tmp/pi-single-control.wXrqHw/state/pi-agent/settings.json
   ```

3. **检查容器内的 Pi 和模型配置**

   ```bash
   bash "$tools/container.sh" check
   ```

   应显示 Pi 版本、Python 版本和模型列表。这一步不调用模型生成内容。

4. **正式执行单 Agent 测试**

   ```bash
   bash "$tools/container.sh" run
   ```

   **这一步才会实际消耗模型额度。** 脚本已经配置：

   - 合计 **2 CPU、4 GiB 内存**，不额外使用 swap。
   - 工作区等可写目录共用上述 10 GiB 文件系统。
   - **4800 秒**超时，即本题 2400 秒 × Office 默认倍率 2。
   - 禁用 IPD、扩展和自动 Skill 加载，使用单个 Pi Agent。
   - 自动读取完整 `instruction.md`，保存 Session、事件和退出状态。

   另开一个终端查看：

   ```bash
   tail -f "$trial/state/logs/events.jsonl"
   ```

5. **执行结束后，检查产物**

   ```bash
   cat "$trial/state/logs/exit-code.txt"

   ls -lh \
     "$trial/state/workspace/output/effective_control_state.json" \
     "$trial/final-workspace.tar.gz"
   ```

   最终 JSON 位于：

   ```text
   /tmp/pi-single-control.wXrqHw/state/workspace/output/effective_control_state.json
   ```

   `final-workspace.tar.gz` 是脚本自动封存的完整工作区。评分前不要人工修补答案。

6. **运行 WorkBuddy 原有评分逻辑**

   先做规则评分：

   ```bash
   bash "$tools/score.sh"
   ```

   脚本会输出一个 `verifier.XXXXXX` 目录，其中包含：

   ```text
   reward.json
   score.json
   results.xml
   test_output.txt
   agent.patch
   ```

   如果要这题的完整 **70% 规则分＋30% LLM 分**，准备 judge 配置：

   ```bash
   cp "$tools/judge.env.example" "$trial/judge.env"
   chmod 600 "$trial/judge.env"
   ```

   在 IDE 中填写该文件的三个变量：

   ```dotenv
   WORKBUDDY_VERIFIER_LLM_BASE_URL=
   WORKBUDDY_VERIFIER_LLM_API_KEY=
   WORKBUDDY_VERIFIER_LLM_MODEL=
   ```

   这里需要 **OpenAI Chat Completions 兼容的 judge 地址**；你当前 Pi 使用 Anthropic 协议，不能直接假定其地址可用于 judge。配置好后执行：

   ```bash
   bash "$tools/score.sh" "$trial/judge.env"
   ```

   查看新目录中的 `score.json`，确认 `metadata.score_merge.applied` 为 `true`。

**IPD 的目标流程相同，但当前不能直接套用这个启动脚本。** 源码中的 IPD 会另建节点容器，当前缺少同一题的总资源限制接入；还需要等待完整 Run 结束并回填最终产物。仅给这套命令加 IPD 扩展，不能保证符合相同题目预算。

核对结论已记录到 [checkpoint](/home/nepham/Agent/Benchmark/workbuddy-bench/checkpoint/2026-09-22-pi-external-office.md)。建议 commit 消息：`docs: record Pi external Office evaluation setup and validation`