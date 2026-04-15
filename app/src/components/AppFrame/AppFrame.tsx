import { useRouterState } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { TitleBarDragRegion } from '@/components/TitleBarDragRegion';
import { useStory } from '@/lib/hooks/useStories';
import { TOP_SAFE_AREA_PADDING } from '@/lib/constants/ui';
import { cn } from '@/lib/utils/cn';
import { useStoryStore } from '@/stores/storyStore';

const AudioPlayer = lazy(() =>
  import('@/components/AudioPlayer/AudioPlayer').then((module) => ({ default: module.AudioPlayer })),
);

const StoryTrackEditor = lazy(() =>
  import('@/components/StoriesTab/StoryTrackEditor').then((module) => ({
    default: module.StoryTrackEditor,
  })),
);

interface AppFrameProps {
  children: React.ReactNode;
}

export function AppFrame({ children }: AppFrameProps) {
  const routerState = useRouterState();
  const isStoriesRoute = routerState.location.pathname === '/stories';

  const selectedStoryId = useStoryStore((state) => state.selectedStoryId);
  const { data: story } = useStory(selectedStoryId);

  // Show track editor when on stories route with a selected story that has items
  const showTrackEditor = isStoriesRoute && selectedStoryId && story && story.items.length > 0;

  const chromeFallback = (
    <div className="border-t border-border/60 bg-background px-4 py-3 text-xs text-muted-foreground">
      Loading player...
    </div>
  );

  return (
    <div className={cn('h-screen bg-background flex flex-col overflow-hidden', TOP_SAFE_AREA_PADDING)}>
      <TitleBarDragRegion />
      {children}
      <Suspense fallback={chromeFallback}>
        {showTrackEditor ? <StoryTrackEditor storyId={story.id} items={story.items} /> : <AudioPlayer />}
      </Suspense>
    </div>
  );
}
