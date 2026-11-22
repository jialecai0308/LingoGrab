#!/usr/bin/env python3
"""Build reproducible, attributed choice cards from Tatoeba sentence pairs.

The published cards are a filtered corpus exercise, not human reviewed lessons
or official CEFR content. Rebuild using the pinned ManyThings English-Chinese
export and the checked-in direct French-Chinese link subset:

  pip install opencc-python-reimplemented
  python data/build-corpus-cards.py --source-dir /path/to/downloaded/zips
"""

import argparse
import csv
import gzip
import hashlib
import io
import json
import random
import re
import zipfile
from collections import defaultdict
from pathlib import Path

from opencc import OpenCC


ROOT = Path(__file__).resolve().parent
SOURCES = {
    "cmn-eng.zip": "d606361aa7312dcdfb15ef4fc51cb1e7ed8bc2dc608a7b192626cd36e8403106",
}
STOPWORDS = set("about after again already also always another around because before being between could every first from have having into just know last little many might more most must never only other over really same should since some still than that their them there these they thing those through very want were what when where which while would your youre years youve".split()).union(
    "ainsi alors autre autres avoir avec beaucoup bien bonne bonnes celui cette chaque comme comment dans depuis encore être faire faut faudra femme hommes jamais lequel mais même moins notre nous parce peut peux plus pour pourquoi quand quelle quelles quelque quelques sera sont sous sur tout tous très votre vous voici voilà".split()
)
BLOCKED = re.compile(
    r"\b(?:kill|killed|murder|suicide|sex|sexual|rape|porn|nazi|jesus|god|hell|damn|shit|fuck|tom|mary|john|sami|layla)\b",
    re.I,
)
EN_CHARS = re.compile(r"[A-Za-z'’ ,.!?;:\-]+\Z")
FR_CHARS = re.compile(r"[A-Za-zÀ-ÿ'’ ,.!?;:\-]+\Z")
WORD = re.compile(r"[A-Za-zÀ-ÿ]+")
CC = OpenCC("t2s")


def frequency(language):
    ranked = {}
    for line in (ROOT / f"{language}_50k.txt").read_text().splitlines():
        word = line.rsplit(" ", 1)[0].casefold()
        if word not in ranked and re.fullmatch(r"[a-zà-ÿ]+", word):
            ranked[word] = len(ranked) + 1
        if len(ranked) == 5000:
            break
    assert len(ranked) == 5000
    return ranked


def load_rows(path, member):
    with zipfile.ZipFile(path) as archive:
        with io.TextIOWrapper(archive.open(member), encoding="utf-8") as stream:
            yield from csv.reader(stream, delimiter="\t")


def sentence_ids(attribution):
    return re.findall(r"#(\d+)", attribution)


def clean_english(sentence):
    words = WORD.findall(sentence)
    if not 6 <= len(words) <= 14 or not EN_CHARS.fullmatch(sentence):
        return False
    if BLOCKED.search(sentence) or any(w[0].isupper() for w in words[1:] if w != "I"):
        return False
    return sentence.endswith((".", "?", "!")) and sentence.count(".") <= 1


def clean_chinese(sentence):
    simplified = CC.convert(sentence.strip())
    if not 5 <= len(simplified) <= 42 or re.search(r"[A-Za-z0-9<>/\\\[\]{}]", simplified):
        return None
    if not re.search(r"[\u4e00-\u9fff]", simplified):
        return None
    return simplified


def clean_french(sentence):
    words = WORD.findall(sentence)
    if not 6 <= len(words) <= 14 or not FR_CHARS.fullmatch(sentence):
        return False
    if BLOCKED.search(sentence) or any(w[0].isupper() for w in words[1:]):
        return False
    return sentence.endswith((".", "?", "!")) and sentence.count(".") <= 1


def targets(sentence, ranked):
    words = [word.casefold() for word in WORD.findall(sentence)]
    return [
        word for word in set(words)
        if 250 <= ranked.get(word, 99999) <= 5000
        and 4 <= len(word) <= 12
        and word not in STOPWORDS
        and words.count(word) == 1
    ]


def candidates(language, pairs, ranked):
    found = []
    for english, sentence, chinese, ids in pairs:
        if language == "en" and not clean_english(english):
            continue
        if language == "fr" and not clean_french(sentence):
            continue
        if language == "en" and sentence != english:
            continue
        for target in targets(sentence, ranked):
            match = re.search(r"(?<![A-Za-zÀ-ÿ])" + re.escape(target) + r"(?![A-Za-zÀ-ÿ])", sentence, re.I)
            if not match:
                continue
            cloze = sentence[:match.start()] + "___" + sentence[match.end():]
            if cloze.count("___") != 1:
                continue
            rank = ranked[target]
            score = abs(len(WORD.findall(sentence)) - 9) * 4 + abs(rank - 2200) / 600
            score += int(hashlib.sha256((sentence + target).encode()).hexdigest()[:4], 16) / 65536
            found.append((score, target, cloze, sentence, english, chinese, ids))
    return sorted(found, key=lambda row: row[0])


def select(rows, count, ranked, language):
    selected, used_sentences, uses = [], set(), defaultdict(int)
    for max_uses in (1, 2, 3):
        for score, target, cloze, sentence, english, chinese, ids in rows:
            if len(selected) == count:
                break
            if sentence in used_sentences or uses[target] >= max_uses:
                continue
            used_sentences.add(sentence)
            uses[target] += 1
            selected.append((target, cloze, sentence, english, chinese, ids))
        if len(selected) == count:
            break
    if len(selected) != count:
        raise RuntimeError(f"Only {len(selected)} {language} cards passed the filters; expected {count}")
    words = sorted(uses, key=lambda word: ranked[word])
    cards = []
    for target, cloze, sentence, english, chinese, ids in selected:
        rank, length = ranked[target], len(target)
        pool = [word for word in words if word != target and abs(ranked[word] - rank) <= 1200 and abs(len(word) - length) <= 2 and word[0] != target[0]]
        if len(pool) < 3:
            pool = [word for word in words if word != target and abs(len(word) - length) <= 3 and word[0] != target[0]]
        rng = random.Random(f"{language}:{ids[0]}:{target}")
        choices = rng.sample(pool, 3) + [target]
        rng.shuffle(choices)
        cards.append({
            "id": f"{language}-corpus-{ids[0]}",
            "target": target,
            "lemma": target,
            "level": "语境",
            "kind": "corpus-choice",
            "cloze": cloze,
            "translation": chinese,
            "grammar": ["双语例句", "四选一", "语料练习"],
            "explanation": f"原句：{sentence}。对照中文理解整句，再记住 {target} 在此处的用法。",
            "choices": choices,
            "sourceIds": ids,
        })
    ids = [card["id"] for card in cards]
    assert len(ids) == len(set(ids)), f"Duplicate {language} sentence IDs"
    return cards


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", type=Path, required=True)
    args = parser.parse_args()
    for name, digest in SOURCES.items():
        path = args.source_dir / name
        if hashlib.sha256(path.read_bytes()).hexdigest() != digest:
            raise ValueError(f"Source snapshot changed: {name}")

    chinese = {}
    for english, raw_chinese, credit in load_rows(args.source_dir / "cmn-eng.zip", "cmn.txt"):
        zh = clean_chinese(raw_chinese)
        ids = sentence_ids(credit)
        if zh and len(ids) == 2:
            # Prefer an originally simplified rendering when a source sentence has alternatives.
            old = chinese.get(english)
            if old is None or raw_chinese == zh and old[2] is False:
                chinese[english] = (zh, ids, raw_chinese == zh)

    english_pairs = [(en, en, zh, ids) for en, (zh, ids, _) in chinese.items()]
    french_pairs = []
    with gzip.open(ROOT / "fr-zh-direct-pairs.tsv.gz", "rt", encoding="utf-8") as stream:
        for row in csv.DictReader(stream, delimiter="\t"):
            french_pairs.append(("", row["french"], row["chinese"], [row["french_id"], row["chinese_id"]]))

    en = select(candidates("en", english_pairs, frequency("en")), 2500, frequency("en"), "en")
    fr = select(candidates("fr", french_pairs, frequency("fr")), 1500, frequency("fr"), "fr")
    output = ROOT / "tatoeba-corpus-cards.js"
    payload = json.dumps({"en": en, "fr": fr}, ensure_ascii=False, separators=(",", ":"))
    output.write_text("// Tatoeba CC BY 2.0 FR; IDs link to contributor credits at tatoeba.org.\nwindow.LINGOGRAB_CORPUS_CARDS=" + payload + ";\n")
    print(f"Wrote {len(en)} English and {len(fr)} French choice cards to {output.name}")


if __name__ == "__main__":
    main()
