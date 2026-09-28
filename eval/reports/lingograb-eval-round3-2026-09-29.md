# LingoGrab 首版专项评测报告

- 运行时间：2026-09-28T17:34:17.183Z
- 代码版本：main
- 评测集：错误分流 35 条；讲解 12 条；语料精选 5 条

## 结论

- 错误类型分流准确率：**100%（35/35）**。
- 自动调用 AI 决策准确率：**100%（35/35）**。
- 线上服务可用率：**100%（17/17）**。
- 讲解自动规则通过率：**91.7%（11/12）**。
- 语料精选综合通过率：**100%（5/5）**；格式 100%，相关性 100%，隐私 100%。
- 响应时延：中位数 **3657 ms**，P95 **20671 ms**；降级响应 13/17。
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

### explain-en-clarify · 自动通过

- 模型：glm-4-flash-250414；时延：2682 ms
- 输出：为什么答错：explain 是解释，但 clarify 更侧重消除对“success looks like”的歧义。易错点：混淆 clarify 和 explain 的细微差别。再给例句：Could you clarify the deadline for the report?
- 缺失要求：无
- 禁止项命中：无

### explain-en-align · 自动通过

- 模型：glm-4-flash-250414；时延：18162 ms
- 输出：为什么选对：align on 指就优先级达成一致，符合句意。易错点：误用 agree，未理解固定搭配。例句：Let’s align on the next steps before the meeting starts.
- 缺失要求：无
- 禁止项命中：无

### explain-en-prioritize · 自动通过

- 模型：glm-4-flash-250414；时延：17085 ms
- 输出：为什么答错：order 意为“排列顺序”，但未体现优先处理含义。易错点：混淆“排序”与“优先处理”。正确词是「prioritize」，表示确定优先顺序。例句：The manager needs to prioritize the tasks for the week.
- 缺失要求：无
- 禁止项命中：无

### explain-en-update · 自动通过

- 模型：glm-4-flash-250414；时延：3657 ms
- 输出：为什么错：搭配不当。"send a report" 不符合语境，"send an update" 更常用，指发送简短进展说明。易错点：混淆常用搭配。"send an update after the meeting." 例句：I’ll send a brief update after the client call.
- 缺失要求：无
- 禁止项命中：无

### explain-en-scope · 自动未通过

- 模型：glm-4-flash-250414；时延：1451 ms
- 输出：为什么选错：用户答案“range”与“scope”词义相近但非固定搭配。易错点：混淆近义词。例句：This feature is outside the current project scope.
- 缺失要求：范围/边界
- 禁止项命中：无

### explain-en-feedback · 自动通过

- 模型：glm-4-flash-250414；时延：1315 ms
- 输出：为什么选feedback：该词是不可数名词，符合thanks for后的用法。易错点：误用可数名词comment。例句：Thanks for the feedback; we’ll improve the plan.
- 缺失要求：无
- 禁止项命中：无

### explain-en-follow-up · 自动通过

- 模型：glm-4-flash-250414；时延：1945 ms
- 输出：为什么：短语动词 "follow up with" 意为继续跟进，此处强调与供应商的后续联系。   易错点：用户答案 "contact" 虽然语法正确，但未体现 "继续跟进" 的含义。   再给例句：We need to follow up with the client about the delayed delivery.
- 缺失要求：无
- 禁止项命中：无

### explain-en-review · 自动通过

- 模型：glm-4-flash-250414；时延：17655 ms
- 输出：为什么答错：review 指审阅文件更正式，而 look 含义较宽泛。   易错点：未注意职场场景下动词的正式度要求。   再给例句：Could you review the report before the presentation?
- 缺失要求：无
- 禁止项命中：无

### explain-fr-savoir · 自动通过

- 模型：structured-rules；时延：1008 ms
- 输出：为什么：你写的是「connaissez」，这里应使用「savez」。savoir + 动词不定式表示“会做某事”。主语 vous 对应 savez；这里不是 connaître，因为后面接的是动作。 易错点：直陈式现在时、vous · 第二人称复数。 记忆方式：把当前主语和「savez」作为一组，再完整读一遍原句。
- 缺失要求：无
- 禁止项命中：无

### explain-fr-pouvoir · 自动通过

- 模型：structured-rules；时延：298 ms
- 输出：为什么：你写的是「voulez」，这里应使用「Pouvez」。Pouvez-vous… 是正式且常用的请求结构，适合邮件和会议。倒装后动词与主语代词用连字符连接。 易错点：直陈式现在时、倒装疑问句。 记忆方式：把当前主语和「Pouvez」作为一组，再完整读一遍原句。
- 缺失要求：无
- 禁止项命中：无

### explain-fr-vouloir · 自动通过

- 模型：structured-rules；时延：304 ms
- 输出：为什么：你写的是「veux」，这里应使用「voudrais」。je voudrais 比 je veux 更委婉，表达建议或请求时更适合正式沟通。 易错点：条件式现在时、礼貌表达。 记忆方式：把当前主语和「voudrais」作为一组，再完整读一遍原句。
- 缺失要求：无
- 禁止项命中：无

### explain-fr-prendre · 自动通过

- 模型：structured-rules；时延：290 ms
- 输出：为什么：你写的是「prends」，这里应使用「pris」。prendre note de 表示“记下”。复合过去时使用 avoir + pris；prendre 的过去分词是不规则形式 pris。 易错点：复合过去时、过去分词。 记忆方式：把当前主语和「pris」作为一组，再完整读一遍原句。
- 缺失要求：无
- 禁止项命中：无


## AI 语料精选逐例结果

### extract-en-meeting · 通过

- 模型：glm-4-flash-250414；时延：4353 ms
- 格式：通过；相关性：通过；隐私：通过
- 原文落地：target 3/3；example 3/3
- 推荐：align on；project scope；follow up with

### extract-en-writing · 通过

- 模型：glm-4-flash-250414；时延：7108 ms
- 格式：通过；相关性：通过；隐私：通过
- 原文落地：target 3/3；example 3/3
- 推荐：review；update；feedback

### extract-en-privacy · 通过

- 模型：glm-4-flash-250414；时延：5720 ms
- 格式：通过；相关性：通过；隐私：通过
- 原文落地：target 3/3；example 3/3
- 推荐：delivery constraint；follow up with；scope review

### extract-fr-work · 通过

- 模型：glm-4-flash-250414；时延：20671 ms
- 格式：通过；相关性：通过；隐私：通过
- 原文落地：target 3/3；example 3/3
- 推荐：clarifier les priorités；faire le point；compte rendu

### extract-fr-travel · 通过

- 模型：glm-4-flash-250414；时延：5173 ms
- 格式：通过；相关性：通过；隐私：通过
- 原文落地：target 3/3；example 3/3
- 推荐：réserver；station de métro；passeport


## 口径边界

- 这是小样本离线专项评测，不等于真实用户学习效果。
- “自动规则通过率”是按固定金标和禁用项机械验收；人工教学有效性仍需逐例复核。
- 自动化测试、专项离线评测和真实用户效果应在简历中分别表述，不得互相替代。
