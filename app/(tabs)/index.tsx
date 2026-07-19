import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Dumbbell, Utensils, Sparkles, Activity } from 'lucide-react-native';
import { Button, Card, MacroRing, ProgressBar, Screen, SectionHeader } from '@/components/common';
import { Colors, Radius, Spacing, Typography } from '@/theme';
import {
  useUserStore,
  useWorkoutStore,
  useNutritionStore,
  useHealthStore,
  useChatStore,
  useSubscriptionStore,
} from '@/stores';
import { goalLabel, weekdayLabel, todayISO } from '@/utils/date';

export default function HomeScreen() {
  const profile = useUserStore((s) => s.profile);
  const todayPlan = useWorkoutStore((s) => s.getTodayPlanDay());
  const weeklyPlan = useWorkoutStore((s) => s.weeklyPlan);
  const sessions = useWorkoutStore((s) => s.sessions);
  const startTodayWorkout = useWorkoutStore((s) => s.startTodayWorkout);
  const summary = useNutritionStore((s) => s.summary);
  const targets = useNutritionStore((s) => s.targets);
  const latest = useHealthStore((s) => s.latest());
  const remainingQuota = useChatStore((s) => s.remainingQuota());
  const isPro = useSubscriptionStore((s) => s.isActive);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 11) return '早上好';
    if (h < 14) return '中午好';
    if (h < 18) return '下午好';
    return '晚上好';
  }, []);

  const weekDone = useMemo(() => {
    if (!weeklyPlan) return 0;
    const dates = new Set(sessions.filter((s) => s.completedAt).map((s) => s.planDayDate));
    return weeklyPlan.days.filter((d) => !d.isRestDay && dates.has(d.date)).length;
  }, [weeklyPlan, sessions]);

  const weekTotal = weeklyPlan?.days.filter((d) => !d.isRestDay).length ?? 0;

  const onStartWorkout = async () => {
    try {
      await startTodayWorkout();
      if (!useWorkoutStore.getState().activeSession) {
        Alert.alert('无法开始', useWorkoutStore.getState().error ?? '请稍后重试');
        return;
      }
      router.push('/workout/session');
    } catch (e) {
      const message =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : '请稍后重试';
      Alert.alert('无法开始', message);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}，{profile?.name ?? '健身者'}</Text>
          <Text style={styles.sub}>
            {todayISO()} · {weekdayLabel(todayISO())}
            {profile?.goal ? ` · ${goalLabel(profile.goal)}` : ''}
          </Text>
        </View>
      </View>

      <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={styles.heroLabel}>今日训练</Text>
        {todayPlan ? (
          <>
            <Text style={styles.heroTitle}>{todayPlan.isRestDay ? '休息日' : todayPlan.title}</Text>
            <Text style={styles.heroMeta}>
              {todayPlan.isRestDay
                ? '好好恢复，明天再战'
                : `${todayPlan.focus} · 约 ${todayPlan.estimatedMinutes} 分钟 · ${todayPlan.exercises.length} 个动作`}
            </Text>
            {!todayPlan.isRestDay ? (
              <Button
                title="开始训练"
                variant="secondary"
                onPress={onStartWorkout}
                style={styles.heroBtn}
                fullWidth={false}
              />
            ) : null}
          </>
        ) : (
          <>
            <Text style={styles.heroTitle}>暂无计划</Text>
            <Text style={styles.heroMeta}>去训练页查看本周安排</Text>
            <Button title="查看训练" variant="secondary" onPress={() => router.push('/(tabs)/workout')} style={styles.heroBtn} fullWidth={false} />
          </>
        )}
      </LinearGradient>

      <SectionHeader title="今日营养" actionLabel="记录" onAction={() => router.push('/(tabs)/nutrition')} />
      <Card>
        <View style={styles.calRow}>
          <View>
            <Text style={styles.calValue}>{Math.round(summary?.consumed.calories ?? 0)}</Text>
            <Text style={styles.calLabel}>已摄入 kcal</Text>
          </View>
          <View style={styles.calRight}>
            {(() => {
              const remain = Math.round(summary?.remaining.calories ?? targets.calories);
              const over = remain < 0;
              return (
                <Text style={[styles.calRemain, over && styles.calRemainOver]}>
                  {over ? `已超 ${Math.abs(remain)}` : `剩余 ${remain}`}
                </Text>
              );
            })()}
            <Text style={styles.calTarget}>目标 {targets.calories}</Text>
          </View>
        </View>
        <ProgressBar progress={summary?.progress.calories ?? 0} color={Colors.calorie} style={styles.calBar} />
        <View style={styles.macroRow}>
          <MacroRing label="蛋白" value={summary?.consumed.protein ?? 0} target={targets.protein} color={Colors.protein} size={64} />
          <MacroRing label="碳水" value={summary?.consumed.carbs ?? 0} target={targets.carbs} color={Colors.carbs} size={64} />
          <MacroRing label="脂肪" value={summary?.consumed.fat ?? 0} target={targets.fat} color={Colors.fat} size={64} />
        </View>
      </Card>

      <SectionHeader title="快捷入口" />
      <View style={styles.quickGrid}>
        <QuickItem icon={<Dumbbell color={Colors.primary} size={22} />} label="训练" onPress={() => router.push('/(tabs)/workout')} />
        <QuickItem icon={<Utensils color={Colors.orange} size={22} />} label="饮食" onPress={() => router.push('/(tabs)/nutrition')} />
        <QuickItem icon={<Sparkles color={Colors.primaryLight} size={22} />} label={`AI (${isPro ? '∞' : remainingQuota})`} onPress={() => router.push('/(tabs)/ai')} />
        <QuickItem icon={<Activity color={Colors.success} size={22} />} label="身体" onPress={() => router.push('/body')} />
      </View>

      <SectionHeader title="本周概览" actionLabel="详情" onAction={() => router.push('/analytics')} />
      <Card>
        <View style={styles.statsRow}>
          <Stat label="训练完成" value={`${weekDone}/${weekTotal}`} />
          <Stat label="体重" value={latest ? `${latest.weightKg}` : '—'} unit="kg" />
          <Stat label="AI 余量" value={isPro ? '∞' : `${remainingQuota}`} unit={isPro ? undefined : '次'} />
        </View>
      </Card>
    </Screen>
  );
}

function QuickItem({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.quickItem}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.quickIcon}>{icon}</View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>
        {value}
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: Spacing.md, marginBottom: Spacing.lg },
  greeting: { ...Typography.h2 },
  sub: { ...Typography.caption, marginTop: Spacing.xs },
  hero: {
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    marginBottom: Spacing.sm,
  },
  heroLabel: { ...Typography.label, color: 'rgba(255,255,255,0.8)' },
  heroTitle: { ...Typography.h1, color: Colors.white, marginTop: Spacing.xs, fontSize: 24 },
  heroMeta: { ...Typography.caption, color: 'rgba(255,255,255,0.9)', marginTop: Spacing.sm, marginBottom: Spacing.lg },
  heroBtn: { alignSelf: 'flex-start', backgroundColor: Colors.white, minWidth: 120 },
  calRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  calValue: { ...Typography.number },
  calLabel: { ...Typography.caption },
  calRight: { alignItems: 'flex-end' },
  calRemain: { ...Typography.bodyMedium, color: Colors.primary },
  calRemainOver: { color: Colors.danger },
  calTarget: { ...Typography.caption },
  calBar: { marginTop: Spacing.md, marginBottom: Spacing.xl },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  quickItem: {
    width: '22%',
    flexGrow: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quickLabel: { ...Typography.captionMedium, color: Colors.textPrimary },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { ...Typography.numberSm },
  statUnit: { ...Typography.caption, fontWeight: '400' },
  statLabel: { ...Typography.caption, marginTop: 4 },
});
