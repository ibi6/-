import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { Colors } from '@/theme';
import { useAuthStore, useUserStore, useWorkoutStore, useNutritionStore, useHealthStore } from '@/stores';

export default function RootLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loadProfile = useUserStore((s) => s.loadProfile);
  const loadWeeklyPlan = useWorkoutStore((s) => s.loadWeeklyPlan);
  const loadSessions = useWorkoutStore((s) => s.loadSessions);
  const loadDay = useNutritionStore((s) => s.loadDay);
  const loadHealth = useHealthStore((s) => s.load);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadProfile();
    void loadWeeklyPlan();
    void loadSessions();
    void loadDay();
    void loadHealth();
  }, [isAuthenticated, loadProfile, loadWeeklyPlan, loadSessions, loadDay, loadHealth]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="workout/session" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="workout/summary" options={{ presentation: 'modal' }} />
        <Stack.Screen name="workout/exercise/[id]" />
        <Stack.Screen name="nutrition/add" options={{ presentation: 'modal' }} />
        <Stack.Screen name="nutrition/search" options={{ presentation: 'modal' }} />
        <Stack.Screen name="nutrition/food/[id]" />
        <Stack.Screen name="nutrition/recognition" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ presentation: 'card' }} />
        <Stack.Screen name="subscription" options={{ presentation: 'modal' }} />
        <Stack.Screen name="body" />
        <Stack.Screen name="analytics" />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
