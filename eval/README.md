# LingoGrab 专项评测

这套评测把三件事分开：

1. `routing.jsonl`：本地规则是否把输入分到拼写、相似词、复杂题或其他错误，并据此正确决定是否自动调用 AI。
2. `explanations.jsonl`：真实线上接口是否围绕题目、用户错误答案和词书事实生成有效讲解。
3. `extraction.jsonl`：从合成的会议、邮件和旅行材料中推荐表达时，格式、相关性、原文溯源和隐私边界是否通过。

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
