```bash
    bash run-tools/score.sh 
    {
    "test_pass_rate": 0.5206,
    "overall": 0.5206,
    "reward": 0.5206,
    "tests_passed": 341,
    "tests_total": 655
    }
    Verifier output: /tmp/pi-single-control.wXrqHw/verifier.F0DAEY
```
```bash
    bash run-tools/score.sh judge.env 
    {
    "test_pass_rate": 0.5206,
    "overall": 0.6311,
    "llm_judge_component_score": 0.8889,
    "reward": 0.6311,
    "tests_passed": 341,
    "tests_total": 655
    }
    Verifier output: /tmp/pi-single-control.wXrqHw/verifier.hNKiEW
```

| 指标 | 本次结果 |
|---|---:|
| 执行时长 | **525 秒，即 8 分 45 秒** |
| 工具调用 | **9 次**：Bash 8 次、Write 1 次 |
| Agent 回合 | **8 回合**：7 个工具交互回合＋1 个最终回答 |
| 用户输入 | 1 条 |
| 输入 token，含缓存 | **194,335** |
| 输出 token | **22,610** |
| 总 token | **216,945** |