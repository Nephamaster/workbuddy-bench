# WorkBuddy Bench Office：Hard 任务汇总

这是 Office 场景下的 13 个 Hard 任务的原始指令和简要分析。

目前我从 13 个 Hard 级别任务中通过主观判断筛选出 4 个可以用于验证的任务，在标题后用 ★ 标识，具体是第 4、6、7、11 个任务。

## 1. cloudagent-sdk-doc-validation-report

Category: automation-workdir    |    metadata.difficulty: hard

### 原始 Instruction

```markdown
我要核对这套 CloudAgent SDK 文档包的准确性，不是泛泛看一遍 README。请只使用本任务目录内的 SDK 文档核对包，把 `input/workspace/` 里的 docs、examples、静态 API 行为样例、schemas、auth/setup/config notes、existing validation notes、test report/log 和 changelog 逐项对上，生成一份结构化 Markdown 验证报告到：
`input/workspace/output/validation_report.md`

处理要求：
- 只创建或更新 `input/workspace/output/validation_report.md`；不要修改 docs、examples、mock_api、config、reports、CHANGELOG 或任何未列入允许清单的文件。
- 不需要启动 offline sample interface，不需要访问 live network、private service、真实 registry、真实 API、浏览器、MCP、Skill、私有账号或外部 URL；`127.0.0.1`、`example.invalid`、`registry.local` 只作为静态样例文本处理。
- 这里不接入真实 personal key / enterprise key；如果材料中出现 placeholder token profile、scope 或 key 类型说明，只按静态样例和 auth boundary 核对，不要生成、请求或填入真实凭证。
- 报告中请保留必要的 English SDK/API terms，例如 `endpoint`、`operationId`、`schema`、`auth`、`runner:read`、`test report`、`validation report`。
- 不要只依赖某一个 README、prior notes 或 test log；请在文档、examples、OpenAPI/schema、静态 behavior samples、auth/setup/config、logs 和 changelog 之间交叉核对。
- 需要区分 product/documentation issue、example issue、security/auth boundary note、setup/environment blocker、known optional/non-issue distractor 和 unresolved question。
- 对关键结论给出本地文件路径或稳定 anchor/caseId/node ID citations；如果证据冲突或不足，请写入 unresolved questions，不要编造。
`validation_report.md` 至少包含以下部分：
1. Executive summary
2. Artifact inventory and scope
3. Claim-to-evidence matrix
4. Discrepancy findings
5. Setup/environment blockers separated from product/documentation issues
6. Security/auth boundary notes
7. Recommendations
8. Unresolved questions

最后请用简短中文回复：报告路径、是否只更新了允许的报告文件、是否未访问 live/private service，以及是否还有 unresolved questions。
```
### 任务介绍

这是一个“多源技术文档一致性审计”任务。Agent 需要在 25 个离线文件之间建立 claim-to-evidence 对照关系：SDK 文档、examples、OpenAPI、JSON schema、静态行为样例、auth/setup/config、测试日志、历史 validation notes 和 changelog 之间可能互相支持，也可能出现冲突。最终不是简单总结，而是要区分产品/文档问题、示例问题、安全与鉴权边界、环境阻塞、可忽略干扰项和未决问题，并给关键结论提供稳定的本地证据锚点。

它的难点主要是“证据层级 + 冲突消解 + 完整覆盖”，而不是单文件阅读。一个很自然的多智能体拆分是：API/Schema 专家、Example/Test 专家、Auth/Security 专家分别建立局部证据链，再由 Integrator 合并 claim-to-evidence matrix，最后由 Reviewer 检查结论是否被足够证据支持、是否把环境问题误判成产品缺陷。它属于中长程任务，尤其适合测试多专家在共享证据空间中的一致性控制。

## 2. cross-week-dashboard-migration

Category: doc-ops    |    metadata.difficulty: hard

### 原始 Instruction

```markdown
你是一个沉稳、靠谱、严谨的运营周报助理。请只使用本任务目录内的 Week 21 运营迁移资料包，把 Week 20 的工作状态迁移到 Week 21；交付要简洁直接，不要写成泛泛的分析报告。

先读并确认边界：
- `input/weekly_ops_workspace/README_先读我.md`
- `input/weekly_ops_workspace/00_calendar/`
- `input/weekly_ops_workspace/file_roles_and_preservation.md`

执行以下操作：
1. 更新 `input/weekly_ops_workspace/01_reports/2026-W21_ops_report_template.md`。
2. 同步 `input/weekly_ops_workspace/02_dashboard/status_dashboard.html`：可见 DOM 文本、`data-*` 状态、summary counts、reminder anchors，以及内嵌的 `chart-spec-status-mix` JSON 和 `data-binding-map` JSON 都要和周报一致。
3. 整理 `input/weekly_ops_workspace/03_reminders/week21_followups_draft.txt`，让提醒内容和 Week 21 周报、dashboard 状态对齐。

迁移口径：
- 以 Week 20 运营周报、Week 21 template、calendar/config、team calendar notes、oncall handover、vendor window note、reminder draft 和 dashboard HTML 交叉核对；不要只复制一个表，也不要只改其中一个文件。
- completed 历史项只保留为历史上下文，不要重新打开成 active work。
- unresolved/open、deferred、blocked、follow-up 和 watch-only 事项，按工作区日历、来源优先级和提醒规则跨周承接；未确认或只有观察价值的内容要保留边界说明，不要写成已完成。
- 如果来源冲突，按优先级处理：calendar/config 和 Week 20 narrative 高于 scratch export；sent reminder history 和 archive 只能作为背景，不要覆盖新周迁移口径。
- Dashboard 是 text-first 状态看板，不是截图或视觉设计任务。同步 DOM/text、`data-item-id`、`data-state`、`data-target-section`、summary counts、reminder anchors、`chart-spec-status-mix` JSON 和 `data-binding-map` JSON；不要做 OCR、VLM、像素级检查或视觉重绘。
- Reminder draft 需要体现 no-meeting day 的提前/改期规则、partner check-in timing、blocked 外部审批、deferred reason，以及不应提醒的 completed/noise/stale export 项。

文件边界：
- 只能修改这三个目标文件：
  - `input/weekly_ops_workspace/01_reports/2026-W21_ops_report_template.md`
  - `input/weekly_ops_workspace/02_dashboard/status_dashboard.html`
  - `input/weekly_ops_workspace/03_reminders/week21_followups_draft.txt`
- 不要修改、移动、删除或覆盖 `00_calendar/`、`01_reports/archive/`、`02_dashboard/assets/`、`03_reminders/sent/`、`04_notes/`、`tmp/`、`README_先读我.md` 或 `file_roles_and_preservation.md`。
- 不要把所有信息合并成一个新文件；不要创建额外交付物、额外汇总文件、检查文件、PPT/deck/image、外部调用记录或另建状态台账。

最后请用简短中文回复：更新了哪些文件、哪些项目被跨周承接、哪些冲突或待确认状态仍保持边界，并确认未修改非目标文件。不要访问外部 API、网页、浏览器、远程业务系统、私有账号、VPN 或其他工作区外系统；不要引用本工作区材料之外的事实，不要写入 private paths、private URLs、账号标识、credentials、tokens 或未公开材料。
```
### 任务介绍

这是一个跨周运营状态迁移任务，要求把 Week 20 的真实工作状态迁移到 Week 21，并同时保持周报 Markdown、HTML 状态看板和 follow-up reminder 三个交付物一致。Agent 需要综合 calendar/config、上周 narrative、on-call handover、vendor window、sent reminder history 和 scratch export，区分 completed、open、blocked、deferred、watch-only 等状态，再把同一状态同步到可见 DOM、data-* 属性、summary counts、内嵌 JSON 和提醒文本中。

难点在于维护一个跨文件共享状态机：同一事项的状态、原因、时间窗口和提醒策略必须在三个表面上保持一致，且旧周、archive 和 stale export 不能覆盖更高优先级来源。多智能体可以自然拆成状态迁移/时间规则分析、Dashboard 绑定更新、Reminder 策略三个执行角色，再由统一 Reviewer 做 cross-artifact consistency check。它很适合检验多智能体系统能否避免局部修改正确、整体状态却漂移的问题。

## 3. daily-creation-checkpoint-recovery

Category: automation-workdir    |    metadata.difficulty: hard

### 原始 Instruction

```markdown
请接手这份“每日创作检查点恢复”工作区，从已经留下的 current / handoff / state 线索继续整理状态，不要从头重做创作任务，也不要替我补写新的成稿内容。

先读 `input/workspace/README_先读我.md`，再按 `input/workspace/state/update_boundaries.json`、`environment/local_progress_state/README.md`、`environment/state_diff_manifest.json` 和 `environment/workspace_surface_manifest.json` 里的公开边界处理。`current/`、`state/`、`handoff/` 是本轮恢复的主要依据；`archive/`、`scratch/`、`drafts/` 和 `read_only/` 只能帮助解释旧记录、别名、冲突或已有草稿承接情况，不能单独覆盖较新的工作区状态。

只允许更新这些文件：
- `input/workspace/current/daily-log-continue.md`
- `input/workspace/state/creation_state.current.json`
- `input/workspace/state/progress_state.progress.json`
- `input/workspace/handoff/reviewer-questions.md`（仅在需要补充 reconciliation / review 说明时更新）
- `environment/local_progress_state/progress_capture.json`

不要修改 `drafts/`、`read_only/`、`archive/`、`scratch/`、当前检查点、活动板、source notes、交接决策、manifest 或未列入上方清单的任何文件。

处理时请把重点放在恢复和纠偏上：已完成或已有草稿承接的内容要保留为 preserved/current；旧 pending、旧影子状态、重复/alias 线索只做归并、待确认或下一步说明，不能扩展成新的完成项或二次执行记录。等待素材、review 或 blocker 仍然要在 Markdown、JSON/progress-state 和 `progress_capture.json` 中可见，不得改写成 done、遮蔽原因或伪造来源。

更新后，`daily-log-continue.md`、`creation_state.current.json`、`progress_state.progress.json`、必要的 `reviewer-questions.md` 和 `progress_capture.json` 要在 item、状态、原因、证据引用和下一步层面一致。`progress_capture.json` 只记录本轮实际工作区文件状态、更新过的文件和 no-live-service confirmation；不要写外部服务结果、未公开目标状态或额外恢复模板。

所有副作用都只能体现在上述允许的 Markdown / JSON / progress-state / 状态快照文件中。不要调用真实创作平台、素材库、任务管理系统、浏览器后台、网络 URL、外部 API、私有账号或任何 live service；不要引用私有路径、真实人名、邮箱、账号、请求/会话 ID、凭据、客户数据、专有代码或本工作区之外的事实。

最后请用简短中文回复：更新了哪些允许文件，恢复/纠偏/重复抑制/阻塞保留的概况，Markdown 与 JSON/progress-state/capture 是否已同步，以及是否遵守 no-live-service 边界。
```
### 任务介绍

这是一个“从中断现场恢复工作状态”的长程状态重建任务。工作区里同时存在 current、state、handoff、archive、scratch、drafts、read_only，以及多个 manifest 和 progress snapshot。Agent 必须判断哪些信息代表当前权威状态，哪些只是旧影子、alias、重复线索或历史草稿，并在不重新执行创作任务、不补写新内容的前提下，把恢复结果同步到 Markdown、两个状态 JSON、必要的 reviewer questions 和 progress capture。

真正困难的是状态权威判断和重复抑制：旧 pending 不能被重新执行，已有草稿承接不能被误判为未开始，blocker 也不能为了“完成”而改写成 done。多智能体很适合采用 Authority/State Analyst、Alias & Duplicate Reconciler、Progress Synchronizer 与 Reviewer 的结构。这个任务对“任务中断后的上下文恢复、跨表面状态同步、错误历史状态向后传播”有很强测试价值。

## 4. deepep-api-source-anchor-explain ★

Category: automation-workdir    |    metadata.difficulty: hard

### 原始 Instruction

```markdown
请只使用本任务目录内提供的公开源码包做代码探索，不要改输入仓库。目标是给 `nimbuspipe.route_async(...)` 补一份可追溯的中文源码锚点说明，方便我把当前实现依据写进技术说明里。

重点工作区：`input/nimbuspipe_workspace/`

请新建并保存一个中文 Markdown 文件：`source_anchor_report.md`

探索重点：
- `nimbuspipe.route_async(...)` 的当前入口在哪里，导出/包装/绑定关系如何串起来。
- 哪些源码、生成文件、header/interface、运行时提交、队列/状态、后端选择和具体实现候选能够直接支撑判断。
- 哪些 docs/notes/examples/tests/tools 只能作为背景或辅助线索，不能单独证明当前实现路径。
- 如果文档、说明、示例或测试和当前源码说法不一致，请说明以哪类证据为准，以及为什么。
- 对名字相近、看起来相关但不能证明 `nimbuspipe.route_async(...)` 当前调用链的材料，请给出简短排除或降级理由。

报告需要包含这些清晰部分，标题可以等价改写：
1. `结论摘要`
2. `证据链`
3. `文档与源码不一致处`
4. `候选材料排除`
5. `未确认事项`
6. `未使用外部/运行能力声明`

证据要求：
- 每个关键结论都必须引用仓库相对源码锚点，例如 `input/nimbuspipe_workspace/path/to/file.ext#Lx-Ly` 或 `input/nimbuspipe_workspace/path/to/file.ext::symbol`。不要只写“源码里有”这类笼统描述。
- 输出为中文，必要的 English API、code identifier、symbol、repo-relative path 可以保留原样。
- 如果某个行为只能从仓库中提供的公开材料中部分确认，请写成 caveat，不要编造。

边界要求：
- 不得修改、删除、重命名、覆盖或重新生成 `input/nimbuspipe_workspace/` 下的任何输入文件；除指定 Markdown 输出外，不要创建其他交付文件。
- 不得运行或编译代码，不得调用外部网络、真实服务、私有仓库、账号后台、GPU runtime、OCR、VLM、图片/音频/视频理解、MCP、Skill 或任何 live service。
- 不得引用非公开路径或 URL、真实身份/账号信息、凭证、客户数据、专有代码、未公开素材或原始私有记录。
```
### 任务介绍

这是一个大规模静态源码溯源任务。工作区包含 100 余个源码、generated binding、header/interface、runtime bridge、backend、queue/state、docs、release notes、examples、tests 和维护笔记。目标不是运行代码，而是仅通过静态证据追出 `nimbuspipe.route_async(...)` 从 Python 入口到导出/包装/绑定、运行时提交、队列状态、backend 选择和具体实现候选的当前调用链，并区分“可直接证明当前实现”的一级证据与只能作为背景的文档/示例/测试材料。

难点是仓库探索范围大、名称相近的候选多，而且要求每个关键判断都给到源码锚点并解释冲突时为什么信任某类证据。多智能体可以分成 API Surface Analyst、Generated Binding/Native Bridge Analyst、Runtime/Queue Analyst、Backend Implementation Analyst，最后由 Evidence Reviewer 合并为一条可审计证据链。对于测试专家分工、局部探索结果汇总和跨模块 grounding。

## 5. delivery-package-readonly-diff

Category: automation-workdir    |    metadata.difficulty: hard

### 原始 Instruction

```markdown
请对候选 Edu Toolkit 发布包进行一次只读交接审计。只使用这个交付包中已经存在的文件，所有包内材料都保持只读，并且只生成一份报告：`input/workspace/output/package_audit_report.yaml`。

这项工作应当像最终归档/附件之前的一次 package diff：将 reference manifest 与 candidate package view 进行对比，标出 missing / extra / changed / matching / inconclusive 项，并判断该候选包是否可以原样附加。不要修复这个包，不要重新打包，也不要创建第二个交付物。

请先读取：
- `input/workspace/README.md`
- `input/workspace/reference_release_manifest/reference_manifest.csv`
- `input/workspace/reference_release_manifest/manifest_notes.md`
- `input/workspace/candidate_package_view/archive_metadata.json`
- `input/workspace/candidate_package_view/listings/candidate_archive_listing.csv`
- `input/workspace/candidate_package_view/listings/candidate_tree_view.txt`
- `input/workspace/analysis_notes/README.md`
- `environment/local_readonly_audit/README.md`
- `environment/state_diff_manifest.json`

然后对 reference manifest、candidate listing/tree view、archive metadata、hash notes、path-probe notes 和带噪声的 partial comparison log 进行交叉核对。不要只依赖 noisy log；它并不完整，并且包含陈旧记录。

以下输入受保护，不得修改：
- `input/workspace/reference_release_manifest/`
- `input/workspace/candidate_package_view/`
- `input/workspace/analysis_notes/`
- `environment/`

允许的输出：
- 只能更新 `input/workspace/output/package_audit_report.yaml`。

不得编辑、删除、重命名、覆盖、以复制方式修复或重新打包任何源包材料。不要创建修复后的 archive、attachment、patch、包副本或额外交付物。不得使用网络访问、真实 package registry、云存储、浏览器服务、私有账号、凭据、OCR、图片/音频/视频理解、VLM 判断、外部工具 connector 或任何 live service。

YAML 报告至少必须包含：
- `readonly_confirmation`
- `evidence_sources_used`
- `summary_counts`，其中包含 `missing`、`extra`、`changed`、`matching` 和 `inconclusive`
- `findings.missing`、`findings.extra`、`findings.changed`、`findings.matching` 和 `findings.inconclusive`
- `recommendation.status`、`recommendation.rationale` 和 `recommendation.no_repack_performed`
- `assumptions`
- `open_questions`
- `ordering_policy`

对于每一条 finding，需包含规范化后的 package path、可用时对应的 manifest ID、可见证据依据以及简短说明。各 bucket 按以下顺序排列：missing、extra、changed、matching、inconclusive；每个 bucket 内的路径按规范顺序排序。

Recommendation policy：
- 仅当不存在任何阻塞性的 missing、extra、changed 或未解决的 inconclusive 项时，才能使用 `ready_to_attach`。
- 如果仍存在任何阻塞性的 missing、extra、changed 或未解决的 inconclusive 项，则使用 `revise_before_handoff`。
- 如果证据相互冲突，或只能获得陈旧/不完整的证据，则将该项记录到 `findings.inconclusive`，并附上 open question；任何未解决的 inconclusive 项都会阻止 `ready_to_attach`。

最后请简短回复：你更新的报告路径、源材料是否保持只读、recommendation status，以及是否仍存在未解决的 handoff blocker。不要引用这个只读交付包之外的事实。
```
### 任务介绍

这是一个发布包交接前的只读差异审计任务。Agent 需要对照 reference manifest、candidate archive listing/tree、archive metadata、hash notes、path-probe notes 和一份带陈旧噪声的 partial comparison log，把每个对象分类为 missing、extra、changed、matching 或 inconclusive，并据此判断候选包是否可以直接归档/附件。所有源材料都必须只读，唯一允许的副作用是更新一个 YAML 审计报告。

难点在于“多证据一致性”和“不确定性处理”：不能把 noisy log 当真相，也不能在证据不足时强行二分为 match/mismatch；inconclusive 还会直接影响最终 gate。适合拆为 Manifest/Listing Diff Agent、Hash/Path Evidence Agent、Noisy-log Reconciler，再由 Release Auditor 统一做阻塞性判断。它的执行链不算最长，但很适合测试多智能体系统的保守决策、证据冲突处理与最终审计一致性。

## 6. effective-control-state-L5-036 ★

Category: doc-ops    |    metadata.difficulty: hard

### 原始 Instruction

```markdown
# 有效控制状态重建

请读取当前工作目录下的受控流程文件包，按截至 2026-08-20、适用站点"华南冷链库"、适用角色"夜班QA复核员"的口径， 重建 PROC-CC-036 的当前有效 control state，并写入 `output/effective_control_state.json`。输入包含基础流程、签署站点附录、 多份监管通知（含追溯生效附件和后续收紧通知）、培训释放矩阵、事件摘要、FAQ、附录表、文档 register、归档旧版和未签署草案。 不能只取最新文件，也不能只做摘要；必须输出可审计的对象图，包括当前有效 controls、inactive/superseded objects、 冲突解决 register、appendix bindings、角色条件性覆盖、追溯生效行动 和 summary。

输出 JSON 顶层必须包含 `metadata`、`control_states`、`inactive_controls`、`conflict_register`、`appendix_bindings`、 `role_specific_overrides`、`retroactive_actions`、`summary`，共 8 个顶层字段。 `metadata` 至少包含 case_id、as_of_date、target_site、target_role、source_root、output_path、authority_order、excluded_statuses、source_docs_used。 `control_states` 中每个 control 必须包含 control_id、title、effective_steps、active_warnings、bound_appendices、inactive_refs、source_doc、authority_level、site_scope、role_scope。 每个 effective step 必须包含 step_id、text、source_doc、authority_level、applies_to、training_gate。 `inactive_controls` 必须保留被取代、归档、FAQ-only、未签署草案、superseded notice 以及训练未完成而对目标角色 pending 的步骤， 并说明 inactive_reason、replaced_by、source_doc、status。 `conflict_register` 必须记录每个冲突对象的 losing_source、winning_source、active_winner、resolution 和是否需要人工备注。 `appendix_bindings` 必须把 APP-A/APP-B/APP-C 绑定到实际使用的 controls 与 required_rows。 `role_specific_overrides` 列出**非目标角色**因为已完成各自培训而进入更严格步骤的覆盖关系，每条记录 role、site、control_id、 base_step_id、overriding_step_id、training_evidence_id、training_release_date、notice_effective_date、effective_for_role_from、reason； 若**目标角色**的对应培训在 as_of_date 之前未完成，目标角色不出现在 role_specific_overrides 中（仍按 base_step_id 执行）。 `retroactive_actions` 列出 issue_date 在 as_of_date 前但 retroactive_effective_date 更早的监管通知所触发的历史记录重分类， 每条记录 action_id、source_doc、issue_date、retroactive_effective_date、as_of_date、affected_record、affected_record_event_date、 original_severity、new_severity、trigger_rule、paired_with、paired_with_event_date、rationale。

判定规则：监管通知 > incident-triggered control > 签署站点附录 > training_gate > 基础 SOP > FAQ。FAQ 只能解释格式或历史示例，不能覆盖硬性阈值； archive、unsigned draft、future training、superseded notice、训练对目标角色 pending 的更严格步骤都不能成为目标角色的 active step， 但必须在 inactive 或 conflict 中保留可追溯信息。请根据 document_register、各文件生效日期/状态、training_release_matrix、incident_digest、 目标站点/角色和 as_of_date 判断哪些通知、培训、事件触发控制当前对目标角色生效，哪些对象已经被替代或尚未生效。

特别口径：
- 追溯生效（retroactive supersession）：当 issue_date 在 as_of_date 之前、retroactive_effective_date 更早的监管通知文件存在时， 该通知中的步骤自 retroactive_effective_date 起生效，需进入 control_states.effective_steps；同时该通知所覆盖的历史 incident 行 （事件日期落在 retroactive 窗口内）必须按新规则重分类，并在 retroactive_actions 中记录原值/新值/配对依据。
- 训练-生效错窗（training-effective overlap window）：当一份监管通知已生效但其要求的角色培训 release_date 在 as_of_date 之后， 则该通知步骤对目标角色 pending（status=training_pending_target_role），目标角色仍按上一版本步骤执行； 已完成同一通知对应培训的非目标角色按新通知执行，并在 role_specific_overrides 中列出。
- 角色条件性再培训触发（role-conditional retraining）：监管通知可对不同角色设置不同的培训前置条件；不同角色的有效步骤可不同， role_specific_overrides 用于声明非目标角色的更严格步骤。

不要只按文件名或最新日期取用规则。
```
### 任务介绍

这是 13 个 hard 任务中最典型的高复杂度规则状态重建任务之一。Agent 要从 17 个受控文件中重建指定日期、指定站点、指定角色的当前有效 control state，同时处理监管通知、incident-triggered control、签署站点附录、training gate、基础 SOP、FAQ、归档版本和未签署草案之间的优先级。更复杂的是存在 retroactive supersession、training-effective overlap window 和 role-conditional retraining：后读到的监管规则可能追溯性地改变历史 incident 的分类，不同角色也可能因培训完成时间不同而执行不同步骤。

它天然适合多专家协作：Regulatory/Temporal Analyst 负责通知及追溯窗口，Role/Training Analyst 负责角色门控，Incident Analyst 负责事件触发与历史重分类，Appendix/Control Analyst 负责规则绑定，Integrator 形成对象图，再由 Reviewer 检查冲突 register 和 active/inactive 边界。前序判断一旦出错会系统性污染后续状态，因此它非常适合测试“执行-评审”是否能抑制 trajectory drift。

## 7. invoice-email-archive-manifest ★

Category: data-file-ops    |    metadata.difficulty: hard

### 原始 Instruction

```markdown
# 票据邮件归档与清单生成

请把这次邮件导出归档资料包当作一次性票据整理任务来处理：目标是从已经导出的邮件、附件清单、运营备注和历史失败输出里，找出可归档的发票/单据，按规则复制到 `input/workspace/archive_out`，并生成一份机器可读的归档 manifest JSON 和一份人工可读的 Markdown 报告。
原始需求的口径是“巡检近 7 天票据邮件、按技能规则搜索电子发票/行程单/酒店水单/打车票据、去重后整理到票据目录并输出清单”。本任务已经把邮箱和附件内容冻结成离线工作区，所以你只需要处理包内材料；不要连接真实 QQ 邮箱、网页登录、邮件 API 或任何在线服务。

## 工作区边界

- 只能读取这些受保护目录：`mail_export/`、`inventory_shards/`、`ops_notes/`、`failed_exports/`、`stale_outputs/`、`scratch/`。
- 只能修改 `archive_out/`。不要在其它目录新增、删除、重命名或改写文件。
- 对源文件一律 copy-not-move：需要归档时复制到 `archive_out/`，不要移动、删除或覆盖原始邮件、附件、清单、备注。
- `stale_outputs/` 和 `failed_exports/` 只能作为历史参考或反例，不能当作权威结果直接沿用；如复用其命名或内容，必须在新输出中去冲突并说明判断依据。
- 这是离线交接材料处理任务：不得访问在线服务、外部邮箱、云盘、网页后台、网络 API 或真实账号。
- 不要做 OCR 或视觉模型识别（no OCR / no VLM）。如遇 PDF，以工作区内已有的 text-first sidecar 或可读取文本为准；没有足够文本证据时放入需要复核或缺失引用类别并说明原因。

## 需要完成的输出

请只在 `input/workspace/archive_out` 下写入或更新结果。至少需要：
1. `input/workspace/archive_out/validation/archive_manifest.json`
2. `input/workspace/archive_out/validation/archive_report.md`
3. 必要时，在 `archive_out/candidate_docs/`、`archive_out/needs_review/`、`archive_out/reference_only/`、`archive_out/missing_refs/` 中放置复制出的文件或占位说明。可使用已有桶名，不要新增受保护目录外的其它结果根目录。

推荐桶含义：
- `candidate_docs/`：证据足够、可作为候选归档的发票/单据文件副本。
- `needs_review/`：存在冲突、弱关联、字段不完整或需要人工复核的文件/记录。
- `reference_only/`：能解释关系但不应作为发票/单据归档主体的邮件、备注或辅助材料。
- `missing_refs/`：邮件或清单提到但资料包中的源文件不存在、无法确认或不能安全复制的引用。
- `validation/`：manifest、报告、读回校验说明等验证输出。

## 归档处理口径

- 优先根据邮件线程、附件引用、inventory shard、ops note 和可读文本建立“邮件/附件/单据”关系；不要只看文件名。
- 对可能重复的票据，按 `message_id`、`attachment_ref_id`、最终文件名、文档号、日期、金额、供应商别名等证据综合去重，并用 `duplicate_group` 标记。
- 对正文链接、附件引用、历史失败缓存、缺失源文件或 base64/sidecar 证据不足的情况，要保留定位信息和判断理由；不能安全复制时不要硬补文件。
- 如果某个附件或记录像票据但证据不够，请放入 `needs_review/` 或 `missing_refs/`，不要为了凑归档结果而编造字段。

## manifest JSON 格式

`archive_manifest.json` 必须是可解析 JSON。顶层建议使用对象，并包含 `rows` 数组；如果增加 `summary` 或 `readback_validation` 等字段，也必须与 `rows` 和报告一致。
`rows` 中每条记录都必须包含以下字段，即使值为空也要保留字段名：
- `row_id`
- `record_status`
- `archive_bucket`
- `source_path`
- `source_exists`
- `message_id`
- `thread_id`
- `attachment_ref_id`
- `relationship_trace`
- `link_confidence`
- `exception_reason_codes`
- `conflict_sources`
- `decision_rationale`
- `doc_type`
- `document_id`
- `vendor_alias`
- `document_date`
- `amount_cny`
- `duplicate_group`
- `archive_path`
- `notes`

字段填写要求：

- `source_path` 和 `archive_path` 使用相对 `input/workspace` 的路径或清楚标注的工作区相对路径。
- `source_exists` 用布尔值表达资料包中的源文件是否存在。
- `relationship_trace` 简要列出你依据了哪些邮件、附件引用、清单 shard、备注或历史失败线索来建立关系。
- `link_confidence` 使用稳定的等级或数值口径，并在报告中解释。
- `exception_reason_codes` 用数组记录异常原因，例如源缺失、弱关联、字段冲突、重复组、历史输出冲突、非归档主体等。
- `conflict_sources` 列出发生冲突的信息来源；没有冲突时使用空数组。
- `decision_rationale` 写清为什么放入该 bucket、为什么复制或不复制、为什么需要复核。
- `duplicate_group` 用于标记你认为属于同一发票/单据或同一重复候选组的记录；无重复可为空。

## Markdown 报告要求

`archive_report.md` 应用中文为主，结构清晰，至少覆盖：
- 处理范围和边界确认。
- 归档决策口径：如何使用邮件线程、附件引用、inventory shard、ops note、失败/陈旧输出。
- 各 bucket 的记录概览，但不要虚构证据。
- 主要冲突、缺失、弱关联和重复候选的说明。
- `readback_validation`：说明你已经读回或复核了新 manifest 与目录状态，包括 JSON parse、报告与 manifest 一致性、源文件保留、只修改 `archive_out`、替换/去冲突 stale output、未使用 live service、未使用 OCR/VLM。

## 完成前自查

- `archive_manifest.json` 可以 JSON parse。
- 报告中的 bucket、异常和记录口径与 manifest 一致。
- 所有源文件仍保留在原位置，没有被移动或删除。
- 修改只发生在 `archive_out/` 下。
- 新输出没有直接沿用旧的 stale output；如果参考了旧输出，已经替换、重建或明确去冲突。
- 全程没有访问 live service，也没有使用 OCR/VLM；只使用归档包内文本、清单和 sidecar 证据。
```
### 任务介绍

这是一个大规模离线邮件与票据归档任务。Agent 要从冻结的邮件线程、附件、inventory shards、ops notes、failed exports、stale outputs 和 sidecar 文本中建立“邮件-附件-票据”关系，识别真正可归档的发票/单据，对重复候选做实体级去重，并把结果复制到不同 archive bucket，同时生成机器可读 manifest 与人工报告。PDF 不能通过 OCR/VLM 读取，只能依赖已有 text-first sidecar；缺失或弱证据必须进入 review/missing 类别。

这个任务的核心难度是跨来源实体解析与 provenance：不能只按文件名判断，需要联合 message_id、attachment_ref_id、文档号、日期、金额、供应商别名和历史失败线索，而且复制后的目录状态、manifest 和报告必须一致。多智能体很适合分成 Mail-thread Resolver、Document/Sidecar Analyst、Dedup & Entity Resolution Agent、Archive Executor 和 Consistency Reviewer。任务规模和依赖链都较长，是 Office hard 集中很适合测试多智能体协作的一题。

## 8. market-daily-brief-a-share-recap

Category: data-file-ops    |    metadata.difficulty: hard

### 原始 Instruction

```markdown
# 采菊东篱·A股收盘复盘修订

你现在按「采菊东篱」盘后复盘的口吻处理这份材料：语言简洁、有结构、不要客套。请只使用本任务目录内已经冻结的盘后资料柜，为示例交易日 `2026-04-17` 修订工作稿，并在当前工作目录根路径生成一个中文 Markdown 文件：`daily_recap.md`。

这次不是联网写实时市场日报，也不生成 PDF。把 `input/` 当作盘后资料柜：先读 `_manifest/` 中的资料清单、来源状态表和取舍口径，再核对 `current/` 下的收盘导出、工作底稿、来源卡和附录；`drafts/` 是待修订工作稿与编辑旁注，`archive/` 只用于解释旧值、被替换来源或历史口径。不要把工作稿、旧快照、维护行、note_only 行、旧日材料或单一口径表直接当成最终结论。

## 输出要求

1. 只生成 `daily_recap.md`，位置为当前工作目录根路径；不要生成 PDF、HTML、截图、附件或其他交付文件。
2. 报告应像一份紧凑的盘后复盘，建议按以下结构组织：
   - 资料范围与来源取舍
   - 一、大盘总览
   - 二、短线生态指标监测
   - 三、行业/风格轮动
   - 四、宽度、换手与技术面简评
   - 五、情绪温度计
   - 六、明日观察
   - 草稿修订要点、叙事与结构化数据对照、来源取舍/更正表、披露与非建议声明
3. 关键数值、状态取舍、冲突解释和背景判断必须绑定资料柜内的 `source_id`，并说明采用、替换、排除或仅作背景的理由。
4. 必须修正工作稿中的旧数值、分母不明、别名混用、过强叙事和披露缺口；不要照抄草稿。
5. 「情绪温度计」和「明日观察」只能基于资料柜内证据做事实性描述。可以写需要继续观察的市场信号，但不得写成买卖、持仓、目标价、收益承诺、组合配置或个性化投资建议。

## 资料与安全边界

- 只使用任务目录内的冻结资料：`input/_manifest/`、`input/current/`、`input/archive/`、`input/drafts/` 以及任务提供的环境说明。
- 不要调用真实行情系统、外部 API、网络 URL、浏览器、私有终端、账号后台、VPN、PDF 生成技能、附件交付能力或任何实时数据服务。
- 不要引用资料柜外新闻、真实机构观点、未公开数据或编造数据。
- 所有内容必须是事实性、描述性复盘；结尾请明确说明本报告仅基于任务目录内离线示例资料，非实时、非投资建议。
```
### 任务介绍

这是一个冻结资料柜上的盘后复盘修订任务。Agent 不能联网获取实时行情，而要先读取 manifest、来源状态表和取舍口径，再交叉核对收盘导出、工作底稿、来源卡、附录、旧快照和编辑旁注，修正工作稿中的旧数值、分母不明、别名混用、叙事过强和披露缺口。所有关键数字、状态取舍和背景判断都要绑定内部 `source_id`，并说明某条来源为何被采用、替换、排除或仅作为背景。

难点在于同时处理“结构化数字正确性”和“叙事可信度”：即使数值本身正确，如果来源状态已被后续 correction 替代，或叙述强于资料证据，也属于错误。适合拆成 Source-state/Provenance Analyst、Market Metrics Analyst、Narrative Editor 和 Compliance Reviewer。它不是最典型的长执行链，但很适合测试多智能体如何把数据核对与文字判断解耦，再通过最终审阅保持一致。

## 9. monitoring-weekly-draft-followup

Category: doc-ops    |    metadata.difficulty: hard

### 原始 Instruction

```markdown
参考工作区中的设施监测周报材料，围绕 `2026W26` 更新 `input/workspace/drafts/week_2026W26_monitoring_report.md` 这份中文 Markdown 周报草稿。你现在只做草稿补全和待跟进梳理；材料不够就标待跟进，不要为了让周报完整而补编结论。

先读并确认边界：
- `input/workspace/README_先读我.md`
- `input/workspace/state/`
- 文件角色说明
- `environment/local_workspace_notes.md`

执行要求：

1. 通读 `input/workspace/notes/**`、`input/workspace/checklists/**`、`input/workspace/reference/**`、`input/workspace/templates/**` 和 `input/workspace/archive/**` 中与本周有关的设施监测材料。
2. 按现有草稿和周报模板结构，整理本周概览、已确认监测事实、异常与处置进展、待跟进事项、下周关注和来源/边界说明。
3. 草稿中只写能被工作区材料可靠支持的事实。晚到片段、交接便签、样本/点位别名、路线卡、会议摘录、checklist 口径和口头备注，都要按周报截止点、时间、设备/点位/样本/路线绑定、数值或状态值、会议/状态门记录交叉核对后再吸收。
4. 缺少复测值、缺少明确状态、时间戳不完整、来源冲突、来源依据和设备/点位/样本/路线绑定不足、只有电话或口头背景的内容，请保留在「待跟进事项」并说明当前线索；不得补编数值、完成状态、责任人、主管确认语句或闭环结论。
5. 旧周交接、archive、模板残句、重复告警和非本周材料只能作为背景或干扰项核对，不要覆盖更近的本周材料；重复异常要合并，避免把 duplicate alarm 当成独立事件。
6. 明确区分已确认事实、处置进展、待确认读数和下周关注，使用周报风格说明中的谨慎措辞，避免制造“已闭环”的错觉。

文件边界要求：
- 只能更新 `input/workspace/drafts/week_2026W26_monitoring_report.md` 作为主交付物。
- `templates/`、`notes/`、`reference/`、`checklists/`、`archive/`、`state/` 和 `README_先读我.md` 都是只读参考材料，不要修改、移动、删除或覆盖。
- `templates/optional_brief_container_outline.md` 在任何状态下都只是保护模板。本任务初始状态为 blocked，因此不要创建任何 optional briefing/container、PPTX、slide、deck、presentation、brief 或类似可选容器文件。
- 不要新建主周报以外的额外交付物、辅助配置、检查文件或外部系统调用记录。

最后请用简短中文回复：更新了哪个文件、仍有哪些待跟进事项、哪些晚到线索已被可靠吸收或仍未吸收、optional briefing/container 当前是否被状态门阻止。不要访问外部 API、网页、浏览器、远程业务系统、私有账号后台、VPN 或 live service；不要引用本工作区材料之外的事实，不要写入 private paths、private URLs、secrets、auth material、account IDs、真实人员/客户/组织数据或未公开材料。
```
### 任务介绍

这是一个设施监测周报的证据整合与谨慎状态更新任务。Agent 需要从 field fragments、meeting minutes、prior-week handover、checklists、metric glossary、state gate 和模板中恢复本周事实，处理晚到线索、点位/设备/样本/路线别名、重复告警、复测值缺失和来源冲突，只把有充分工作区证据支持的信息写入主周报；其余内容必须留在“待跟进”，不能为了形成闭环而补写完成状态。

它的主要挑战是时间截止点、实体绑定和不确定性边界。多智能体可以由 Source/Entity Resolver 负责别名与重复项，Monitoring Analyst 负责数值和状态，Temporal/State Reviewer 负责周界与闭环条件，Report Editor 负责形成最终周报。这个任务对“保留 blocker 和 uncertainty，而不是让执行链自动趋向 done”这一类可控 Agent 能力很有代表性。

## 10. priority-sync-notification-pipeline

Category: automation-workdir    |    metadata.difficulty: hard

### 原始 Instruction

```markdown
请处理这一轮 volunteer ops priority sync：以 `2026-07-14T10:20:00Z` 为决策时间，按照工作区 runbooks、queue/task 状态、delivery/operator/sync logs、config 边界和专用通知状态服务记录，把本轮应该记录的通知处理结果写清楚。请实际更新结果文件，不要只做口头分析。

开始前先读 `input/workspace/README_先读我.md`，再看 `input/workspace/runbooks/`、`input/workspace/config/`、当日 `shifts/`、`tasks/`、`queues/`、`logs/` 以及 `environment/mock_notification_service/initial_state.json`。详细的 priority、retry/backoff、fallback、consent、idempotency 和 no-live-service 口径以这些公开文件为准；不要只凭某一句 “sent / urgent / skip” 备注、单个 priority 标签或旧日复制板做最终判断。

只写这四个文件：
- `input/workspace/outputs/priority_sync_summary.md`
- `input/workspace/outputs/notification_action_log.json`
- `input/workspace/outputs/state_update_record.json`
- `environment/mock_notification_service/final_state_capture.json`

不要修改 runbooks、shifts、tasks、queues、logs、config、README、`environment/mock_notification_service/initial_state.json` 或未列入允许清单的记录文件。

每个进入本轮处理范围的 item 都要归入一个本地 decision family：`sent`、`skipped`、`retry_scheduled`、`fallback_routed`、`dedup_suppressed`、`human_followup` 或 `dead_letter`。如果已有相同 `dedup_key` 且工作区状态快照/索引已有 side effect，不得再次记录 sent side effect；要在 summary 和 action log 中说明重复抑制依据。

这些情况不能写成 successful sent：timeout、rate_limit、temporary_unavailable、retry_after 未到、backoff 未耗尽、manual hold、contact ambiguity、missing consent、conflicting owner 或 unsafe external boundary。请按公开 runbooks 分流到 retry、fallback、human follow-up、skip 或 dead-letter，并保留 evidence refs。

`config/fake_secret_boundary.env.txt` 里的 credential-like/token/key 值都是 `FAKE_SECRET_DO_NOT_USE__...` 形式的 inert placeholders；其他配置值也只是工作区边界说明。这里没有真实“调试参数/正式发送”的切换，任何 dry-run、send、webhook、mail、SMS、IM、CRM、ticketing 等字样都只能作为工作区证据和状态记录，不得触发外部调用。

完成后，summary、action log、state update record 和 final local state 里的 item refs、decision families、reason、evidence refs、workspace artifact updates 与 no-live-service note 必须一致。不要调用真实短信、邮箱、IM、webhook、CRM、ticketing、notification、外部 API、网络 URL、浏览器后台、VPN、私有账号或任何 live service；不要引用本工作区材料之外的事实。

最后请用简短中文回复：更新了哪些文件、各 decision family 的处理概况、是否遵守 no-live-service/fake-secret 边界，以及哪些 item 仍需要 human follow-up。
```
### 任务介绍

这是一个带状态机和副作用约束的通知决策流水线任务。Agent 要在给定决策时间下综合 runbooks、priority 规则、retry/backoff、fallback、consent、idempotency、queue/task 状态、delivery/operator/sync logs 和 mock notification service 状态，把每个 item 归入 sent、skipped、retry_scheduled、fallback_routed、dedup_suppressed、human_followup 或 dead_letter。最终四个输出文件中的 item、decision family、reason、evidence refs 和本地状态必须完全一致。

它的难点是状态迁移条件高度耦合：dedup、backoff、manual hold、missing consent、owner conflict 等任一条件都可能推翻“高优先级就发送”的直觉，而且不能触发真实外部服务。多智能体适合用 Policy Agent、Queue/Retry Agent、Consent & Boundary Agent、Dedup/Idempotency Agent 并行判定，再交给 State Integrator 与 Reviewer。这个任务很适合测试多专家规则推理和共享状态一致性。

## 11. release-phase-gate-progression ★

Category: automation-workdir    |    metadata.difficulty: hard

### 原始 Instruction

```markdown
你是 `quillship-cli` 文档/命令行工具包的发布状态看板维护人。请接手本轮 release 的工作区记录，确认当前 gate，修复工作区文件里可由公开证据解决的 validation / lookup / board / audit drift；如果条件满足，最多推进一个相邻 phase，否则把 blocker 清楚 carry forward。

本轮 release：`qs-local-2026-08-rc3`

本轮决策时间：`2026-08-05T10:40:00Z`

请先读 `input/workspace/README_先读我.md`，再按这些公开规则和证据处理：
- `input/workspace/runbooks/phase_gate_policy.md`
- `input/workspace/runbooks/local_validation_policy.md`
- `input/workspace/runbooks/audit_and_status_sync.md`
- `input/workspace/release_board.md`
- `input/workspace/state/workflow_state.json`
- `input/workspace/state/validation_results.json`
- `input/workspace/state/lookup_cache.json`
- `input/workspace/state/local_lookup_records.json`
- `input/workspace/audit/audit_history.md`
- `input/workspace/handoff/maintainer_handoff.md`
- `input/workspace/notes/operator_margin_notes.md`
- `input/workspace/notes/old_release_board_copy.md`
- `input/workspace/logs/local_validation_runs.jsonl`
- `input/workspace/config/no_network_policy.txt`
- `input/workspace/config/release_scope.json`
- `environment/mock_release_board/README.md`
- `environment/mock_release_board/initial_state.json`

只允许更新：
- `input/workspace/release_board.md`
- `input/workspace/state/workflow_state.json`
- `input/workspace/state/validation_results.json`
- `input/workspace/state/lookup_cache.json`
- `input/workspace/audit/audit_history.md`
- `input/workspace/outputs/release_progress_report.md`
- `input/workspace/outputs/state_update_record.json`
- `environment/mock_release_board/final_state_capture.json`

不要修改 README、runbooks、read-only lookup records、logs、config、handoff、notes、initial state、environment README 或任何未列入允许清单的文件。

判断当前 gate 时，要以 `workflow_state.json`、phase order、validation category、lookup/cache、audit timing 和 release scope 的交叉证据为准，不要只凭 Markdown 看板上的 “ready / handoff / green” 自然语言判断。`failed`、`stale`、`missing_lookup`、board/state/audit drift 等阻塞如果不能被工作区证据解决，必须保持 blocked 或明确 carry forward；`passed` 子项不能覆盖仍未解决的 blocker。

`missing_lookup` 只能用 `state/local_lookup_records.json`、`logs/local_validation_runs.jsonl` 和 scope/config 中 current scope、status=current、network_used=false 的公开记录修复；不得编造或远程查询 lookup 值。若刷新 validation 或修复 lookup/cache，要保留工作区 evidence refs 和 no-network 说明。

若且仅若 gate 条件由工作区文件支持，最多推进一个相邻 phase；不得跳过 phase，不得从 local_validation 直接跳到 handoff_ready 或 release_wrap，也不得在 validation/lookup/audit 尚未同步时写成 handoff 或 release complete。`audit_history.md` 保留旧记录，只能追加本轮检查/修复/推进或 blocked carry-forward 记录，或补充纠偏说明；不要改写旧记录来假装过去已经通过。

修复或推进后，`release_board.md`、`workflow_state.json`、`validation_results.json`、`lookup_cache.json`、`audit_history.md`、`release_progress_report.md`、`state_update_record.json` 和 `final_state_capture.json` 的 phase/status/category/reason/evidence refs 必须一致。`environment/mock_release_board/final_state_capture.json` 只记录你实际写入后的工作区状态摘要和 no-network confirmation，不能包含外部服务结果、额外交付模板或预设 completion state。

推包、发布、CI、包仓库、Git hosting、issue tracker、通知和外部检查都必须由真实授权人员或真实系统在本任务外完成；本任务只更新工作区文件里的状态记录。不要访问 package registry、CI、Git hosting、issue tracker、notification、浏览器后台、网络 URL、外部 API、VPN、私有账号或任何 live service，也不要引用私有路径、私有 URL、凭据、账号、真实个人/客户/组织数据或本工作区之外的事实。

最后请用简短中文回复：更新了哪些文件、validation category 的处理概况、是否只推进相邻 phase 或为何保持 blocked、是否遵守 no-live-service 边界，以及是否还有 human follow-up / carry-forward。
```
### 任务介绍

这是一个发布流程 gate 推进与多状态面漂移修复任务。Agent 需要同时读取 phase policy、validation policy、audit/status sync 规则、release board、workflow state、validation results、lookup cache、只读 lookup records、audit history、handoff、operator notes 和 validation logs，判断当前 gate 是否满足，并在条件允许时最多推进一个相邻 phase；否则必须保持 blocked 并明确 carry forward blocker。同时还要修复 board、validation、lookup/cache、audit 等可由现有证据解决的 drift。

它的复杂性来自多个相互制约的状态面：某个 validation passed 不能覆盖其他 blocker，missing_lookup 也只能依据受允许的本地记录修复，Markdown 看板上的自然语言更不能替代机器状态。适合拆成 Validation Analyst、Lookup/Cache Analyst、Audit/Board Reconciler、Gate Policy Analyst，再由 Release Reviewer 决定是否允许 phase transition。它是非常典型的工作流型长程任务，尤其适合测试 checkpoint/gate 机制。

## 12. wechat-tech-topic-package-hardened

Category: doc-ops    |    metadata.difficulty: hard

### 原始 Instruction

```markdown
你是一位中文科技公众号的选题编辑。请只使用本任务目录内已经冻结的公开资料，为规划日 `2026-06-18` 做一份“技术选题决策板”。目标是给编辑会快速判断今天最值得写什么：先有清楚的取舍摘要，再给可追溯的主推选题和备选/降级理由；只做选题推荐，不写完整文章。

需要参考：
- `input/source_board/tech_source_digest_2026-06-18.jsonl`
- `input/source_board/recent_coverage_history_2026-06.md`
- `input/source_board/channel_audience_brief.md`
- `input/source_board/desk_note_source_state_log.md`
- `input/editorial_guide/topic_board_selection_policy.md`
- `environment/local_workspace_boundary.md`

最后请生成且只生成两个正式交付文件：
1. `output/topic_package/wechat_topic_board_2026-06-18.md`
2. `output/topic_package/wechat_topic_board_2026-06-18.json`

选题和整理要求：
1. 只能基于资料包内的冻结来源和编辑口径筛选，不要联网补热度、不要调用真实搜索、外部 API、浏览器、私有服务、真实公众号后台、账号数据、图片/视频/音频/OCR/VLM 工具或本地材料之外的内容。
2. 从本地来源中选出正好 5 个排序主推选题，并另外给出 2 或 3 个 reserve/downranked 选题。每个主推和 reserve/downranked 选题都要绑定本地 `source_id`，不得引用 JSONL 中不存在的来源 ID。
3. 筛选标准要像真实公众号选题会：普通读者能看懂、能产生讨论、有明确切入角度，不是纯新闻复述；同时要处理技术深度与大众可读性、标题可用性、频道受众适配和近期覆盖差异。
4. 排序前请先处理最新状态、重复/同事件来源合并、更新/更正/被替代说法、近期覆盖历史冲突、促销或单一厂商材料、未证实或安全敏感材料、桥接主题和频道适配冲突。不要只按日期、来源数量、单一风险词或单一文件排序。
5. Markdown 需要包含：前置取舍摘要、5 个排序主推选题卡、2 或 3 个 reserve/downranked 选题、close-call matrix、source-state notes、non-selection/downrank logs、资料包内自检。前置取舍摘要里请用一句话说明“今日最值得写的选题”及主要理由。
6. 每个主推选题卡至少包含：`rank`、公众号风格标题、话题角度、`source_id` 列表、来源/证据摘要、最新状态处理、近期覆盖差异、目标读者、推荐理由、风险或边界提示、排序取舍说明。
7. close-call matrix 至少比较 3 组相邻或易混候选，说明为什么某个候选进入主推、降为 reserve/downranked，或被合并/排除。
8. non-selection/downrank logs 至少覆盖重复合并、过窗背景、促销/低证据、未证实或安全敏感、近期覆盖重复或频道适配冲突。
9. JSON sidecar 是正式输出的一部分，不是临时草稿或附属说明。它必须与 Markdown 保持一致，至少包含：`package_date`、`source_bundle_id`、`primary_topics`、`reserve_or_downranked_topics`、`close_call_matrix`、`source_state_notes`、`non_selection_downrank_log`、`local_only_self_checks`、`markdown_json_consistency`。`primary_topics` 中的 rank、title、source_ids、risk_or_boundary_note 必须与 Markdown 一致。
10. 输出是选题规划包，不是完整文章、发布包或真实平台排期。不要生成全文正文、封面图、视频、音频、HTML/SVG、截图、脚本、真实平台排期或其他正式发布文件。
11. 不得输出真实 URL、真实账号标识、联系方式、凭据、客户/用户数据、私有路径/URL，或本地材料之外的事实、机构背书、实时热度、阅读量、后台数据、未公开指标、内部校验依据或非交付所需的评审配置细节。
```
### 任务介绍

这是一个冻结来源上的科技选题决策任务。Agent 需要从 source digest、近期覆盖历史、频道受众 brief、source-state log 和 selection policy 中，先处理同事件来源合并、更新/更正/被替代状态、近期覆盖冲突、促销/单厂商材料、未证实或安全敏感材料，再选出恰好 5 个排序主推主题和 2-3 个 reserve/downranked 主题。Markdown 与 JSON sidecar 必须在 rank、title、source_ids 和风险边界上严格一致。

难点在于这不是简单的排序，而是多约束编辑决策：来源状态、证据质量、读者可读性、频道适配、近期重复和风险边界需要共同决定结果，并且 close-call matrix 与 non-selection log 还要解释为什么相邻候选被取舍。多智能体可以分为 Source-state Curator、Audience/Editorial Analyst、Risk Reviewer 和 Package Integrator。它更偏决策协作而非超长执行，但很适合验证专家意见融合与最终一致性。

## 13. xmind-screenshot-template-ppt

Category: doc-ops    |    metadata.difficulty: hard

### 原始 Instruction

```markdown
请在当前工作区完成一个 PPT 生成任务。用户提供了 3 个材料：

1. `input/source/community_sustainability_workshop.xmind`：XMind-like 思维导图包，作为主要内容来源。
2. `input/reference/mindmap_screenshot_style_reference.png`：随包提供的版式参考图，只用于理解层级、分组、左右分支、色彩和留白节奏。
3. `input/template/community_workshop_green_template.pptx`：PPTX 模板，用于沿用主题色、页脚、卡片、分栏和行动矩阵等基础风格。
目标：基于模板，把导图内容改造成一份正式、可打开的中文 PPTX 演示稿，输出到：

`output/community_sustainability_workshop_deck.pptx`

执行要求：
- 可以使用工作区内可用工具解析和生成文件；如果生成过程出错，请先定位原因并在不改原始输入文件的前提下修复后重试，不要停在半成品。
- 内容应覆盖工作坊的主要议题、行动站、承诺回访，以及材料/备注中确实有用的信息；自行合并轻重缓急相近的节点，不要机械地把每个节点都做成一页。
- 附件、备注、图标和准备清单里有些只是补充或讲者提示，请判断哪些适合进入正文，哪些适合作为备注或可省略信息。
- 版式要参考随包版式图体现层级分组、左右分支、色彩组织和可读留白，同时沿用模板的绿色社区风格、页脚、标题条、卡片、分栏或行动矩阵。
- 最低限度确认输出文件存在、PPTX 可打开、页面数量合理，且不是模板占位页或普通文字大纲页。

边界：
- 不要修改、覆盖、删除或重命名任何原始输入文件。
- 不需要联网，不要使用外部模板、私有服务、账号后台、外部素材库或未提供资产。
- 不要做 OCR、VLM、截图识别、图片理解或像素级视觉判断；参考图只是本地版式提示，不是需要识别文字的输入。
- 最终只交付这个 PPTX，不要用说明文档、Markdown、PDF、图片或文本摘要替代。
完成后只简洁说明输出文件路径、页数和是否通过可打开检查。
```
### 任务介绍

这是一个多格式内容理解与演示文稿生成任务：以 XMind-like 思维导图为主要内容来源，参考一张版式图的层级/分组/左右分支/色彩/留白节奏，同时复用现有 PPTX 模板的主题色、页脚、卡片、分栏和行动矩阵，最终生成一份正式可打开的中文 PPTX。Agent 还要判断导图节点、备注、附件、图标和准备清单中哪些应进入正文、哪些只适合作为补充或省略，不能机械地“一节点一页”。

其难点主要集中在内容重构、跨格式解析和最终 artifact 质量控制，而不是复杂业务状态推理。多智能体可以拆成 Content Strategist、Deck Architect/Writer、Template/Layout Executor 和 PPTX QA Reviewer。对于你的系统，它更适合测试“专家分工 + 最终集成交付”，但相较 release gate、control-state 或通知流水线，长程状态依赖和错误传播深度较弱。
