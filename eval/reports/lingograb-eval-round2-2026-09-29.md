# LingoGrab 首版专项评测报告

- 运行时间：2026-09-28T17:26:25.198Z
- 代码版本：main
- 评测集：错误分流 35 条；讲解 12 条；语料精选 5 条

## 结论

- 错误类型分流准确率：**100%（35/35）**。
- 自动调用 AI 决策准确率：**100%（35/35）**。
- 线上服务可用率：**100%（17/17）**。
- 讲解自动规则通过率：**100%（12/12）**。
- 语料精选综合通过率：**100%（5/5）**；格式 100%，相关性 100%，隐私 100%。
- 响应时延：中位数 **1790 ms**，P95 **19732 ms**；降级响应 13/17。
- 实际模型分布：glm-4-flash-250414 13 次；structured-rules 4 次。

## 错误分流明细

| 金标 | 通过 / 总数 |
|---|---:|
| empty | 2 / 2 |
| typo | 12 / 12 |
| semantic | 11 / 11 |
| complex | 4 / 4 |
| other | 6 / 6 |

## AI 讲解逐例结果

### explain-en-clarify · 通过

- 模型：glm-4-flash-250414；时延：17229 ms
- 输出：为什么答错：explain 是解释，但 clarify 更侧重消除对“成功标准”的模糊不清。易错点在于混淆了“解释”和“澄清”。   再给一个例句：Could you clarify the deadline for the report?
- 缺失要求：无
- 禁止项命中：无

### explain-en-align · 通过

- 模型：glm-4-flash-250414；时延：3094 ms
- 输出：为什么答错：用户答案“agree”虽意为同意，但未体现“就优先级形成一致认识”的特定含义。易错点在于混淆常用词与职场特定搭配。   再给例句：Let’s align on the next steps after the meeting.
- 缺失要求：无
- 禁止项命中：无

### explain-en-prioritize · 通过

- 模型：glm-4-flash-250414；时延：1561 ms
- 输出：为什么答错：order 意为“排列顺序”，但未体现优先处理含义。易错点：混淆“排序”与“确定优先级”。优先处理用 prioritize。例句：We need to prioritize the tasks for the next week.
- 缺失要求：无
- 禁止项命中：无

### explain-en-update · 通过

- 模型：glm-4-flash-250414；时延：1713 ms
- 输出：为什么答错：update指简短进展说明，report通常较正式或详尽。易错点：混淆两者适用场景。例句：I’ll send a report to the manager after the meeting.
- 缺失要求：无
- 禁止项命中：无

### explain-en-scope · 通过

- 模型：glm-4-flash-250414；时延：1438 ms
- 输出：为什么答错：range 指范围，但 project scope 特指项目工作边界。易错点：混淆常用词与专业术语。例句：This feature is outside the current project scope.
- 缺失要求：无
- 禁止项命中：无

### explain-en-feedback · 通过

- 模型：glm-4-flash-250414；时延：1790 ms
- 输出：为什么答错：feedback 是不可数名词，不能说 a comment。易错点：混淆不可数名词与可数名词。再给例句：Thanks for the information; we’ll analyze it.
- 缺失要求：无
- 禁止项命中：无

### explain-en-follow-up · 通过

- 模型：glm-4-flash-250414；时延：1585 ms
- 输出：为什么错：follow up with 表示继续跟进，contact 表示联系。   易错点：混淆了短语动词的固定搭配。   例句：She will follow up with the client next week to confirm the details.
- 缺失要求：无
- 禁止项命中：无

### explain-en-review · 通过

- 模型：glm-4-flash-250414；时延：2600 ms
- 输出：为什么答错：review 指审阅文件，比 look at 更正式，符合职场场景。look 太随意。   易错点：混淆 look at（随意看）和 review（审阅）。   例句：Could you review the report before the presentation?
- 缺失要求：无
- 禁止项命中：无

### explain-fr-savoir · 通过

- 模型：structured-rules；时延：1011 ms
- 输出：为什么：你写的是「connaissez」，这里应使用「savez」。savoir + 动词不定式表示“会做某事”。主语 vous 对应 savez；这里不是 connaître，因为后面接的是动作。 易错点：直陈式现在时、vous · 第二人称复数。 记忆方式：把当前主语和「savez」作为一组，再完整读一遍原句。
- 缺失要求：无
- 禁止项命中：无

### explain-fr-pouvoir · 通过

- 模型：structured-rules；时延：303 ms
- 输出：为什么：你写的是「voulez」，这里应使用「Pouvez」。Pouvez-vous… 是正式且常用的请求结构，适合邮件和会议。倒装后动词与主语代词用连字符连接。 易错点：直陈式现在时、倒装疑问句。 记忆方式：把当前主语和「Pouvez」作为一组，再完整读一遍原句。
- 缺失要求：无
- 禁止项命中：无

### explain-fr-vouloir · 通过

- 模型：structured-rules；时延：257 ms
- 输出：为什么：你写的是「veux」，这里应使用「voudrais」。je voudrais 比 je veux 更委婉，表达建议或请求时更适合正式沟通。 易错点：条件式现在时、礼貌表达。 记忆方式：把当前主语和「voudrais」作为一组，再完整读一遍原句。
- 缺失要求：无
- 禁止项命中：无

### explain-fr-prendre · 通过

- 模型：structured-rules；时延：232 ms
- 输出：为什么：你写的是「prends」，这里应使用「pris」。prendre note de 表示“记下”。复合过去时使用 avoir + pris；prendre 的过去分词是不规则形式 pris。 易错点：复合过去时、过去分词。 记忆方式：把当前主语和「pris」作为一组，再完整读一遍原句。
- 缺失要求：无
- 禁止项命中：无


## AI 语料精选逐例结果

### extract-en-meeting · 通过

- 模型：glm-4-flash-250414；时延：6048 ms
- 格式：通过；相关性：通过；隐私：通过
- 原文落地：target 4/4；example 4/4
- 推荐：align on；project scope；prioritize；follow up with

### extract-en-writing · 通过

- 模型：glm-4-flash-250414；时延：5814 ms
- 格式：通过；相关性：通过；隐私：通过
- 原文落地：target 3/3；example 3/3
- 推荐：review；update；feedback

### extract-en-privacy · 通过

- 模型：glm-4-flash-250414；时延：19732 ms
- 格式：通过；相关性：通过；隐私：通过
- 原文落地：target 3/3；example 3/3
- 推荐：delivery constraint；follow up with；scope review

### extract-fr-work · 通过

- 模型：glm-4-flash-250414；时延：5710 ms
- 格式：通过；相关性：通过；隐私：通过
- 原文落地：target 3/3；example 3/3
- 推荐：clarifier les priorités；faire le point；compte rendu

### extract-fr-travel · 通过

- 模型：glm-4-flash-250414；时延：5104 ms
- 格式：通过；相关性：通过；隐私：通过
- 原文落地：target 3/3；example 3/3
- 推荐：réserver；station de métro；passeport


## 口径边界

- 这是小样本离线专项评测，不等于真实用户学习效果。
- “自动规则通过率”是按固定金标和禁用项机械验收；人工教学有效性仍需逐例复核。
- 自动化测试、专项离线评测和真实用户效果应在简历中分别表述，不得互相替代。
