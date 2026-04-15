import { useEffect, useMemo, useState } from 'react';
import { FileText, Loader2, Play, RefreshCw, Wand2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api/client';
import type { GenerationRequest, VoiceProfileResponse } from '@/lib/api/types';
import {
  getNarrationPresetById,
  getNarrationPresetsForLanguage,
  NARRATION_PRESETS,
} from '@/lib/constants/narration';
import { useProfiles } from '@/lib/hooks/useProfiles';
import { segmentNarrationScript } from '@/lib/utils/narration';
import { useGenerationStore } from '@/stores/generationStore';
import { useUIStore } from '@/stores/uiStore';

interface NarrationSegmentState {
  id: string;
  originalText: string;
  normalizedText: string;
  status: 'draft' | 'queued' | 'generating' | 'completed' | 'failed';
  generationId?: string;
  audioUrl?: string;
  error?: string;
}

const LANGUAGE_OPTIONS = [
  { value: 'pt', label: 'Português (Brasil)' },
  { value: 'en', label: 'English' },
] as const;

export function NarrationTab() {
  const { toast } = useToast();
  const { data: profiles, isLoading } = useProfiles();
  const selectedVoiceId = useUIStore((state) => state.selectedVoiceId);
  const setSelectedVoiceId = useUIStore((state) => state.setSelectedVoiceId);
  const addPendingGeneration = useGenerationStore((state) => state.addPendingGeneration);

  const [profileId, setProfileId] = useState<string | null>(selectedVoiceId);
  const [language, setLanguage] = useState<'pt' | 'en'>('pt');
  const [presetId, setPresetId] = useState<string>('ptbr-surgical-neutral');
  const [rawScript, setRawScript] = useState('');
  const [segments, setSegments] = useState<NarrationSegmentState[]>([]);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  const presetOptions = useMemo(() => getNarrationPresetsForLanguage(language), [language]);
  const activePreset = getNarrationPresetById(presetId) ?? presetOptions[0] ?? NARRATION_PRESETS[0];
  const activeProfile = profiles?.find((profile) => profile.id === profileId) ?? null;

  useEffect(() => {
    if (selectedVoiceId && !profileId) {
      setProfileId(selectedVoiceId);
    }
  }, [selectedVoiceId, profileId]);

  useEffect(() => {
    if (!profileId && profiles && profiles.length > 0) {
      const fallbackId = selectedVoiceId && profiles.some((profile) => profile.id === selectedVoiceId)
        ? selectedVoiceId
        : profiles[0].id;
      setProfileId(fallbackId);
      setSelectedVoiceId(fallbackId);
    }
  }, [profileId, profiles, selectedVoiceId, setSelectedVoiceId]);

  useEffect(() => {
    if (!presetOptions.some((preset) => preset.id === presetId)) {
      setPresetId(presetOptions[0]?.id ?? '');
    }
  }, [presetId, presetOptions]);

  useEffect(() => {
    const activeSegments = segments.filter(
      (segment) =>
        !!segment.generationId && (segment.status === 'queued' || segment.status === 'generating'),
    );

    if (activeSegments.length === 0) return;

    const interval = setInterval(async () => {
      const updates = await Promise.all(
        activeSegments.map(async (segment) => {
          try {
            const generation = await apiClient.getGeneration(segment.generationId!);
            if (generation.status === 'completed') {
              return {
                id: segment.id,
                status: 'completed' as const,
                audioUrl: apiClient.getAudioUrl(segment.generationId!),
                error: undefined,
              };
            }
            if (generation.status === 'failed') {
              return {
                id: segment.id,
                status: 'failed' as const,
                error: generation.error || 'Generation failed',
              };
            }
            return {
              id: segment.id,
              status: generation.status === 'loading_model' ? ('queued' as const) : ('generating' as const),
            };
          } catch (error) {
            return {
              id: segment.id,
              status: 'failed' as const,
              error: error instanceof Error ? error.message : 'Failed to fetch generation status',
            };
          }
        }),
      );

      setSegments((current) =>
        current.map((segment) => {
          const next = updates.find((update) => update.id === segment.id);
          return next ? { ...segment, ...next } : segment;
        }),
      );
    }, 2500);

    return () => clearInterval(interval);
  }, [segments]);

  function handlePrepareScript() {
    if (!rawScript.trim()) {
      toast({
        title: 'No script yet',
        description: 'Paste a Portuguese or English narration script first.',
        variant: 'destructive',
      });
      return;
    }

    setIsPreparing(true);
    try {
      const nextSegments = segmentNarrationScript(rawScript, language).map((segment) => ({
        ...segment,
        status: 'draft' as const,
      }));
      setSegments(nextSegments);
      toast({
        title: 'Narration prepared',
        description: `${nextSegments.length} segment${nextSegments.length === 1 ? '' : 's'} ready for review.`,
      });
    } finally {
      setIsPreparing(false);
    }
  }

  function updateSegmentText(segmentId: string, value: string) {
    setSegments((current) =>
      current.map((segment) =>
        segment.id === segmentId
          ? {
              ...segment,
              normalizedText: value,
              status: segment.status === 'completed' ? 'draft' : segment.status,
              generationId: segment.status === 'completed' ? undefined : segment.generationId,
              audioUrl: segment.status === 'completed' ? undefined : segment.audioUrl,
            }
          : segment,
      ),
    );
  }

  async function generateSegment(segment: NarrationSegmentState) {
    if (!profileId) {
      toast({
        title: 'No voice selected',
        description: 'Choose a voice profile before generating narration.',
        variant: 'destructive',
      });
      return;
    }

    if (!activePreset) {
      toast({
        title: 'No preset selected',
        description: 'Choose a narration preset first.',
        variant: 'destructive',
      });
      return;
    }

    const request: GenerationRequest = {
      profile_id: profileId,
      text: segment.normalizedText,
      language,
      engine: activePreset.engine,
      model_size: activePreset.modelSize,
      instruct: activePreset.instruct,
      normalize: true,
    };

    setSegments((current) =>
      current.map((item) =>
        item.id === segment.id ? { ...item, status: 'queued', error: undefined, audioUrl: undefined } : item,
      ),
    );

    try {
      const result = await apiClient.generateSpeech(request);
      addPendingGeneration(result.id);
      setSegments((current) =>
        current.map((item) =>
          item.id === segment.id
            ? {
                ...item,
                generationId: result.id,
                status: result.status === 'loading_model' ? 'queued' : 'generating',
                error: undefined,
              }
            : item,
        ),
      );
    } catch (error) {
      setSegments((current) =>
        current.map((item) =>
          item.id === segment.id
            ? {
                ...item,
                status: 'failed',
                error: error instanceof Error ? error.message : 'Generation failed',
              }
            : item,
        ),
      );
    }
  }

  async function generateAllSegments() {
    const pending = segments.filter((segment) => segment.normalizedText.trim().length > 0);
    if (pending.length === 0) {
      toast({
        title: 'Nothing to generate',
        description: 'Prepare a script first so there are segments to narrate.',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingAll(true);
    try {
      for (const segment of pending) {
        await generateSegment(segment);
      }
      toast({
        title: 'Batch submitted',
        description: `${pending.length} segments queued for narration.`,
      });
    } finally {
      setIsGeneratingAll(false);
    }
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">Loading voices…</div>;
  }

  return (
    <div className="flex h-full flex-col gap-6 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Narration Studio</h1>
          <p className="text-sm text-muted-foreground">
            Bilingual medical narration MVP: choose a voice, normalize the script, review segments,
            and generate narration one segment at a time or in batch.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <FileText className="h-3.5 w-3.5" />
          MVP
        </Badge>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(320px,420px)_1fr] gap-6 overflow-hidden">
        <Card className="flex min-h-0 flex-col">
          <CardHeader>
            <CardTitle>Setup</CardTitle>
            <CardDescription>
              Pick the bilingual narration preset and the voice profile that should narrate the video.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4 overflow-auto">
            <div className="space-y-2">
              <Label>Voice profile</Label>
              <Select
                value={profileId ?? undefined}
                onValueChange={(value) => {
                  setProfileId(value);
                  setSelectedVoiceId(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a voice" />
                </SelectTrigger>
                <SelectContent>
                  {profiles?.map((profile: VoiceProfileResponse) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeProfile && (
                <p className="text-xs text-muted-foreground">
                  Using {activeProfile.name} • {activeProfile.language} • {activeProfile.voice_type}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={language} onValueChange={(value: 'pt' | 'en') => setLanguage(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Preset</Label>
              <Select value={presetId} onValueChange={setPresetId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {presetOptions.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activePreset && <p className="text-xs text-muted-foreground">{activePreset.description}</p>}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Raw narration script</Label>
              <Textarea
                value={rawScript}
                onChange={(event) => setRawScript(event.target.value)}
                placeholder="Paste the surgical or educational narration script here..."
                className="min-h-[240px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Card>
                <CardContent className="p-4">
                  <div className="text-muted-foreground">Prepared segments</div>
                  <div className="mt-1 text-2xl font-semibold">{segments.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-muted-foreground">Completed</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {segments.filter((segment) => segment.status === 'completed').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={handlePrepareScript} disabled={isPreparing || !rawScript.trim()}>
                {isPreparing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Prepare script
              </Button>
              <Button
                variant="secondary"
                onClick={generateAllSegments}
                disabled={isGeneratingAll || segments.length === 0 || !profileId}
              >
                {isGeneratingAll ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Generate all
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="flex min-h-0 flex-col">
          <CardHeader>
            <CardTitle>Segments</CardTitle>
            <CardDescription>
              Review and tweak normalized segments before generating. Bad segment? Regenerate only that one.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-auto">
            {segments.length === 0 ? (
              <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-muted-foreground">
                Prepare a script to create narration-ready segments.
              </div>
            ) : (
              <div className="space-y-4">
                {segments.map((segment, index) => (
                  <Card key={segment.id}>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">Segment {index + 1}</div>
                          <div className="text-xs text-muted-foreground">
                            {segment.generationId ? `Generation ${segment.generationId}` : 'Not generated yet'}
                          </div>
                        </div>
                        <Badge
                          variant={
                            segment.status === 'completed'
                              ? 'default'
                              : segment.status === 'failed'
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {segment.status}
                        </Badge>
                      </div>

                      <Textarea
                        value={segment.normalizedText}
                        onChange={(event) => updateSegmentText(segment.id, event.target.value)}
                        className="min-h-[110px]"
                      />

                      {segment.error && <div className="text-sm text-destructive">{segment.error}</div>}

                      <div className="flex flex-wrap items-center gap-3">
                        <Button onClick={() => void generateSegment(segment)} disabled={!segment.normalizedText.trim()}>
                          {segment.status === 'queued' || segment.status === 'generating' ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : segment.status === 'completed' ? (
                            <RefreshCw className="mr-2 h-4 w-4" />
                          ) : (
                            <Play className="mr-2 h-4 w-4" />
                          )}
                          {segment.status === 'completed' ? 'Regenerate' : 'Generate'}
                        </Button>

                        {segment.audioUrl && (
                          <audio controls preload="none" src={segment.audioUrl} className="max-w-full" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
