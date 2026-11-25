"""Package attributed corpus cards for initial and on-demand loading."""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
COUNTS = {"en": 2500, "fr": 1500}


def compact(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def write_packages(corpus):
    starter_choices = json.loads((ROOT / "corpus-starter-choices.json").read_text())
    starter = {}
    for lang, count in COUNTS.items():
        cards = corpus[lang]
        by_sentence = {card["sourceIds"][0]: card for card in cards}
        if len(cards) != count or len(by_sentence) != count:
            raise ValueError(f"Expected {count} unique {lang} cards")
        curated = []
        for sentence_id, distractors in starter_choices[lang].items():
            card = by_sentence[sentence_id]
            choices = list(distractors)
            choices.insert(card["choices"].index(card["target"]), card["target"])
            if len(choices) != 4 or len(set(choices)) != 4:
                raise ValueError(f"Expected four distinct choices for {card['id']}")
            card["choices"] = choices
            curated.append(card)
        if len(curated) < 12:
            raise ValueError(f"Insufficient {lang} starter cards for a full round")
        for card in cards:
            card["explanation"] = re.sub(r"([.!?])。对照", r"\1 对照", card["explanation"])
        (ROOT / f"tatoeba-corpus-{lang}.json").write_text(compact(cards) + "\n")
        starter[lang] = {"count": count, "cards": curated}
    notice = "// Tatoeba CC BY 2.0 FR; cards retain links to the original contributors.\n"
    (ROOT / "tatoeba-corpus-starter.js").write_text(
        notice + "window.LINGOGRAB_CORPUS_STARTER=" + compact(starter) + ";\n"
    )


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        legacy = Path(sys.argv[1]).read_text()
        corpus = json.loads(legacy.split("window.LINGOGRAB_CORPUS_CARDS=", 1)[1].rstrip(";\n"))
    else:
        corpus = {
            lang: json.loads((ROOT / f"tatoeba-corpus-{lang}.json").read_text())
            for lang in COUNTS
        }
    write_packages(corpus)
