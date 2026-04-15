export type EngineSupportTier = 'core' | 'experimental';
export type PlatformSupportTier = 'tier1' | 'tier2';

export interface EngineOption {
  value: string;
  label: string;
  engine: string;
  tier: EngineSupportTier;
}

export interface PlatformSupportTarget {
  id: string;
  label: string;
  tier: PlatformSupportTier;
  notes: string;
}

export const ENGINE_OPTIONS: readonly EngineOption[] = [
  { value: 'qwen:1.7B', label: 'Qwen3-TTS 1.7B', engine: 'qwen', tier: 'core' },
  { value: 'qwen:0.6B', label: 'Qwen3-TTS 0.6B', engine: 'qwen', tier: 'core' },
  { value: 'luxtts', label: 'LuxTTS', engine: 'luxtts', tier: 'core' },
  {
    value: 'qwen_custom_voice:1.7B',
    label: 'Qwen CustomVoice 1.7B',
    engine: 'qwen_custom_voice',
    tier: 'experimental',
  },
  {
    value: 'qwen_custom_voice:0.6B',
    label: 'Qwen CustomVoice 0.6B',
    engine: 'qwen_custom_voice',
    tier: 'experimental',
  },
  { value: 'chatterbox', label: 'Chatterbox', engine: 'chatterbox', tier: 'experimental' },
  {
    value: 'chatterbox_turbo',
    label: 'Chatterbox Turbo',
    engine: 'chatterbox_turbo',
    tier: 'experimental',
  },
  { value: 'tada:1B', label: 'TADA 1B', engine: 'tada', tier: 'experimental' },
  { value: 'tada:3B', label: 'TADA 3B Multilingual', engine: 'tada', tier: 'experimental' },
  { value: 'kokoro', label: 'Kokoro 82M', engine: 'kokoro', tier: 'experimental' },
] as const;

export const ENGINE_SUPPORT_LABELS: Record<EngineSupportTier, string> = {
  core: 'Core',
  experimental: 'Experimental',
};

export const PLATFORM_SUPPORT_TARGETS: readonly PlatformSupportTarget[] = [
  {
    id: 'apple-silicon-desktop',
    label: 'Apple Silicon desktop',
    tier: 'tier1',
    notes: 'Best-supported local-first path with the least install chaos.',
  },
  {
    id: 'windows-nvidia',
    label: 'Windows + NVIDIA',
    tier: 'tier1',
    notes: 'Tier-1 GPU path for CUDA users.',
  },
  {
    id: 'intel-macos',
    label: 'Intel macOS',
    tier: 'tier2',
    notes: 'Supported, but not a first-class performance target.',
  },
  {
    id: 'linux-and-alt-accelerators',
    label: 'Linux, Docker, ROCm, Intel XPU, DirectML',
    tier: 'tier2',
    notes: 'Best-effort targets with higher maintenance and regression risk.',
  },
  {
    id: 'browser-web',
    label: 'Browser/web shell',
    tier: 'tier2',
    notes: 'Useful for demos, but the product is still fundamentally desktop-first.',
  },
] as const;

export const PLATFORM_TIER_LABELS: Record<PlatformSupportTier, string> = {
  tier1: 'Tier 1',
  tier2: 'Tier 2',
};

export function getEngineSupportTier(engine: string): EngineSupportTier {
  return ENGINE_OPTIONS.find((option) => option.engine === engine)?.tier ?? 'experimental';
}

export function getPresetProfileEngineOptions() {
  const seen = new Set<string>();
  return ENGINE_OPTIONS.filter((option) => {
    if (seen.has(option.engine)) return false;
    seen.add(option.engine);
    return true;
  }).map((option) => ({
    value: option.engine,
    label: option.label.replace(/\s(1\.7B|0\.6B|1B|3B Multilingual|82M)$/, ''),
    tier: option.tier,
  }));
}

export function detectCurrentPlatformTarget(isTauri: boolean): PlatformSupportTarget {
  if (typeof navigator === 'undefined') {
    return PLATFORM_SUPPORT_TARGETS[0];
  }

  const platform = navigator.platform.toLowerCase();
  const userAgent = navigator.userAgent.toLowerCase();

  if (platform.includes('mac')) {
    const isAppleSilicon =
      userAgent.includes('arm') || userAgent.includes('apple silicon') || userAgent.includes('aarch64');
    return isAppleSilicon ? PLATFORM_SUPPORT_TARGETS[0] : PLATFORM_SUPPORT_TARGETS[2];
  }

  if (platform.includes('win')) {
    return PLATFORM_SUPPORT_TARGETS[1];
  }

  if (platform.includes('linux')) {
    return isTauri ? PLATFORM_SUPPORT_TARGETS[3] : PLATFORM_SUPPORT_TARGETS[4];
  }

  return isTauri ? PLATFORM_SUPPORT_TARGETS[3] : PLATFORM_SUPPORT_TARGETS[4];
}
