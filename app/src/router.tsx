import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { lazy, Suspense, type ComponentType } from 'react';
import { AppFrame } from '@/components/AppFrame/AppFrame';
import { Sidebar } from '@/components/Sidebar';
import { Toaster } from '@/components/ui/toaster';
import { useGenerationProgress } from '@/lib/hooks/useGenerationProgress';
import { useModelDownloadToast } from '@/lib/hooks/useModelDownloadToast';
import { MODEL_DISPLAY_NAMES, useRestoreActiveTasks } from '@/lib/hooks/useRestoreActiveTasks';

// Simple platform check that works in both web and Tauri
const isMacOS = () => navigator.platform.toLowerCase().includes('mac');

function RouteFallback() {
  return (
    <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
      Loading module...
    </div>
  );
}

function wrapLazyRoute(LazyComponent: ComponentType<any>) {
  return function LazyRouteComponent() {
    return (
      <Suspense fallback={<RouteFallback />}>
        <LazyComponent />
      </Suspense>
    );
  };
}

const MainEditorLazy = lazy(() =>
  import('@/components/MainEditor/MainEditor').then((module) => ({
    default: module.MainEditor as ComponentType<any>,
  })),
);
const NarrationLazy = lazy(() =>
  import('@/components/NarrationTab/NarrationTab').then((module) => ({
    default: module.NarrationTab as ComponentType<any>,
  })),
);
const StoriesLazy = lazy(() =>
  import('@/components/StoriesTab/StoriesTab').then((module) => ({
    default: module.StoriesTab as ComponentType<any>,
  })),
);
const VoicesLazy = lazy(() =>
  import('@/components/VoicesTab/VoicesTab').then((module) => ({
    default: module.VoicesTab as ComponentType<any>,
  })),
);
const AudioLazy = lazy(() =>
  import('@/components/AudioTab/AudioTab').then((module) => ({
    default: module.AudioTab as ComponentType<any>,
  })),
);
const EffectsLazy = lazy(() =>
  import('@/components/EffectsTab/EffectsTab').then((module) => ({
    default: module.EffectsTab as ComponentType<any>,
  })),
);
const ModelsLazy = lazy(() =>
  import('@/components/ModelsTab/ModelsTab').then((module) => ({
    default: module.ModelsTab as ComponentType<any>,
  })),
);
const SettingsLayoutLazy = lazy(() =>
  import('@/components/ServerTab/ServerTab').then((module) => ({
    default: module.SettingsLayout as ComponentType<any>,
  })),
);
const SettingsGeneralLazy = lazy(() =>
  import('@/components/ServerTab/GeneralPage').then((module) => ({
    default: module.GeneralPage as ComponentType<any>,
  })),
);
const SettingsGenerationLazy = lazy(() =>
  import('@/components/ServerTab/GenerationPage').then((module) => ({
    default: module.GenerationPage as ComponentType<any>,
  })),
);
const SettingsGpuLazy = lazy(() =>
  import('@/components/ServerTab/GpuPage').then((module) => ({
    default: module.GpuPage as ComponentType<any>,
  })),
);
const SettingsLogsLazy = lazy(() =>
  import('@/components/ServerTab/LogsPage').then((module) => ({
    default: module.LogsPage as ComponentType<any>,
  })),
);
const SettingsChangelogLazy = lazy(() =>
  import('@/components/ServerTab/ChangelogPage').then((module) => ({
    default: module.ChangelogPage as ComponentType<any>,
  })),
);
const SettingsAboutLazy = lazy(() =>
  import('@/components/ServerTab/AboutPage').then((module) => ({
    default: module.AboutPage as ComponentType<any>,
  })),
);

const MainEditorRoute = wrapLazyRoute(MainEditorLazy);
const NarrationRoute = wrapLazyRoute(NarrationLazy);
const StoriesRoute = wrapLazyRoute(StoriesLazy);
const VoicesRoute = wrapLazyRoute(VoicesLazy);
const AudioRoute = wrapLazyRoute(AudioLazy);
const EffectsRoute = wrapLazyRoute(EffectsLazy);
const ModelsRoute = wrapLazyRoute(ModelsLazy);
const SettingsLayoutRoute = wrapLazyRoute(SettingsLayoutLazy);
const SettingsGeneralRoute = wrapLazyRoute(SettingsGeneralLazy);
const SettingsGenerationRoute = wrapLazyRoute(SettingsGenerationLazy);
const SettingsGpuRoute = wrapLazyRoute(SettingsGpuLazy);
const SettingsLogsRoute = wrapLazyRoute(SettingsLogsLazy);
const SettingsChangelogRoute = wrapLazyRoute(SettingsChangelogLazy);
const SettingsAboutRoute = wrapLazyRoute(SettingsAboutLazy);

// Root layout component
function RootLayout() {
  // Monitor active downloads/generations and show toasts for them
  const activeDownloads = useRestoreActiveTasks();

  // Subscribe to SSE for pending generations — handles completion, auto-play, and history refresh
  useGenerationProgress();

  return (
    <AppFrame>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar isMacOS={isMacOS()} />

        <main className="flex-1 ml-20 overflow-hidden flex flex-col">
          <div className="container mx-auto px-8 max-w-[1800px] h-full overflow-hidden flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Show download toasts for any active downloads (from anywhere) */}
      {activeDownloads.map((download) => {
        const displayName = MODEL_DISPLAY_NAMES[download.model_name] || download.model_name;
        return (
          <DownloadToastRestorer
            key={download.model_name}
            modelName={download.model_name}
            displayName={displayName}
          />
        );
      })}

      <Toaster />
    </AppFrame>
  );
}

/**
 * Component that restores a download toast for a specific model.
 */
function DownloadToastRestorer({
  modelName,
  displayName,
}: {
  modelName: string;
  displayName: string;
}) {
  // Use the download toast hook to restore the toast
  useModelDownloadToast({
    modelName,
    displayName,
    enabled: true,
  });

  return null;
}

// Root route with layout
const rootRoute = createRootRoute({
  component: RootLayout,
});

// Index route (main/generate)
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: MainEditorRoute,
});

// Narration route
const narrationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/narration',
  component: NarrationRoute,
});

// Stories route
const storiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stories',
  component: StoriesRoute,
});

// Voices route
const voicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/voices',
  component: VoicesRoute,
});

// Audio route
const audioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/audio',
  component: AudioRoute,
});

// Effects route
const effectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/effects',
  component: EffectsRoute,
});

// Models route
const modelsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/models',
  component: ModelsRoute,
});

// Settings layout route (parent for sub-tabs)
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsLayoutRoute,
});

// Settings sub-routes
const settingsGeneralRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/',
  component: SettingsGeneralRoute,
});

const settingsGenerationRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/generation',
  component: SettingsGenerationRoute,
});

const settingsGpuRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/gpu',
  component: SettingsGpuRoute,
});

const settingsChangelogRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/changelog',
  component: SettingsChangelogRoute,
});

const settingsLogsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/logs',
  component: SettingsLogsRoute,
});

const settingsAboutRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/about',
  component: SettingsAboutRoute,
});

// Redirect old /server path to /settings
const serverRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/server',
  beforeLoad: () => {
    throw redirect({ to: '/settings' });
  },
});

// Route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  narrationRoute,
  storiesRoute,
  voicesRoute,
  audioRoute,
  effectsRoute,
  modelsRoute,
  settingsRoute.addChildren([
    settingsGeneralRoute,
    settingsGenerationRoute,
    settingsGpuRoute,
    settingsLogsRoute,
    settingsChangelogRoute,
    settingsAboutRoute,
  ]),
  serverRedirectRoute,
]);

// Create router
export const router = createRouter({ routeTree });

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
