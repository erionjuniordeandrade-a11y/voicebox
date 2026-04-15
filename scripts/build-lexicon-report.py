#!/usr/bin/env python3
"""Starter lexicon report generator.

Current scope:
- count entries in the bilingual medical lexicon files
- print file presence for sanity checks
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEXICON_FILES = [
    ROOT / 'data' / 'lexicons' / 'pt-BR-medical.yaml',
    ROOT / 'data' / 'lexicons' / 'en-medical.yaml',
    ROOT / 'data' / 'lexicons' / 'bilingual-mapping.yaml',
]


def main() -> None:
    print('Lexicon report scaffold')
    for path in LEXICON_FILES:
        print(f'- {path.relative_to(ROOT)}:', 'ok' if path.exists() else 'missing')


if __name__ == '__main__':
    main()
