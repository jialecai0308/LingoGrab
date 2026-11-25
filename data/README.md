# Frequency word data

This directory contains the English and French 2018 frequency lists from
[hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords):

- `en_50k.txt`
- `fr_50k.txt`

The upstream lists are generated from the OpenSubtitles 2018 corpus. Each line
contains a token followed by its corpus occurrence count. The upstream project
licenses its code under MIT and its generated content under CC BY-SA 4.0.

Pickup loads these source files in the browser, removes obvious non-word tokens
and duplicates, and uses the first 5,000 valid entries per language as the MVP
core-frequency index. Each language is then split into two frequency bands for
the current sample bookshelf. These bands are product learning gradients, not
official CEFR certification. Preview words are separately curated so subtitle
names and function-word noise are not presented as lesson content. Frequency
rank is not treated as a meaning or proof that a learning card has already been
editorially reviewed.

Source: https://github.com/hermitdave/FrequencyWords

Content license: https://creativecommons.org/licenses/by-sa/4.0/

## Tatoeba 语境练习卡

按语言拆分的 `tatoeba-corpus-en.json` 和 `tatoeba-corpus-fr.json` 包含 4,000 张可直接进入练习和 FSRS 复习的四选一卡：英语 2,500 张、法语 1,500 张。它们与现有人工整理的填空卡分开标注，**经过自动筛选，但未逐张人工审校**，也不表示官方 CEFR 等级。首次加载只读取 `tatoeba-corpus-starter.js`（每种语言 16 张首轮卡），进入后续练习时按需加载相应语言的完整词书。首轮错项维护在 `corpus-starter-choices.json`；更新错项后运行 `python3 data/corpus_packages.py` 重新打包。每张卡有原句、简体中文对照、挖空项、四个备选词和 Tatoeba 句子编号；法语卡只取 Tatoeba 明确标记为直接互译的法中句对，仍可能有个别译文误差。

- 数据源：[ManyThings 的 Tatoeba 句对快照](https://www.manythings.org/anki/)：`cmn-eng.zip` 与 `fra-eng.zip`，2026-02-13 的导出；法中直接关系来自 [Tatoeba links 导出](https://tatoeba.org/en/downloads)，2026-11-21 快照。句子版权归原贡献者，许可为 [CC BY 2.0 FR](https://creativecommons.org/licenses/by/2.0/fr/)。卡片保存句子编号，产品内可点开每句在 Tatoeba 的贡献者页面。
- 构建脚本：下载上述两个 zip 和 `links.tar.bz2` 到同一目录，安装 `opencc-python-reimplemented`，先执行 `python3 data/build-direct-pairs.py --source-dir <目录>`，再执行 `python3 data/build-corpus-cards.py --source-dir <目录>`。脚本检查快照 SHA-256，生成可复用的 `fr-zh-direct-pairs.tsv.gz`，转换繁体中文，过滤过短、重复和明显不适合练习的句子，并生成稳定的卡片 ID。
- 已有人工整理卡的 ID、用户练习记录和个人拾取卡保持原样；语境卡使用独立词书。词频文件仅用于候选词筛选，词频数量不计入练习卡数量。
