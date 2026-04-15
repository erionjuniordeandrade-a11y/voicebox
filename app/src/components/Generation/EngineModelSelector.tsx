import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { FormControl } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { VoiceProfileResponse } from '@/lib/api/types';
import { getLanguageOptionsForEngine } from '@/lib/constants/languages';
import {
  ENGINE_OPTIONS,
  ENGINE_SUPPORT_LABELS,
  getEngineSupportTier,
} from '@/lib/constants/supportPolicy';
import type { GenerationFormValues } from '@/lib/hooks/useGenerationForm';

const ENGINE_DESCRIPTIONS: Record<string, string> = {
  qwen: 'Multi-language, two sizes',
  qwen_custom_voice: '9 preset voices, instruct control',
  luxtts: 'Fast, English-focused',
  chatterbox: '23 languages, incl. Hebrew',
  chatterbox_turbo: 'English, [laugh] [cough] tags',
  tada: 'HumeAI, 700s+ coherent audio',
  kokoro: '82M params, CPU realtime, 8 langs',
};

/** Engines that only support English and should force language to 'en' on select. */
const ENGLISH_ONLY_ENGINES = new Set(['luxtts', 'chatterbox_turbo']);

/** Engines that support cloned (reference audio) profiles. */
const CLONING_ENGINES = new Set(['qwen', 'luxtts', 'chatterbox', 'chatterbox_turbo', 'tada']);

function getAvailableOptions(selectedProfile?: VoiceProfileResponse | null) {
  if (!selectedProfile) return ENGINE_OPTIONS;
  return ENGINE_OPTIONS.filter((opt) => isProfileCompatibleWithEngine(selectedProfile, opt.engine));
}

function getGroupedOptions(options: ReturnType<typeof getAvailableOptions>) {
  return {
    core: options.filter((option) => option.tier === 'core'),
    experimental: options.filter((option) => option.tier === 'experimental'),
  };
}

function getSelectValue(engine: string, modelSize?: string): string {
  if (engine === 'qwen') return `qwen:${modelSize || '1.7B'}`;
  if (engine === 'qwen_custom_voice') return `qwen_custom_voice:${modelSize || '1.7B'}`;
  if (engine === 'tada') return `tada:${modelSize || '1B'}`;
  return engine;
}

export function applyEngineSelection(form: UseFormReturn<GenerationFormValues>, value: string) {
  if (value.startsWith('qwen_custom_voice:')) {
    const [, modelSize] = value.split(':');
    form.setValue('engine', 'qwen_custom_voice');
    form.setValue('modelSize', modelSize as '1.7B' | '0.6B');
    const currentLang = form.getValues('language');
    const available = getLanguageOptionsForEngine('qwen_custom_voice');
    if (!available.some((l) => l.value === currentLang)) {
      form.setValue('language', available[0]?.value ?? 'en');
    }
  } else if (value.startsWith('qwen:')) {
    const [, modelSize] = value.split(':');
    form.setValue('engine', 'qwen');
    form.setValue('modelSize', modelSize as '1.7B' | '0.6B');
    // Validate language is supported by Qwen
    const currentLang = form.getValues('language');
    const available = getLanguageOptionsForEngine('qwen');
    if (!available.some((l) => l.value === currentLang)) {
      form.setValue('language', available[0]?.value ?? 'en');
    }
  } else if (value.startsWith('tada:')) {
    const [, modelSize] = value.split(':');
    form.setValue('engine', 'tada');
    form.setValue('modelSize', modelSize as '1B' | '3B');
    // TADA 1B is English-only; 3B is multilingual
    if (modelSize === '1B') {
      form.setValue('language', 'en');
    } else {
      const currentLang = form.getValues('language');
      const available = getLanguageOptionsForEngine('tada');
      if (!available.some((l) => l.value === currentLang)) {
        form.setValue('language', available[0]?.value ?? 'en');
      }
    }
  } else {
    form.setValue('engine', value as GenerationFormValues['engine']);
    form.setValue('modelSize', undefined as unknown as '1.7B' | '0.6B');
    if (ENGLISH_ONLY_ENGINES.has(value)) {
      form.setValue('language', 'en');
    } else {
      // If current language isn't supported by the new engine, reset to first available
      const currentLang = form.getValues('language');
      const available = getLanguageOptionsForEngine(value);
      if (!available.some((l) => l.value === currentLang)) {
        form.setValue('language', available[0]?.value ?? 'en');
      }
    }
  }
}

interface EngineModelSelectorProps {
  form: UseFormReturn<GenerationFormValues>;
  compact?: boolean;
  selectedProfile?: VoiceProfileResponse | null;
}

export function EngineModelSelector({ form, compact, selectedProfile }: EngineModelSelectorProps) {
  const engine = form.watch('engine') || 'qwen';
  const modelSize = form.watch('modelSize');
  const selectValue = getSelectValue(engine, modelSize);
  const availableOptions = getAvailableOptions(selectedProfile);
  const groupedOptions = getGroupedOptions(availableOptions);

  const currentEngineAvailable = availableOptions.some((opt) => opt.value === selectValue);

  useEffect(() => {
    if (!currentEngineAvailable && availableOptions.length > 0) {
      applyEngineSelection(form, availableOptions[0].value);
    }
  }, [availableOptions, currentEngineAvailable, form]);

  const itemClass = compact ? 'text-xs text-muted-foreground' : undefined;
  const triggerClass = compact
    ? 'h-8 text-xs bg-card border-border rounded-full hover:bg-background/50 transition-all'
    : undefined;

  return (
    <Select value={selectValue} onValueChange={(v) => applyEngineSelection(form, v)}>
      <FormControl>
        <SelectTrigger className={triggerClass}>
          <SelectValue />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {groupedOptions.core.length > 0 && (
          <SelectGroup>
            <SelectLabel>Core engines</SelectLabel>
            {groupedOptions.core.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className={itemClass}>
                <div className="flex w-full items-center justify-between gap-3">
                  <span>{opt.label}</span>
                  <span className="text-[10px] uppercase tracking-wide text-emerald-500">
                    {ENGINE_SUPPORT_LABELS[opt.tier]}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        )}

        {groupedOptions.core.length > 0 && groupedOptions.experimental.length > 0 && <SelectSeparator />}

        {groupedOptions.experimental.length > 0 && (
          <SelectGroup>
            <SelectLabel>Experimental engines</SelectLabel>
            {groupedOptions.experimental.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className={itemClass}>
                <div className="flex w-full items-center justify-between gap-3">
                  <span>{opt.label}</span>
                  <span className="text-[10px] uppercase tracking-wide text-amber-500">
                    {ENGINE_SUPPORT_LABELS[opt.tier]}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}

/** Returns a human-readable description for the currently selected engine. */
export function getEngineDescription(engine: string): string {
  const tier = getEngineSupportTier(engine);
  const prefix = tier === 'core' ? 'Core engine' : 'Experimental engine';
  return `${prefix} — ${ENGINE_DESCRIPTIONS[engine] ?? ''}`.trim();
}

/**
 * Check if a profile is compatible with the currently selected engine.
 * Useful for UI hints.
 */
export function isProfileCompatibleWithEngine(
  profile: VoiceProfileResponse,
  engine: string,
): boolean {
  const voiceType = profile.voice_type || 'cloned';
  if (voiceType === 'preset') return profile.preset_engine === engine;
  if (voiceType === 'cloned') return CLONING_ENGINES.has(engine);
  return true; // designed — future
}
