# LingoGrab 产品优化评测报告

生成时间：2026-10-11T18:30:56.690Z

## 结论

本轮共执行 80 项检查，通过 80 项，失败 0 项。

## 答案公平性

| 检查项 | 结果 | 证据 |
|---|:---:|---|
| 目标答案 | 通过 | clarify → target |
| 忽略大小写 | 通过 | CLARIFY → target |
| 可接受答案 clarify | 通过 | explain → acceptable |
| 可接受答案 align | 通过 | agree → acceptable |
| 可接受答案 update | 通过 | report → acceptable |
| 可接受答案 feedback | 通过 | comment → acceptable |
| 可接受短语 review | 通过 | look at → acceptable |
| 法语请求语气 | 通过 | voulez → acceptable |
| 法语礼貌程度 | 通过 | veux → acceptable |
| 真正错误 | 通过 | banana → wrong |
| 空答案 | 通过 | 空 → empty |

## 复习排期

| 检查项 | 结果 | 证据 |
|---|:---:|---|
| 首次答对进入 FSRS-6 | 通过 | {"interval":3,"due":"2026-10-10","algorithm":"fsrs-6","rating":"Good","fsrsCard":{"due":"2026-10-10T04:00:00.000Z","stability":2.3065,"difficulty":2.11810397,"elapsed_days":0,"scheduled_days":3,"reps":1,"lapses":0,"learning_steps":0,"state":2,"last_review":"2026-10-07T04:00:00.000Z"}} |
| 答错记为 Again | 通过 | {"interval":1,"due":"2026-10-08","algorithm":"fsrs-6","rating":"Again","fsrsCard":{"due":"2026-10-08T04:00:00.000Z","stability":0.212,"difficulty":6.4133,"elapsed_days":0,"scheduled_days":1,"reps":1,"lapses":0,"learning_steps":0,"state":2,"last_review":"2026-10-07T04:00:00.000Z"}} |
| 改正后记为 Hard | 通过 | {"interval":2,"due":"2026-10-09","algorithm":"fsrs-6","rating":"Hard","fsrsCard":{"due":"2026-10-09T04:00:00.000Z","stability":0.212,"difficulty":7.60420977,"elapsed_days":0,"scheduled_days":2,"reps":2,"lapses":0,"learning_steps":0,"state":2,"last_review":"2026-10-07T04:00:00.000Z"}} |
| 旧固定排期迁移后延续既有进度 | 通过 | {"interval":23,"due":"2026-10-30","algorithm":"fsrs-6","rating":"Good","fsrsCard":{"due":"2026-10-30T04:00:00.000Z","stability":23.36269083,"difficulty":4.99022837,"elapsed_days":7,"scheduled_days":23,"reps":2,"lapses":0,"learning_steps":0,"state":2,"last_review":"2026-10-07T04:00:00.000Z"}} |

## 产品闭环

| 检查项 | 结果 | 证据 |
|---|:---:|---|
| 真实连续天数 | 通过 | 存在对应实现 |
| 每日完成页 | 通过 | 存在对应实现 |
| 拾取后可选全部制卡或立即练习 | 通过 | 存在对应实现 |
| 个人拾取以完整练习卡保存 | 通过 | 存在对应实现 |
| 拾取卡保留原句并校验溯源 | 通过 | 存在对应实现 |
| 拾取卡题面转义后再渲染 | 通过 | 存在对应实现 |
| 学习记录与到期日 | 通过 | 存在对应实现 |
| 学习数据导出 | 通过 | 存在对应实现 |
| 词书数量口径 | 通过 | 存在对应实现 |
| 首次体验包含每日目标 | 通过 | 存在对应实现 |
| 英语词库扩展为百张卡 | 通过 | 存在对应实现 |
| 反馈点赞点踩 | 通过 | 存在对应实现 |
| 匿名产品埋点 | 通过 | 存在对应实现 |
| LingoGrab 用户运营看板 | 通过 | 存在对应实现 |
| 看板标注数据起点和北京时间 | 通过 | 存在对应实现 |
| 看板不混入学习质量 | 通过 | 存在对应实现 |
| 产品内学习质量 | 通过 | 存在对应实现 |
| 三条内容路线导航 | 通过 | 存在对应实现 |
| 点赞点踩默认弱化 | 通过 | 存在对应实现 |

## 拾取制卡规则

| 检查项 | 结果 | 证据 |
|---|:---:|---|
| 目标表达按完整词或短语匹配 | 通过 | {"substringRejected":true,"exactAccepted":true,"tracedCandidate":{"target":"align","meaning":"达成一致","example":"We should align before the meeting.","reason":"","lang":"en","level":"B2","translation":"","cloze":"","explanation":"","grammar":[],"acceptedAnswers":[]}} |
| AI 题面强制从来源原句重建 | 通过 | {"target":"align","meaning":"达成一致","example":"We should align before the meeting.","reason":"","lang":"en","level":"B2","translation":"","cloze":"","explanation":"","grammar":[],"acceptedAnswers":[]} |

## 数据同步

| 检查项 | 结果 | 证据 |
|---|:---:|---|
| 跨设备重复卡合并并迁移复习引用 | 通过 | {"activeDeck":"en-b1","preferredLang":"en","index":{"fr-daily-a1":0,"fr-travel-a2":0,"fr-work-a2":0,"en-b1":0,"en-b2":0},"mastered":[],"wrong":[],"picked":[{"id":"picked-local","target":"align","meaning":"本机语境","example":"Please align today.","lang":"en","level":"B2","lemma":"align","cloze":"Please ___ today.","translation":"本机语境","grammar":["个人拾取","真实材料"],"explanation":"本机语境","acceptedAnswers":[],"source":"真实材料","addedAt":"","cardType":"practice","cardVersion":2}],"studyRecords":{"picked:picked-local":{"interval":7,"lastReviewed":"2026-10-11"}},"reviewHistory":[{"id":"review-local","cardKey":"picked:picked-local","reviewedAt":"2026-10-10T12:00:00.000Z"},{"id":"review-remote","cardKey":"picked:picked-local","reviewedAt":"2026-10-11T12:00:00.000Z"}],"eventLog":[],"dailyActivity":{"2026-10-11":{"reviewed":["picked:picked-local"],"firstTryCorrect":1,"retried":0},"2026-10-10":{"reviewed":["picked:picked-local"],"firstTryCorrect":1,"retried":0}},"activityDates":[],"settings":{"dailyGoal":3,"aiEnabled":true},"updatedAt":20} |

## 浏览器旅程

| 检查项 | 结果 | 证据 |
|---|:---:|---|
| 首次进入先选语言 | 通过 | 新手引导第 1 步 |
| 新用户连续天数从零开始 | 通过 | 0 |
| 语言选择后设置每日目标 | 通过 | 新手引导第 2 步 |
| 设置目标后出现两条直达路径 | 通过 | 新手引导第 3 步 |
| 可接受答案 explain | 通过 | 也可以这样说：explain |
| 可接受答案 report | 通过 | 也可以这样说：report |
| 可接受答案 comment | 通过 | 也可以这样说：comment |
| 完成三题进入总结页 | 通过 | ✓ 这轮练习完成了  本轮 3 个由每日目标决定；职场英语 B1共 50 张，其他卡片会在后续轮次出现。  3 本轮完成 100% 第一次就答对 0 旧题复习 — 隔天仍记得 这两个数是什么意思？ 回到今天 生成新练习卡 |
| 每日记录写入本地状态 | 通过 | 3 条 |
| 三题均生成下次复习日期 | 通过 | {"deck:en-b1:en-clarify":{"interval":3,"due":"2026-10-15","algorithm":"fsrs-6","rating":"Good","fsrsCard":{"due":"2026-10-14T18:30:46.539Z","stability":2.3065,"difficulty":2.11810397,"elapsed_days":0,"scheduled_days":3,"reps":1,"lapses":0,"learning_steps":0,"state":2,"last_review":"2026-10-11T18:30:46.539Z"},"lastReviewed":"2026-10-12","lastResult":"first_try"},"deck:en-b1:en-update":{"interval":3,"due":"2026-10-15","algorithm":"fsrs-6","rating":"Good","fsrsCard":{"due":"2026-10-14T18:30:47.060Z","stability":2.3065,"difficulty":2.11810397,"elapsed_days":0,"scheduled_days":3,"reps":1,"lapses":0,"learning_steps":0,"state":2,"last_review":"2026-10-11T18:30:47.060Z"},"lastReviewed":"2026-10-12","lastResult":"first_try"},"deck:en-b1:en-feedback":{"interval":3,"due":"2026-10-15","algorithm":"fsrs-6","rating":"Good","fsrsCard":{"due":"2026-10-14T18:30:47.357Z","stability":2.3065,"difficulty":2.11810397,"elapsed_days":0,"scheduled_days":3,"reps":1,"lapses":0,"learning_steps":0,"state":2,"last_review":"2026-10-11T18:30:47.357Z"},"lastReviewed":"2026-10-12","lastResult":"first_try"}} |
| 本地拾取使用原文生成挖空卡 | 通过 | align 就目标或优先级达成一致 · B2 挖空正面 Before the project starts, let's ___ on the priorities and clarify the scope. ＋ 制成卡片 |
| 本地拾取后立即进入个人练习卡 | 通过 | 我的练习卡 |
| 拾取内容已持久化为完整练习卡 | 通过 | {"target":"align","lang":"en","meaning":"就目标或优先级达成一致","example":"Before the project starts, let's align on the priorities and clarify the scope.","level":"B2","id":"picked-en-align-1u5g21p","source":"个人拾取","addedAt":"2026-10-12","lemma":"align","cloze":"Before the project starts, let's ___ on the priorities and clarify the scope.","translation":"就目标或优先级达成一致","grammar":["个人拾取"],"explanation":"就目标或优先级达成一致","acceptedAnswers":[],"cardType":"practice","cardVersion":2} |
| 拾取卡作答进入 FSRS-6 排期 | 通过 | {"interval":3,"due":"2026-10-15","algorithm":"fsrs-6","rating":"Good","fsrsCard":{"due":"2026-10-14T18:30:48.461Z","stability":2.3065,"difficulty":2.11810397,"elapsed_days":0,"scheduled_days":3,"reps":1,"lapses":0,"learning_steps":0,"state":2,"last_review":"2026-10-11T18:30:48.461Z"},"lastReviewed":"2026-10-12","lastResult":"first_try"} |
| 重复制卡更新语境但不增加重复卡 | 通过 | [{"target":"priorities","lang":"en","meaning":"优先事项","example":"Before the project starts, let's align on the priorities and clarify the scope.","level":"B1","id":"picked-en-priorities-1yum5b0","source":"个人拾取","addedAt":"2026-10-12","lemma":"priorities","cloze":"Before the project starts, let's align on the ___ and clarify the scope.","translation":"优先事项","grammar":["个人拾取"],"explanation":"优先事项","acceptedAnswers":[],"cardType":"practice","cardVersion":2},{"target":"update","lang":"en","meaning":"进展说明","example":"I will follow up with the supplier after the meeting and send a brief update to the team.","level":"B1","id":"picked-en-update-1mik6kx","source":"个人拾取","addedAt":"2026-10-12","lemma":"update","cloze":"I will follow up with the supplier after the meeting and send a brief ___ to the team.","translation":"进展说明","grammar":["个人拾取"],"explanation":"进展说明","acceptedAnswers":[],"cardType":"practice","cardVersion":2},{"target":"follow up","lang":"en","meaning":"继续跟进","example":"I will follow up with the supplier after the meeting and send a brief update to the team.","level":"B1","id":"picked-en-follow-up-1371t2a","source":"个人拾取","addedAt":"2026-10-12","lemma":"follow up","cloze":"I will ___ with the supplier after the meeting and send a brief update to the team.","translation":"继续跟进","grammar":["个人拾取"],"explanation":"继续跟进","acceptedAnswers":[],"cardType":"practice","cardVersion":2},{"target":"scope","lang":"en","meaning":"项目范围 / 边界","example":"Before the project starts, let's align on the priorities and clarify the scope.","level":"B2","id":"picked-en-scope-wbcqxg","source":"个人拾取","addedAt":"2026-10-12","lemma":"scope","cloze":"Before the project starts, let's align on the priorities and clarify the ___.","translation":"项目范围 / 边界","grammar":["个人拾取"],"explanation":"项目范围 / 边界","acceptedAnswers":[],"cardType":"practice","cardVersion":2},{"target":"clarify","lang":"en","meaning":"澄清、说明清楚","example":"Before the project starts, let's align on the priorities and clarify the scope.","level":"B1","id":"picked-en-clarify-1uauaaa","source":"个人拾取","addedAt":"2026-10-12","lemma":"clarify","cloze":"Before the project starts, let's align on the priorities and ___ the scope.","translation":"澄清、说明清楚","grammar":["个人拾取"],"explanation":"澄清、说明清楚","acceptedAnswers":[],"cardType":"practice","cardVersion":2},{"target":"align","lang":"en","meaning":"就目标或优先级达成一致","example":"Before the project starts, let's align on the priorities and clarify the scope.","level":"B2","id":"picked-en-align-1u5g21p","source":"个人拾取","addedAt":"2026-10-12","lemma":"align","cloze":"Before the project starts, let's ___ on the priorities and clarify the scope.","translation":"就目标或优先级达成一致","grammar":["个人拾取"],"explanation":"就目标或优先级达成一致","acceptedAnswers":[],"cardType":"practice","cardVersion":2}] |
| 页面无运行时错误 | 通过 |  |
| 真正错误必须重输 | 通过 | 正确答案是 clarify |
| 错误反馈先给答案和动作 | 通过 | 正确答案是 clarify  你写的是 banana。clarify 和 explain 在这里都成立；clarify 更强调消除目标或要求中的歧义，词书重点练习这个职场意图。  输入 clarify，再提交一次。  反馈这段解释 想看更多解释 |
| 学习页不暴露系统分层 | 通过 | 正确答案是 clarify  你写的是 banana。clarify 和 explain 在这里都成立；clarify 更强调消除目标或要求中的歧义，词书重点练习这个职场意图。  输入 clarify，再提交一次。  反馈这段解释 想看更多解释 |
| 更多解释默认收起 | 通过 | 详细解释和 AI 入口未抢占主流程 |
| 点赞反馈成功上传 | 通过 | 已收到，谢谢 |
| 重输通过记录为待巩固 | 通过 | {"deck:en-b1:en-clarify":{"interval":2,"due":"2026-10-14","algorithm":"fsrs-6","rating":"Hard","fsrsCard":{"due":"2026-10-13T18:30:50.938Z","stability":0.212,"difficulty":7.60420977,"elapsed_days":0,"scheduled_days":2,"reps":2,"lapses":0,"learning_steps":0,"state":2,"last_review":"2026-10-11T18:30:50.938Z"},"lastReviewed":"2026-10-12","lastResult":"retried"}} |

## 设置页

| 检查项 | 结果 | 证据 |
|---|:---:|---|
| 默认只显示三个核心区域 | 通过 | 每日学习量、账号同步、我的学习质量 |
| 高级功能默认收起 | 通过 | 更多设置、帮助和技术说明均默认收起 |

## 内容路线

| 检查项 | 结果 | 证据 |
|---|:---:|---|
| 智能精选有独立可达页面 | 通过 | 左侧导航 → 智能精选 |
| 个人拾取不再暴露本地规则黑话 | 通过 | 不上传，直接制卡 |

## 安全边界

| 检查项 | 结果 | 证据 |
|---|:---:|---|
| 拾取题面按纯文本渲染 | 通过 | &lt;img src=x onerror="window.__pickedXss=1"&gt; I would like to ? with the team before the meeting. |

## 数据迁移

| 检查项 | 结果 | 证据 |
|---|:---:|---|
| 加载后立即持久化完整练习卡 | 通过 | {"id":"picked-existing","target":"touch base","meaning":"联系确认","example":"&lt;img src=x onerror=\"window.__pickedXss=1\"&gt; I would like to touch base with the team before the meeting.","lang":"en","level":"B1","source":"旧拾取","lemma":"touch base","cloze":"&lt;img src=x onerror=\"window.__pickedXss=1\"&gt; I would like to ___ with the team before the meeting.","translation":"联系确认","grammar":["个人拾取","旧拾取"],"explanation":"联系确认","acceptedAnswers":[],"addedAt":"","cardType":"practice","cardVersion":2} |
| 旧拾取的复习记录不丢失 | 通过 | {"picked:picked-existing":{"due":"2026-10-12","interval":1,"lastReviewed":"2026-10-11","lastResult":"first_try"}} |
| 我的词书显示卡片和单卡练习入口 | 通过 | 我的英语练习卡 1 张卡 · 新卡优先、到期优先、最久未练优先 ＋ 生成新卡 练习下一组 1 张 touch base 练习卡 · B1 联系确认 挖空正面 &lt;img src=x onerror="window.__pickedXss=1"&gt; I would like to ___ with the team before the meeting. 今天到期 · 旧拾取 练这张卡 |
| 旧排期首次复习后延续为 FSRS 状态 | 通过 | {"interval":3,"due":"2026-10-15","algorithm":"fsrs-6","rating":"Good","fsrsCard":{"due":"2026-10-14T18:30:53.079Z","stability":1,"difficulty":4.99022837,"elapsed_days":0,"scheduled_days":3,"reps":2,"lapses":0,"learning_steps":0,"state":2,"last_review":"2026-10-11T18:30:53.079Z"},"lastReviewed":"2026-10-12","lastResult":"first_try"} |

## 法语制卡

| 检查项 | 结果 | 证据 |
|---|:---:|---|
| 法语材料可在浏览器本地生成练习卡 | 通过 | clarifier 澄清、说明清楚 · A2 挖空正面 Avant la réunion, nous devons ___ les priorités et faire le point sur le projet. ＋ 制成卡片 priorités 优先事项 · A2 挖空正面 Avant la réunion, nous devons clarifier les ___ et faire le point sur le projet. ＋ 制成卡片 faire le point 梳理或同步当前进展 · B1 挖空正面 Avant la réunion, nous devons clarifier les priorités et ___ sur le projet. ＋ 制成卡片 compte rendu 会议纪要、报告 · A2 挖空正面 Je viens de terminer le ___ et je voudrais proposer une autre solution. ＋ 制成卡片 proposer 提出、建议 · A2 挖空正面 Je viens de terminer le compte rendu et je voudrais ___ une autre solution. ＋ 制成卡片 全部制成卡片 全部制卡并练习 |
| 法语拾取以完整卡片保存 | 通过 | [{"target":"proposer","lang":"fr","meaning":"提出、建议","example":"Je viens de terminer le compte rendu et je voudrais proposer une autre solution.","level":"A2","id":"picked-fr-proposer-vcvap5","source":"个人拾取","addedAt":"2026-10-12","lemma":"proposer","cloze":"Je viens de terminer le compte rendu et je voudrais ___ une autre solution.","translation":"提出、建议","grammar":["个人拾取"],"explanation":"提出、建议","acceptedAnswers":[],"cardType":"practice","cardVersion":2},{"target":"compte rendu","lang":"fr","meaning":"会议纪要、报告","example":"Je viens de terminer le compte rendu et je voudrais proposer une autre solution.","level":"A2","id":"picked-fr-compte-rendu-yef1pz","source":"个人拾取","addedAt":"2026-10-12","lemma":"compte rendu","cloze":"Je viens de terminer le ___ et je voudrais proposer une autre solution.","translation":"会议纪要、报告","grammar":["个人拾取"],"explanation":"会议纪要、报告","acceptedAnswers":[],"cardType":"practice","cardVersion":2},{"target":"faire le point","lang":"fr","meaning":"梳理或同步当前进展","example":"Avant la réunion, nous devons clarifier les priorités et faire le point sur le projet.","level":"B1","id":"picked-fr-faire-le-point-21qupb","source":"个人拾取","addedAt":"2026-10-12","lemma":"faire le point","cloze":"Avant la réunion, nous devons clarifier les priorités et ___ sur le projet.","translation":"梳理或同步当前进展","grammar":["个人拾取"],"explanation":"梳理或同步当前进展","acceptedAnswers":[],"cardType":"practice","cardVersion":2},{"target":"priorités","lang":"fr","meaning":"优先事项","example":"Avant la réunion, nous devons clarifier les priorités et faire le point sur le projet.","level":"A2","id":"picked-fr-priorites-mvp8te","source":"个人拾取","addedAt":"2026-10-12","lemma":"priorités","cloze":"Avant la réunion, nous devons clarifier les ___ et faire le point sur le projet.","translation":"优先事项","grammar":["个人拾取"],"explanation":"优先事项","acceptedAnswers":[],"cardType":"practice","cardVersion":2},{"target":"clarifier","lang":"fr","meaning":"澄清、说明清楚","example":"Avant la réunion, nous devons clarifier les priorités et faire le point sur le projet.","level":"A2","id":"picked-fr-clarifier-6319p2","source":"个人拾取","addedAt":"2026-10-12","lemma":"clarifier","cloze":"Avant la réunion, nous devons ___ les priorités et faire le point sur le projet.","translation":"澄清、说明清楚","grammar":["个人拾取"],"explanation":"澄清、说明清楚","acceptedAnswers":[],"cardType":"practice","cardVersion":2}] |

## 用户运营看板

| 检查项 | 结果 | 证据 |
|---|:---:|---|
| 北京时间不会在凌晨少一天 | 通过 | UTC 10月8日 17:00 应归属北京时间 10月9日 |
| 页面直接说明真实数据起点 | 通过 | 真实数据起点：新版运营埋点自 2026-10-08 16:59（北京时间，UTC+8） 开始积累。此前只有部分旧学习事件，无法回填历史 UV、停留、来源、D1 和严格去重漏斗。 |
| 未填 Key 展示完整演示数据 | 通过 | 当前是演示数据；填写有效 Key 后整页切换为真实数据。 |
| 有效 Key 切换为真实数据 | 通过 | 已加载真实用户与产品数据。 |
| UV、来源、停留和去重漏斗可读 | 通过 | 访问产品 10 · 总转化 100.0% 浏览内容路线 8 · 总转化 80.0% 开始学习 6 · 总转化 60.0% 完成一轮 4 · 总转化 40.0% |
| 错误率与性能数据可读 | 通过 | 错误 · ai_request	1 次	— 性能 · page_load	980 ms	10 次 |
| 小样本判断有证据和验证方案 | 通过 | 样本量较小置信度 低  当前数据只能作为方向性线索。  证据 真人 UV 为 10。 验证 累计至少 30 个真人 UV。 |
| 点踩明细可定位到学习卡 | 通过 | 2026/10/8 16:00:00	👎 没帮助	学习反馈：没帮助	answer_feedback	en-clarify |

## 移动端

| 检查项 | 结果 | 证据 |
|---|:---:|---|
| 无横向溢出 | 通过 | 390/390 |
| 底部导航可见 | 通过 | 390 × 844 |

## 评测自评

### 这套评测能说明什么

- 同一套测试同时检查纯规则、静态实现和真实浏览器旅程，能发现只改文案但未打通状态的情况。
- 多答案用例来自既有人工复核中已经确认的争议案例，目标是降低误判而不是提高表面分数。
- 复习排期检查 FSRS-6 算法标记、评级映射与状态递增，避免只验证字段存在。

### 这套评测不能说明什么

- 这套检查不能证明 D1 或 D7 留存，也不能证明长期记忆效果。
- 实时 AI 的讲解质量、接口时延和模型降级仍由专项评测单独验证。
- 英语和法语可接受答案仍需持续由语言专家扩充，自动用例不能替代专家审校。
- 移动端仅覆盖代表性视口和横向溢出，不能替代真实设备与辅助技术测试。

### 上线判断

核心闭环可上线验证，但不能将自动通过率表述为真实学习效果。
