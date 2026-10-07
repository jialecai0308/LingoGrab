# LingoGrab 学习证据底座评测报告

生成时间：2026-10-07T09:24:33.405Z

## 结论

本轮共执行 25 项检查，通过 25 项，失败 0 项。

## 隐私与数据结构

| 检查项 | 结果 | 证据 |
|---|:---:|---|
| 事件白名单过滤原始答案 | 通过 | {"language":"en","result":"wrong"} |
| 事件白名单过滤导入原文 | 通过 | {"language":"en","result":"wrong"} |
| 事件白名单过滤联系方式 | 通过 | {"language":"en","result":"wrong"} |
| 复习事件可回放 | 通过 | {"id":"review-1791363600000-1zwz2qn","cardKey":"deck:en-b1:en-clarify","reviewedAt":"2026-10-07T09:00:00.000Z","result":"acceptable","firstTry":true,"previousInterval":1,"scheduledInterval":3,"due":"2026-10-10","source":"deck","sessionId":"session-test","schemaVersion":1} |
| 复习事件不含输入文本字段 | 通过 | id, cardKey, reviewedAt, result, firstTry, previousInterval, scheduledInterval, due, source, sessionId, schemaVersion |

## 同步与容量

| 检查项 | 结果 | 证据 |
|---|:---:|---|
| 跨设备合并按事件 ID 去重 | 通过 | [{"id":"b","timestamp":"2026-10-07T03:00:00Z"},{"id":"c","timestamp":"2026-10-07T04:00:00Z"}] |
| 事件列表遵守容量上限 | 通过 | [{"id":"b","timestamp":"2026-10-07T03:00:00Z"},{"id":"c","timestamp":"2026-10-07T04:00:00Z"}] |

## 学习指标

| 检查项 | 结果 | 证据 |
|---|:---:|---|
| 完成数不把错误尝试算作完成 | 通过 | {"attempts":4,"completed":3,"firstTry":2,"firstTryRate":67,"retried":1,"acceptable":1,"wrongAttempts":1} |
| 首次答对率按完成表达计算 | 通过 | {"attempts":4,"completed":3,"firstTry":2,"firstTryRate":67,"retried":1,"acceptable":1,"wrongAttempts":1} |
| 重输与可接受答案分开统计 | 通过 | {"attempts":4,"completed":3,"firstTry":2,"firstTryRate":67,"retried":1,"acceptable":1,"wrongAttempts":1} |

## 静态实现

| 检查项 | 结果 | 证据 |
|---|:---:|---|
| 本地状态包含逐次复习历史 | 通过 | reviewHistory + createReviewEvent |
| 云端合并保留两端事件 | 通过 | 按 ID 合并，最多 5000 条 |
| 研究导出声明隐私边界 | 通过 | 三个敏感字段均声明不包含 |
| 设置页展示用户自己的指标 | 通过 | 四项学习指标 |

## 浏览器证据链

| 检查项 | 结果 | 证据 |
|---|:---:|---|
| 三次完成均写入逐次历史 | 通过 | 3 条 |
| 可接受答案保留分类但不保留答案文本 | 通过 | [{"id":"review-1791365071621-t6q1fcc","cardKey":"deck:en-b1:en-clarify","reviewedAt":"2026-10-07T09:24:31.621Z","result":"acceptable","firstTry":true,"previousInterval":0,"scheduledInterval":1,"due":"2026-10-08","source":"deck","sessionId":"session-1791365071233-0fc9l","schemaVersion":1},{"id":"review-1791365071712-7gah4qd","cardKey":"deck:en-b1:en-update","reviewedAt":"2026-10-07T09:24:31.712Z","result":"acceptable","firstTry":true,"previousInterval":0,"scheduledInterval":1,"due":"2026-10-08","source":"deck","sessionId":"session-1791365071233-0fc9l","schemaVersion":1},{"id":"review-1791365071779-nttqmjn","cardKey":"deck:en-b1:en-feedback","reviewedAt":"2026-10-07T09:24:31.779Z","result":"acceptable","firstTry":true,"previousInterval":0,"scheduledInterval":1,"due":"2026-10-08","source":"deck","sessionId":"session-1791365071233-0fc9l","schemaVersion":1}] |
| 新手路径与完成事件写入日志 | 通过 | onboarding_complete, study_submit, study_submit, study_submit, session_complete |
| 设置页展示完成数 | 通过 | 3 |
| 设置页展示首次答对率 | 通过 | 100% |
| 研究包给出机器可读隐私声明 | 通过 | {"containsRawAnswers":false,"containsImportedMaterial":false,"containsContact":false} |
| 研究包不含原始作答内容 | 通过 | 未发现三个测试答案 |
| 页面无运行时错误 | 通过 |  |
| 一次错误与重输形成两条历史 | 通过 | [{"id":"review-1791365073114-086y2z5","cardKey":"deck:en-b1:en-clarify","reviewedAt":"2026-10-07T09:24:33.114Z","result":"wrong","firstTry":false,"previousInterval":0,"scheduledInterval":0,"due":"","source":"deck","sessionId":"session-1791365073085-i72ew","schemaVersion":1},{"id":"review-1791365073379-zs3mm2v","cardKey":"deck:en-b1:en-clarify","reviewedAt":"2026-10-07T09:24:33.379Z","result":"retried","firstTry":false,"previousInterval":0,"scheduledInterval":1,"due":"2026-10-08","source":"deck","sessionId":"session-1791365073085-i72ew","schemaVersion":1}] |
| 历史记录未泄露错误答案 | 通过 | 未发现 banana |

## 移动端

| 检查项 | 结果 | 证据 |
|---|:---:|---|
| 新增学习记录无横向溢出 | 通过 | 390/390 |

## 评测自评

### 这套评测能说明什么

- 规则级检查、浏览器旅程和导出对象检查覆盖了从用户作答到研究数据包的完整证据链。
- 测试明确注入原始答案、导入文本和联系方式，验证白名单会排除这些字段。
- 错误后重输的两次尝试分别留存，为未来离线回放和 FSRS 参数实验保留信息。

### 这套评测不能说明什么

- 本地事件可被用户修改，不能作为审计级或反作弊数据。
- 这套评测证明数据结构可用，不证明 D1/D7 留存、长期记忆提升或因果效果。
- 当前没有服务端 cohort 看板；研究数据包仍需要用户自愿导出和分享。
- 时间戳依赖设备时钟，跨时区与错误系统时间需要在真实研究中单独处理。

### 上线判断

证据底座可以上线收集自愿研究样本，但不得把自动评测表述为真实留存或学习效果。
