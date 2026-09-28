# LingoGrab 首版专项评测报告

- 运行时间：2026-09-28T17:42:34.806Z
- 代码版本：454f39d
- 评测集：错误分流 35 条；讲解 12 条；语料精选 5 条

## 结论

- 错误类型分流准确率：**100%（35/35）**。
- 自动调用 AI 决策准确率：**100%（35/35）**。
- 线上服务可用率：**100%（17/17）**。
- 讲解自动规则通过率：**91.7%（11/12）**。
- 语料精选综合通过率：**100%（5/5）**；格式 100%，相关性 100%，隐私 100%。
- 响应时延：中位数 **2643 ms**，P95 **18036 ms**；降级响应 13/17。
- 实际模型分布：glm-4-flash-250414 13 次；structured-rules 4 次。
- AI 讲解人工通过率：**100%（12/12）**；方法：逐例检查是否解释用户答案与目标答案的差异、是否忠于词书事实、是否给出包含目标答案的可用例句。

## 错误分流明细

| 金标 | 通过 / 总数 |
|---|---:|
| empty | 2 / 2 |
| typo | 12 / 12 |
| semantic | 11 / 11 |
| complex | 4 / 4 |
| other | 6 / 6 |

## AI 讲解逐例结果

### explain-en-clarify · 自动通过 · 人工通过

- 模型：glm-4-flash-250414；时延：2916 ms
- 输出：为什么错：用户答案「explain」虽也意为解释，但未达消除歧义的效果。易错点：混淆了「clarify」的消除歧义特性和「explain」的泛指解释。例句：Could you clarify the deadline for the report?
- 缺失要求：无
- 禁止项命中：无
- 人工结论：准确区分 explain 的泛化解释与 clarify 的消除歧义，例句包含目标词。

### explain-en-align · 自动通过 · 人工通过

- 模型：glm-4-flash-250414；时延：18036 ms
- 输出：为什么选「align」？「align on」强调就优先级达成一致认识，常用于会议或决策前。用户答案「agree」虽也表同意，但未突出统一优先级的含义。易错点在于混淆常用词义。例：Let’s align on the next steps before the meeting starts. 例句：Let’s align on the priorities before we start.
- 缺失要求：无
- 禁止项命中：无
- 人工结论：承认 agree 可表达同意，并说明 align on 更强调统一优先级认知。

### explain-en-prioritize · 自动通过 · 人工通过

- 模型：glm-4-flash-250414；时延：2643 ms
- 输出：为什么选「prioritize」？因为这里强调按重要性排序问题，而「order」只是排列，未突出优先级。易错点是把排序等同于优先处理。例句：We need to prioritize the tasks for the next week.
- 缺失要求：无
- 禁止项命中：无
- 人工结论：准确区分一般排序与优先级处理，例句可迁移。

### explain-en-update · 自动通过 · 人工通过

- 模型：glm-4-flash-250414；时延：1995 ms
- 输出：为什么选「update」？「report」也可指报告，但「send an update」是项目协作中发送简短进展说明的常用搭配。易错点在于混淆常用搭配。例句：I’ll send an update after the team meeting.
- 缺失要求：无
- 禁止项命中：无
- 人工结论：承认 report 可以成立，同时说明 send an update 在简短进展场景更自然。

### explain-en-scope · 自动通过 · 人工通过

- 模型：glm-4-flash-250414；时延：2097 ms
- 输出：为什么选错？「range」指范围或幅度，但「project scope」是固定搭配，指项目工作边界。易错点在于混淆了常用词与特定术语。再给一个例句：This feature is outside the current project scope.
- 缺失要求：无
- 禁止项命中：无
- 人工结论：准确说明 project scope 的固定搭配与工作边界含义。

### explain-en-feedback · 自动未通过 · 人工通过

- 模型：glm-4-flash-250414；时延：1588 ms
- 输出：为什么选「feedback」？「comment」虽也可用，但「feedback」更符合感谢对提案的修改建议这一语境。易错点在于混淆「feedback」和「comment」在此处的适用性。例句：Thanks for the valuable feedback; we’ll improve the design.
- 缺失要求：不可数/a piece of
- 禁止项命中：无
- 人工结论：承认 comment 可以使用，并准确说明 feedback 更覆盖整体修改建议；未出现可数性错误。

### explain-en-follow-up · 自动通过 · 人工通过

- 模型：glm-4-flash-250414；时延：1911 ms
- 输出：为什么错：用户答案「contact」虽也合理，但「follow up with」特指持续跟进，更贴合原句语境。易错点：忽略短语动词的特定含义。例句：We need to follow up with the client about the delayed delivery.
- 缺失要求：无
- 禁止项命中：无
- 人工结论：准确区分一般联系与持续跟进，例句包含 follow up with。

### explain-en-review · 自动通过 · 人工通过

- 模型：glm-4-flash-250414；时延：2924 ms
- 输出：为什么选「review」？「look」虽通用，但「review」在职场审阅文件时更精准正式。易错点：混淆通用词与场景专用词。例句：Please review the report before the presentation.
- 缺失要求：无
- 禁止项命中：无
- 人工结论：准确说明 review 在职场审阅文件场景比 look 更精准正式。

### explain-fr-savoir · 自动通过 · 人工通过

- 模型：structured-rules；时延：1351 ms
- 输出：为什么：你写的是「connaissez」，这里应使用「savez」。savoir + 动词不定式表示“会做某事”。主语 vous 对应 savez；这里不是 connaître，因为后面接的是动作。 易错点：直陈式现在时、vous · 第二人称复数。 记忆方式：把当前主语和「savez」作为一组，再完整读一遍原句。
- 缺失要求：无
- 禁止项命中：无
- 人工结论：人称、直陈式现在时及 savoir + 不定式均与词书事实一致。

### explain-fr-pouvoir · 自动通过 · 人工通过

- 模型：structured-rules；时延：304 ms
- 输出：为什么：你写的是「voulez」，这里应使用「Pouvez」。Pouvez-vous… 是正式且常用的请求结构，适合邮件和会议。倒装后动词与主语代词用连字符连接。 易错点：直陈式现在时、倒装疑问句。 记忆方式：把当前主语和「Pouvez」作为一组，再完整读一遍原句。
- 缺失要求：无
- 禁止项命中：无
- 人工结论：Pouvez-vous 倒装、连字符与人称信息均正确。

### explain-fr-vouloir · 自动通过 · 人工通过

- 模型：structured-rules；时延：312 ms
- 输出：为什么：你写的是「veux」，这里应使用「voudrais」。je voudrais 比 je veux 更委婉，表达建议或请求时更适合正式沟通。 易错点：条件式现在时、礼貌表达。 记忆方式：把当前主语和「voudrais」作为一组，再完整读一遍原句。
- 缺失要求：无
- 禁止项命中：无
- 人工结论：准确解释 voudrais 的条件式和礼貌语用。

### explain-fr-prendre · 自动通过 · 人工通过

- 模型：structured-rules；时延：231 ms
- 输出：为什么：你写的是「prends」，这里应使用「pris」。prendre note de 表示“记下”。复合过去时使用 avoir + pris；prendre 的过去分词是不规则形式 pris。 易错点：复合过去时、过去分词。 记忆方式：把当前主语和「pris」作为一组，再完整读一遍原句。
- 缺失要求：无
- 禁止项命中：无
- 人工结论：准确解释 avoir + pris 及不规则过去分词。


## AI 语料精选逐例结果

### extract-en-meeting · 通过

- 模型：glm-4-flash-250414；时延：7210 ms
- 格式：通过；相关性：通过；隐私：通过
- 原文落地：target 4/4；example 4/4
- 推荐：align on；project scope；prioritize；follow up with

### extract-en-writing · 通过

- 模型：glm-4-flash-250414；时延：7938 ms
- 格式：通过；相关性：通过；隐私：通过
- 原文落地：target 3/3；example 3/3
- 推荐：review；brief update；client call

### extract-en-privacy · 通过

- 模型：glm-4-flash-250414；时延：4526 ms
- 格式：通过；相关性：通过；隐私：通过
- 原文落地：target 3/3；example 3/3
- 推荐：delivery constraint；follow up with；scope review

### extract-fr-work · 通过

- 模型：glm-4-flash-250414；时延：5418 ms
- 格式：通过；相关性：通过；隐私：通过
- 原文落地：target 3/3；example 3/3
- 推荐：clarifier les priorités；faire le point；compte rendu

### extract-fr-travel · 通过

- 模型：glm-4-flash-250414；时延：5181 ms
- 格式：通过；相关性：通过；隐私：通过
- 原文落地：target 3/3；example 3/3
- 推荐：réserver；station de métro；passeport


## 口径边界

- 这是小样本离线专项评测，不等于真实用户学习效果。
- “自动规则通过率”是按固定金标和禁用项机械验收；人工教学有效性仍需逐例复核。
- 自动化测试、专项离线评测和真实用户效果应在简历中分别表述，不得互相替代。
