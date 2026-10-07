# LingoGrab 复习解释层评测报告

生成时间：2026-10-07T15:01:02.643Z

## 结论

本轮共执行 21 项检查，通过 21 项，失败 0 项。

## 排期规则

| 检查项 | 结果 | 证据 |
|---|:---:|---|
| 固定生成连续 7 天 | 通过 | [{"date":"2026-10-07","offset":0,"count":2},{"date":"2026-10-08","offset":1,"count":1},{"date":"2026-10-09","offset":2,"count":0},{"date":"2026-10-10","offset":3,"count":1},{"date":"2026-10-11","offset":4,"count":0},{"date":"2026-10-12","offset":5,"count":0},{"date":"2026-10-13","offset":6,"count":0}] |
| 逾期内容合并到今天 | 通过 | {"date":"2026-10-07","offset":0,"count":2} |
| 明日与未来日期分别计数 | 通过 | [{"date":"2026-10-07","offset":0,"count":2},{"date":"2026-10-08","offset":1,"count":1},{"date":"2026-10-09","offset":2,"count":0},{"date":"2026-10-10","offset":3,"count":1},{"date":"2026-10-11","offset":4,"count":0},{"date":"2026-10-12","offset":5,"count":0},{"date":"2026-10-13","offset":6,"count":0}] |
| 窗口外和无效日期不进入日历 | 通过 | [{"date":"2026-10-07","offset":0,"count":2},{"date":"2026-10-08","offset":1,"count":1},{"date":"2026-10-09","offset":2,"count":0},{"date":"2026-10-10","offset":3,"count":1},{"date":"2026-10-11","offset":4,"count":0},{"date":"2026-10-12","offset":5,"count":0},{"date":"2026-10-13","offset":6,"count":0}] |

## 延迟回忆指标

| 检查项 | 结果 | 证据 |
|---|:---:|---|
| 首次学习不进入延迟回忆分母 | 通过 | {"attempts":5,"completed":4,"firstTry":3,"firstTryRate":75,"retried":1,"acceptable":1,"wrongAttempts":1,"delayedReviews":3,"delayedFirstTry":2,"delayedRecallRate":67,"repeatCards":1} |
| 错误尝试不重复扩大完成分母 | 通过 | {"attempts":5,"completed":4,"firstTry":3,"firstTryRate":75,"retried":1,"acceptable":1,"wrongAttempts":1,"delayedReviews":3,"delayedFirstTry":2,"delayedRecallRate":67,"repeatCards":1} |
| 延迟首次正确率按完成事件计算 | 通过 | {"attempts":5,"completed":4,"firstTry":3,"firstTryRate":75,"retried":1,"acceptable":1,"wrongAttempts":1,"delayedReviews":3,"delayedFirstTry":2,"delayedRecallRate":67,"repeatCards":1} |
| 识别至少完成两次的卡片 | 通过 | {"attempts":5,"completed":4,"firstTry":3,"firstTryRate":75,"retried":1,"acceptable":1,"wrongAttempts":1,"delayedReviews":3,"delayedFirstTry":2,"delayedRecallRate":67,"repeatCards":1} |
| 无隔日样本时返回空值而非 0% | 通过 | {"attempts":1,"completed":1,"firstTry":1,"firstTryRate":100,"retried":0,"acceptable":0,"wrongAttempts":0,"delayedReviews":0,"delayedFirstTry":0,"delayedRecallRate":null,"repeatCards":0} |

## 静态实现

| 检查项 | 结果 | 证据 |
|---|:---:|---|
| 今天页包含 7 天复习日历 | 通过 | reviewForecast |
| 学习记录包含延迟回忆指标 | 通过 | evidenceDelayedRecall |
| 完成页区分到期复习 | 通过 | 到期复习 + scheduledReviews |

## 浏览器旅程

| 检查项 | 结果 | 证据 |
|---|:---:|---|
| 今天页渲染恰好 7 个日期格 | 通过 | 2,1,0,1,0,0,0 |
| 页面合并逾期并排除第 8 天 | 通过 | 2,1,0,1,0,0,0 |
| 摘要解释当前已排期数量 | 通过 | 已排入 4 个表达 |
| 设置页显示真实延迟回忆率 | 通过 | 67% |
| 完成页区分两次到期复习 | 通过 | 2,100%,2,100% |
| 到期复习首次正确显示 100% | 通过 | 2,100%,2,100% |
| 完成事件保留到期复习口径 | 通过 | {"id":"event-1791385261482-6y4tqt6","name":"session_complete","timestamp":"2026-10-07T15:01:01.482Z","schemaVersion":1,"properties":{"sessionId":"session-1791385260966-rnmf4","total":2,"firstTryCorrect":2,"retried":0,"scheduledReviews":2,"delayedRecallRate":100,"source":"study"}} |
| 页面无运行时错误 | 通过 |  |

## 移动端

| 检查项 | 结果 | 证据 |
|---|:---:|---|
| 7 天日历无横向溢出 | 通过 | 390/390 |

## 评测自评

### 这套评测能说明什么

- 纯规则测试固定系统日期，覆盖逾期合并、窗口边界、无效日期和延迟回忆分母。
- 浏览器测试注入真实学习状态，验证日历、设置指标、完成页和事件记录口径一致。
- 专门验证无隔日样本时显示空值，避免把没有证据误写成 0% 记忆率。

### 这套评测不能说明什么

- 7 天日历是当前排期的确定性展示，不是对记忆概率的预测。
- 延迟回忆率来自本机小样本，不能证明长期学习效果或产品因果增益。
- 日期计算依赖设备时钟和本地时区；跨时区真实设备仍需补测。
- 本轮没有将现有间隔规则与 FSRS 做离线对照，因此不支持宣称算法已最优。

### 上线判断

复习解释层可以上线；对外只能表述为真实排期与作答证据，不得表述为记忆预测或学习效果证明。
