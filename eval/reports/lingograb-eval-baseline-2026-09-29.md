# LingoGrab 首版专项评测报告

- 运行时间：2026-09-28T17:13:21.051Z
- 代码版本：main
- 评测集：错误分流 35 条；讲解 12 条；语料精选 5 条

## 结论

- 错误类型分流准确率：**100%（35/35）**。
- 自动调用 AI 决策准确率：**100%（35/35）**。
- 线上服务可用率：**76.5%（13/17）**。
- 讲解自动规则通过率：**66.7%（8/12）**。
- 语料精选综合通过率：**20%（1/5）**；格式 100%，相关性 100%，隐私 80%。
- 响应时延：中位数 **4354 ms**，P95 **20045 ms**；降级响应 9/17。
- 实际模型分布：model_unavailable 4 次；glm-4-flash-250414 9 次；structured-rules 4 次。

## 错误分流明细

| 金标 | 通过 / 总数 |
|---|---:|
| empty | 2 / 2 |
| typo | 12 / 12 |
| semantic | 11 / 11 |
| complex | 4 / 4 |
| other | 6 / 6 |

## AI 讲解逐例结果

### explain-en-clarify · 未通过

- 模型：model_unavailable；时延：1090 ms
- 输出：model_unavailable
- 缺失要求：clarify；explain；澄清/歧义
- 禁止项命中：无

### explain-en-align · 通过

- 模型：glm-4-flash-250414；时延：2499 ms
- 输出：为什么答错：用户答案“agree”虽意为同意，但“align on”特指就优先级达成一致认知。易错点：混淆“agree”与“align on”在职场语境下的精确含义。例句：Let’s align on the project goals before the meeting starts.
- 缺失要求：无
- 禁止项命中：无

### explain-en-prioritize · 通过

- 模型：glm-4-flash-250414；时延：17643 ms
- 输出：为什么答错：order 意为“排列顺序”，但未体现优先处理含义。易错点：混淆“排序”与“确定优先级”。优先处理需用 prioritize。例句：We need to prioritize the tasks for the next week.
- 缺失要求：无
- 禁止项命中：无

### explain-en-update · 未通过

- 模型：model_unavailable；时延：1092 ms
- 输出：model_unavailable
- 缺失要求：update；report；进展/简短
- 禁止项命中：无

### explain-en-scope · 未通过

- 模型：model_unavailable；时延：1062 ms
- 输出：model_unavailable
- 缺失要求：scope；range；范围/边界
- 禁止项命中：无

### explain-en-feedback · 未通过

- 模型：model_unavailable；时延：1110 ms
- 输出：model_unavailable
- 缺失要求：feedback；comment；不可数/a piece of
- 禁止项命中：无

### explain-en-follow-up · 通过

- 模型：glm-4-flash-250414；时延：1849 ms
- 输出：为什么错：follow up with 表示继续跟进，contact 表示联系。   易错点：混淆了短语动词的固定搭配。   例句：She will follow up with the client next week to confirm the details.
- 缺失要求：无
- 禁止项命中：无

### explain-en-review · 通过

- 模型：glm-4-flash-250414；时延：4354 ms
- 输出：为什么答错：review 意为审阅，比 look at 更正式，符合职场场景。look 太随意。   易错点：混淆 look at（随意看）和 review（审阅）。   例句：Could you review the report before the presentation?
- 缺失要求：无
- 禁止项命中：无

### explain-fr-savoir · 通过

- 模型：structured-rules；时延：751 ms
- 输出：为什么：你写的是「connaissez」，这里应使用「savez」。savoir + 动词不定式表示“会做某事”。主语 vous 对应 savez；这里不是 connaître，因为后面接的是动作。 易错点：直陈式现在时、vous · 第二人称复数。 记忆方式：把当前主语和「savez」作为一组，再完整读一遍原句。
- 缺失要求：无
- 禁止项命中：无

### explain-fr-pouvoir · 通过

- 模型：structured-rules；时延：745 ms
- 输出：为什么：你写的是「voulez」，这里应使用「Pouvez」。Pouvez-vous… 是正式且常用的请求结构，适合邮件和会议。倒装后动词与主语代词用连字符连接。 易错点：直陈式现在时、倒装疑问句。 记忆方式：把当前主语和「Pouvez」作为一组，再完整读一遍原句。
- 缺失要求：无
- 禁止项命中：无

### explain-fr-vouloir · 通过

- 模型：structured-rules；时延：790 ms
- 输出：为什么：你写的是「veux」，这里应使用「voudrais」。je voudrais 比 je veux 更委婉，表达建议或请求时更适合正式沟通。 易错点：条件式现在时、礼貌表达。 记忆方式：把当前主语和「voudrais」作为一组，再完整读一遍原句。
- 缺失要求：无
- 禁止项命中：无

### explain-fr-prendre · 通过

- 模型：structured-rules；时延：746 ms
- 输出：为什么：你写的是「prends」，这里应使用「pris」。prendre note de 表示“记下”。复合过去时使用 avoir + pris；prendre 的过去分词是不规则形式 pris。 易错点：复合过去时、过去分词。 记忆方式：把当前主语和「pris」作为一组，再完整读一遍原句。
- 缺失要求：无
- 禁止项命中：无


## AI 语料精选逐例结果

### extract-en-meeting · 未通过

- 模型：glm-4-flash-250414；时延：6047 ms
- 格式：通过；相关性：通过；隐私：通过
- 原文落地：target 4/4；example 1/4
- 推荐：align on；project scope；prioritize；follow up with

### extract-en-writing · 未通过

- 模型：glm-4-flash-250414；时延：6390 ms
- 格式：通过；相关性：通过；隐私：通过
- 原文落地：target 3/4；example 4/4
- 推荐：review；brief update；client call；share feedback

### extract-en-privacy · 未通过

- 模型：glm-4-flash-250414；时延：4483 ms
- 格式：通过；相关性：通过；隐私：未通过（Maya Chen、maya.chen@example.com、13800138000）
- 原文落地：target 3/3；example 3/3
- 推荐：delivery constraint；follow up with；scope review

### extract-fr-work · 未通过

- 模型：glm-4-flash-250414；时延：5570 ms
- 格式：通过；相关性：通过；隐私：通过
- 原文落地：target 3/3；example 2/3
- 推荐：clarifier les priorités；faire le point；compte rendu

### extract-fr-travel · 通过

- 模型：glm-4-flash-250414；时延：20045 ms
- 格式：通过；相关性：通过；隐私：通过
- 原文落地：target 3/3；example 3/3
- 推荐：réserver；station de métro；passeport


## 口径边界

- 这是小样本离线专项评测，不等于真实用户学习效果。
- “自动规则通过率”是按固定金标和禁用项机械验收；人工教学有效性仍需逐例复核。
- 自动化测试、专项离线评测和真实用户效果应在简历中分别表述，不得互相替代。
