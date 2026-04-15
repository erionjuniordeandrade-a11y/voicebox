import type { LanguageCode } from '@/lib/constants/languages';
import type { GenerationRequest } from '@/lib/api/types';

export interface NarrationPreset {
  id: string;
  name: string;
  language: LanguageCode;
  category: 'surgical' | 'education' | 'patient-ed' | 'conference';
  description: string;
  engine: GenerationRequest['engine'];
  modelSize?: GenerationRequest['model_size'];
  instruct?: string;
}

export const NARRATION_PRESETS: readonly NarrationPreset[] = [
  {
    id: 'ptbr-surgical-neutral',
    name: 'pt-BR Surgical Neutral',
    language: 'pt',
    category: 'surgical',
    description: 'Calm, precise, authoritative narration for surgical walkthroughs.',
    engine: 'qwen',
    modelSize: '1.7B',
    instruct: 'Fale em português do Brasil, ritmo calmo, didático e preciso, como um neurocirurgião explicando um caso com clareza.',
  },
  {
    id: 'ptbr-didactic-explainer',
    name: 'pt-BR Didactic Explainer',
    language: 'pt',
    category: 'education',
    description: 'More segmented and explanatory for teaching concepts and anatomy.',
    engine: 'qwen',
    modelSize: '1.7B',
    instruct: 'Fale em português do Brasil de forma didática, clara e natural, com pausas leves entre conceitos importantes.',
  },
  {
    id: 'ptbr-patient-education',
    name: 'pt-BR Patient Education',
    language: 'pt',
    category: 'patient-ed',
    description: 'Warm but still professional patient-facing educational tone.',
    engine: 'qwen',
    modelSize: '1.7B',
    instruct: 'Fale em português do Brasil de forma acolhedora, clara e tranquila, sem soar publicitário.',
  },
  {
    id: 'en-surgical-neutral',
    name: 'English Surgical Neutral',
    language: 'en',
    category: 'surgical',
    description: 'Precise, restrained, expert English narration for medical content.',
    engine: 'qwen',
    modelSize: '1.7B',
    instruct: 'Speak in clear professional English with a calm, precise, expert surgical narration style.',
  },
  {
    id: 'en-conference-explainer',
    name: 'English Conference Explainer',
    language: 'en',
    category: 'conference',
    description: 'Conference and lecture style expert explanation.',
    engine: 'qwen',
    modelSize: '1.7B',
    instruct: 'Speak in polished English like an expert conference presenter: clear, confident, measured, and educational.',
  },
  {
    id: 'en-patient-education',
    name: 'English Patient Education',
    language: 'en',
    category: 'patient-ed',
    description: 'Gentle public-facing educational tone without sounding promotional.',
    engine: 'qwen',
    modelSize: '1.7B',
    instruct: 'Speak in clear, warm, reassuring English for patient education, staying professional and calm.',
  },
] as const;

export function getNarrationPresetsForLanguage(language: LanguageCode): NarrationPreset[] {
  return NARRATION_PRESETS.filter((preset) => preset.language === language);
}

export function getNarrationPresetById(id: string): NarrationPreset | undefined {
  return NARRATION_PRESETS.find((preset) => preset.id === id);
}
