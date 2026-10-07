# LingoGrab 专项评测

这套评测把三件事分开：

1. `routing.jsonl`：本地规则是否把输入分到拼写、相似词、复杂题或其他错误，并据此正确决定是否自动调用 AI。
2. `explanations.jsonl`：真实线上接口是否围绕题目、用户错误答案和词书事实生成有效讲解。
3. `extraction.jsonl`：从合成的会议、邮件和旅行材料中推荐表达时，格式、相关性、原文溯源和隐私边界是否通过。
4. `run-product-experience.mjs`：多答案公平性、复习排期、首次体验、个人拾取闭环、简化反馈与设置页、点赞上传、产品看板、完成页和移动端关键路径是否可用。
5. `run-learning-evidence.mjs`：逐次复习历史、事件隐私白名单、跨设备去重、研究数据包和用户学习指标是否形成完整证据链。
6. `run-review-insights.mjs`：未来 7 天排期、逾期合并、延迟回忆口径、完成页解释和移动端布局是否一致。

运行纯本地分流评测：

```bash
node eval/run-eval.mjs
```

运行线上真实模型评测：

```bash
node eval/run-eval.mjs --live
```

线上评测使用公开 LingoGrab 接口与合成材料，不包含真实企业资料或用户隐私。脚本按生产限流分批执行，原始输出和逐例判定保存在 `eval/reports/`。

报告中的“自动规则通过率”不能直接写成用户学习效果；完成逐例人工复核后，才可以写“AI 讲解人工通过率”。

完成逐例复核后，将判定写入 `eval/reviews/human-review.json`，再把人工结果合并回同一份报告：

```bash
node eval/run-eval.mjs --rescore eval/reports/lingograb-eval-YYYY-MM-DD.json --review eval/reviews/human-review.json
```

运行产品闭环评测：

```bash
NODE_PATH=/path/to/node_modules node eval/run-product-experience.mjs
```

该脚本会启动临时本地服务器和无头浏览器，验证两步新手引导、可接受答案、三题完成页、学习记录、复习日期、个人拾取立即练习、错误反馈信息层级、设置页默认复杂度、点赞上传、产品看板真实渲染、小样本提示和 390 像素移动端视口。报告固定写入：

- `eval/reports/lingograb-product-optimization-evaluation.md`
- `eval/reports/lingograb-product-optimization-evaluation.json`

运行学习证据底座评测：

```bash
NODE_PATH=/path/to/node_modules node eval/run-learning-evidence.mjs
```

该脚本会主动注入原始答案、导入文本和联系方式，检查这些字段不会进入事件日志；同时在真实浏览器中验证错误后重输会形成两条可回放历史、研究包不含作答内容、设置页指标正确且移动端无横向溢出。报告固定写入：

- `eval/reports/lingograb-learning-evidence-evaluation.md`
- `eval/reports/lingograb-learning-evidence-evaluation.json`

运行复习解释层评测：

```bash
NODE_PATH=/path/to/node_modules node eval/run-review-insights.mjs
```

该脚本固定日期验证 7 天排期边界，并在浏览器注入包含逾期、今日、未来和窗口外记录的学习状态，检查日历、延迟回忆、完成页和事件口径一致。报告固定写入：

- `eval/reports/lingograb-review-insights-evaluation.md`
- `eval/reports/lingograb-review-insights-evaluation.json`

## 评测如何自评

每份产品闭环报告同时写明评测能说明什么和不能说明什么。当前自动化可以证明关键实现与浏览器旅程符合预期，但不能证明 D1 / D7 留存、长期记忆效果、语言事实的专家一致性或真实设备兼容性。7 天日历只是当前排期，不是记忆概率预测；延迟回忆率是本机样本描述，不是因果结论。上线答辩时应分别表述自动规则结果、浏览器旅程结果、AI 判官结果、人工复核结果和真实用户指标，不能把它们合并成一个“准确率”。
