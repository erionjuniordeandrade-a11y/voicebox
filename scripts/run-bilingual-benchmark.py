#!/usr/bin/env python3
"""Starter benchmark runner for bilingual narration evaluation.

Current scope:
- load rubric config path
- confirm expected benchmark directories exist
- placeholder for future engine comparison execution
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUBRIC = ROOT / 'config' / 'evaluation-rubric.yaml'
BENCHMARK_DIR = ROOT / 'data' / 'voice-datasets' / 'erion' / 'benchmark'


def main() -> None:
    print('Benchmark scaffold')
    print('Rubric:', RUBRIC.relative_to(ROOT))
    print('Benchmark root:', BENCHMARK_DIR.relative_to(ROOT))
    for language in ('pt-BR', 'en'):
        path = BENCHMARK_DIR / language
        print(f'- {language}:', 'ok' if path.exists() else 'missing')


if __name__ == '__main__':
    main()
