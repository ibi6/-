import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { Colors } from '@/theme';
import { useAuthStore, useUserStore } from '@/stores';

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const onboardingDone = useUserStore((s) => s.onboardingDone);
  const profile = useUserStore((s) => s.profile);
  const loadProfile = useUserStore((s) => s.loadProfile);

  useEffect(() => {
    if (isAuthenticated && !profile) {
      void loadProfile();
    }
  }, [isAuthenticated, profile, loadProfile]);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!onboardingDone && !(profile?.onboardingCompleted)) {
    return <Redirect href="/onboarding" />;
  }

  if (isAuthenticated && !profile && !onboardingDone) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
});
