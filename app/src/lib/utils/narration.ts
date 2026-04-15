import type { LanguageCode } from '@/lib/constants/languages';

export interface NarrationSegment {
  id: string;
  originalText: string;
  normalizedText: string;
}

const PTBR_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bRM\b/g, 'ressonância magnética'],
  [/\bTC\b/g, 'tomografia computadorizada'],
  [/\bpós-op\b/gi, 'pós-operatório'],
  [/\bpré-op\b/gi, 'pré-operatório'],
  [/\bEEA\b/g, 'abordagem endoscópica endonasal'],
  [/\bGTR\b/g, 'ressecção total'],
  [/\bSTR\b/g, 'ressecção subtotal'],
];

const EN_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bMRI\b/g, 'magnetic resonance imaging'],
  [/\bCT\b/g, 'computed tomography'],
  [/\bpost-op\b/gi, 'postoperative'],
  [/\bpre-op\b/gi, 'preoperative'],
  [/\bGTR\b/g, 'gross total resection'],
  [/\bSTR\b/g, 'subtotal resection'],
];

function cleanWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/\s([,.;:!?])/g, '$1').trim();
}

function normalizeParagraph(text: string, language: LanguageCode): string {
  const replacements = language === 'pt' ? PTBR_REPLACEMENTS : EN_REPLACEMENTS;
  let normalized = text.trim();

  for (const [pattern, value] of replacements) {
    normalized = normalized.replace(pattern, value);
  }

  normalized = normalized
    .replace(/\s*—\s*/g, ', ')
    .replace(/\s*–\s*/g, ', ')
    .replace(/\s*\((.*?)\)\s*/g, ', $1, ')
    .replace(/\s*\/\s*/g, ', ');

  return cleanWhitespace(normalized);
}

function splitLongSentence(sentence: string, maxChars = 240): string[] {
  const trimmed = sentence.trim();
  if (trimmed.length <= maxChars) return [trimmed];

  const clauses = trimmed.split(/,\s+/g);
  const parts: string[] = [];
  let buffer = '';

  for (const clause of clauses) {
    const candidate = buffer ? `${buffer}, ${clause}` : clause;
    if (candidate.length <= maxChars) {
      buffer = candidate;
    } else {
      if (buffer) parts.push(buffer.trim());
      buffer = clause;
    }
  }

  if (buffer) parts.push(buffer.trim());
  return parts.length ? parts : [trimmed];
}

export function segmentNarrationScript(text: string, language: LanguageCode): NarrationSegment[] {
  const paragraphs = text
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const segments: NarrationSegment[] = [];

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const normalizedParagraph = normalizeParagraph(paragraph, language);
    const sentences = normalizedParagraph
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean)
      .flatMap((sentence) => splitLongSentence(sentence));

    sentences.forEach((sentence, sentenceIndex) => {
      segments.push({
        id: `seg-${paragraphIndex + 1}-${sentenceIndex + 1}`,
        originalText: sentence,
        normalizedText: sentence,
      });
    });
  });

  return segments;
}

export function normalizeNarrationScript(text: string, language: LanguageCode): string {
  return segmentNarrationScript(text, language)
    .map((segment) => segment.normalizedText)
    .join('\n\n');
}
