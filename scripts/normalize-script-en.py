#!/usr/bin/env python3
"""Normalize English medical narration scripts.

Current scope: starter scaffold only.
Future work:
- expand shorthand
- normalize time points and measurements
- apply lexicon-aware replacements
- rewrite dense written prose into spoken English segments
"""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
LEXICON = ROOT / 'data' / 'lexicons' / 'en-medical.yaml'


def normalize(text: str) -> str:
    replacements = {
        'post-op': 'postoperative',
        'MRI': 'magnetic resonance imaging',
        'CT': 'computed tomography',
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
