import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { Colors } from '@/theme';
import { useAuthStore, useUserStore } from '@/stores';
import { resolveStartupRoute } from '@/utils/startupRoute';

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const onboardingDone = useUserStore((s) => s.onboardingDone);
  const profile = useUserStore((s) => s.profile);
  const isLoadingProfile = useUserStore((s) => s.isLoading);
  const loadProfile = useUserStore((s) => s.loadProfile);
  const [hydrated, setHydrated] = useState(
    () => useAuthStore.persist.hasHydrated() && useUserStore.persist.hasHydrated(),
  );
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    const updateHydration = () => {
      setHydrated(useAuthStore.persist.hasHydrated() && useUserStore.persist.hasHydrated());
    };
    const unsubscribeAuth = useAuthStore.persist.onFinishHydration(updateHydration);
    const unsubscribeUser = useUserStore.persist.onFinishHydration(updateHydration);
    updateHydration();
    return () => {
      unsubscribeAuth();
      unsubscribeUser();
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated || profile) {
      setProfileChecked(true);
      return;
    }
    let active = true;
    setProfileChecked(false);
    void loadProfile().finally(() => {
      if (active) setProfileChecked(true);
    });
    return () => {
      active = false;
    };
  }, [hydrated, isAuthenticated, profile, loadProfile]);

  const route = resolveStartupRoute({
    hydrated,
    isAuthenticated,
    isLoadingProfile: isLoadingProfile || (isAuthenticated && !profile && !profileChecked),
    hasProfile: Boolean(profile),
    onboardingDone: onboardingDone || Boolean(profile?.onboardingCompleted),
  });

  if (route === 'login') {
    return <Redirect href="/(auth)/login" />;
  }

  if (route === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (route === 'onboarding') {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
});
