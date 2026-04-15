#!/usr/bin/env python3
"""Prepare and validate the canonical Erion dataset manifest.

Current scope:
- verify expected folders exist
- print missing folders/files
- intended future work: audio metadata extraction, transcript checks, manifest generation
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATASET_ROOT = ROOT / 'data' / 'voice-datasets' / 'erion'
REQUIRED_DIRS = [
    DATASET_ROOT / 'raw' / 'pt-BR',
    DATASET_ROOT / 'raw' / 'en',
    DATASET_ROOT / 'cleaned' / 'pt-BR',
    DATASET_ROOT / 'cleaned' / 'en',
    DATASET_ROOT / 'benchmark' / 'pt-BR',
    DATASET_ROOT / 'benchmark' / 'en',
    DATASET_ROOT / 'manifests',
]


def main() -> None:
    missing = [str(path.relative_to(ROOT)) for path in REQUIRED_DIRS if not path.exists()]
    if missing:
        print('Missing dataset directories:')
        for item in missing:
            print(f'- {item}')
        raise SystemExit(1)

    print('Dataset scaffold looks sane.')
    print(f'Root: {DATASET_ROOT.relative_to(ROOT)}')
    print('Next step: add real recordings and populate manifests.')


if __name__ == '__main__':
    main()
