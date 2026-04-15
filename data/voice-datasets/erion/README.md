# voice-data layout

This directory stores the canonical bilingual dataset for Erion.

Structure:
- raw/pt-BR and raw/en: untouched source recordings
- cleaned/pt-BR and cleaned/en: curated clips ready for benchmark/training/adaptation
- manifests/: metadata and vocabulary tables
- benchmark/: held-out clips never used for adaptation
- lexicon/: bilingual medical pronunciation files

Rules:
- never overwrite raw recordings
- tag every clip by language, style, and session
- keep benchmark clips separated from any adaptation/training pool
