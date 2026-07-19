export type StartupRoute = 'loading' | 'login' | 'onboarding' | 'tabs';

type StartupRouteState = {
  hydrated: boolean;
  isAuthenticated: boolean;
  isLoadingProfile: boolean;
  hasProfile: boolean;
  onboardingDone: boolean;
};

export function resolveStartupRoute(state: StartupRouteState): StartupRoute {
  if (!state.hydrated || state.isLoadingProfile) return 'loading';
  if (!state.isAuthenticated) return 'login';
  if (!state.hasProfile && !state.onboardingDone) return 'onboarding';
  if (!state.onboardingDone) return 'onboarding';
  return 'tabs';
}
