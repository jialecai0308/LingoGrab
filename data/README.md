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
core-frequency index. Frequency rank is not presented as a CEFR level, meaning,
or proof that a learning card has already been editorially reviewed.

Source: https://github.com/hermitdave/FrequencyWords

Content license: https://creativecommons.org/licenses/by-sa/4.0/
