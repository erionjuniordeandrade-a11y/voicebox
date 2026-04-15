#!/usr/bin/env python3
"""Normalize pt-BR medical narration scripts.

Current scope: starter scaffold only.
Future work:
- expand shorthand
- normalize numbers/dates
- apply lexicon-aware replacements
- split long narration lines into generation-friendly segments
"""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
LEXICON = ROOT / 'data' / 'lexicons' / 'pt-BR-medical.yaml'


def normalize(text: str) -> str:
    replacements = {
        'pós-op': 'pós-operatório',
        'RM': 'ressonância magnética',
        'TC': 'tomografia computadorizada',
    }
    result = text
    for source, target in replacements.items():
        result = result.replace(source, target)
    return result.strip()


def main() -> None:
    if len(sys.argv) > 1:
        raw_text = ' '.join(sys.argv[1:])
    else:
        raw_text = sys.stdin.read()

    if not raw_text.strip():
        raise SystemExit('Provide text via stdin or args.')

    print(normalize(raw_text))
    if not LEXICON.exists():
        print('\n[warn] lexicon file missing:', LEXICON.relative_to(ROOT), file=sys.stderr)


if __name__ == '__main__':
    main()
