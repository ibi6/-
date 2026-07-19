import { resolveStartupRoute } from '@/utils/startupRoute';

describe('resolveStartupRoute', () => {
  it('waits for both persisted stores before redirecting', () => {
    expect(
      resolveStartupRoute({
        hydrated: false,
        isAuthenticated: false,
        isLoadingProfile: false,
        hasProfile: false,
        onboardingDone: false,
      }),
    ).toBe('loading');
  });

  it('sends a hydrated signed-out user to login', () => {
    expect(
      resolveStartupRoute({
        hydrated: true,
        isAuthenticated: false,
        isLoadingProfile: false,
        hasProfile: false,
        onboardingDone: false,
      }),
    ).toBe('login');
  });

  it('sends an authenticated user with missing profile to onboarding after loading', () => {
    expect(
      resolveStartupRoute({
        hydrated: true,
        isAuthenticated: true,
        isLoadingProfile: false,
        hasProfile: false,
        onboardingDone: false,
      }),
    ).toBe('onboarding');
  });

  it('opens tabs only after onboarding is complete', () => {
    expect(
      resolveStartupRoute({
        hydrated: true,
        isAuthenticated: true,
        isLoadingProfile: false,
        hasProfile: true,
        onboardingDone: true,
      }),
    ).toBe('tabs');
  });
});
