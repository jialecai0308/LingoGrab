#!/usr/bin/env python3
"""Freeze directly linked Tatoeba French-Chinese sentence pairs for card building.

Inputs: ManyThings cmn-eng.zip and fra-eng.zip from 2026-02-13, plus Tatoeba's
links.tar.bz2 export from 2026-11-21. All inputs are checked by SHA-256.
"""

import argparse
import csv
import gzip
import hashlib
import importlib.util
import io
import re
import tarfile
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DIGESTS = {
    "cmn-eng.zip": "d606361aa7312dcdfb15ef4fc51cb1e7ed8bc2dc608a7b192626cd36e8403106",
    "fra-eng.zip": "9e35994767f7307dc1fa9d5efcc36681f3756a1bdaaa02c1381b3eb11461261e",
    "links.tar.bz2": "7a6e0438fe8f1b083ffadf45150ff7ed22404a86ab70b72d7d67eba8873fb427",
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", type=Path, required=True)
    args = parser.parse_args()
    for name, expected in DIGESTS.items():
        actual = hashlib.sha256((args.source_dir / name).read_bytes()).hexdigest()
        if actual != expected:
            raise ValueError(f"Source snapshot changed: {name}")

    spec = importlib.util.spec_from_file_location("corpus_builder", ROOT / "build-corpus-cards.py")
    builder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(builder)
    chinese, french = {}, {}
    with zipfile.ZipFile(args.source_dir / "cmn-eng.zip") as archive:
        with io.TextIOWrapper(archive.open("cmn.txt"), encoding="utf-8") as stream:
            for row in csv.reader(stream, delimiter="\t"):
                ids = re.findall(r"#(\d+)", row[2])
                if len(ids) == 2 and (text := builder.clean_chinese(row[1])):
                    chinese[ids[1]] = text
    with zipfile.ZipFile(args.source_dir / "fra-eng.zip") as archive:
        with io.TextIOWrapper(archive.open("fra.txt"), encoding="utf-8") as stream:
            for row in csv.reader(stream, delimiter="\t"):
                ids = re.findall(r"#(\d+)", row[2])
                if len(ids) == 2 and builder.clean_french(row[1]):
                    french[ids[1]] = row[1]

    linked = set()
    with tarfile.open(args.source_dir / "links.tar.bz2", "r:bz2") as archive:
        for line in archive.extractfile("links.csv"):
            first, _, second = line.strip().partition(b"\t")
            first, second = first.decode(), second.decode()
            if first in french and second in chinese:
                linked.add((first, second))

    output = ROOT / "fr-zh-direct-pairs.tsv.gz"
    with output.open("wb") as raw:
        with gzip.GzipFile(filename="", mode="wb", fileobj=raw, mtime=0) as zipped:
            with io.TextIOWrapper(zipped, encoding="utf-8", newline="") as text:
                writer = csv.writer(text, delimiter="\t")
                writer.writerow(["french_id", "chinese_id", "french", "chinese"])
                for fr_id, zh_id in sorted(linked):
                    writer.writerow([fr_id, zh_id, french[fr_id], chinese[zh_id]])
    print(f"Wrote {len(linked)} direct pairs to {output.name}")


if __name__ == "__main__":
    main()
