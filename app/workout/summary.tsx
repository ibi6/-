import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Screen } from '@/components/common';
import { Colors, Spacing, Typography } from '@/theme';
import { useWorkoutStore } from '@/stores';
import { formatDuration, formatWeight } from '@/utils/date';
import { getExerciseById } from '@/data';

export default function WorkoutSummaryScreen() {
  const sessions = useWorkoutStore((s) => s.sessions);
  const phase = useWorkoutStore((s) => s.phase);

  const session = useMemo(() => {
    const completed = sessions.filter((s) => s.completedAt);
    if (completed.length === 0) return sessions[0] ?? null;
    return [...completed].sort((a, b) => {
      const ta = a.completedAt ?? a.startedAt ?? '';
      const tb = b.completedAt ?? b.startedAt ?? '';
      return tb.localeCompare(ta);
    })[0];
  }, [sessions]);

  if (!session) {
    return (
      <Screen>
        <Text style={styles.title}>暂无训练总结</Text>
        <Button title="返回训练" onPress={() => router.replace('/(tabs)/workout')} />
      </Screen>
    );
  }

  const totalSets = session.exercises.reduce(
    (n, ex) => n + ex.sets.filter((s) => s.completed).length,
    0,
  );
  const volume =
    session.totalVolumeKg ??
    session.exercises.reduce(
      (sum, ex) =>
        sum + ex.sets.filter((s) => s.completed).reduce((a, s) => a + s.weightKg * s.reps, 0),
      0,
    );

  return (
    <Screen>
      <Text style={styles.kicker}>{phase === 'summary' ? '训练完成' : '最近训练'}</Text>
      <Text style={styles.title}>{session.title}</Text>
      <Text style={styles.sub}>{session.planDayDate}</Text>

      <Card style={styles.stats}>
        <Stat label="时长" value={session.durationSec ? formatDuration(session.durationSec) : '—'} />
        <Stat label="容量" value={`${Math.round(volume)}`} unit="kg" />
        <Stat label="组数" value={`${totalSets}`} />
      </Card>

      <Text style={styles.section}>动作明细</Text>
      {session.exercises.map((ex) => {
        const meta = getExerciseById(ex.exerciseId);
        const done = ex.sets.filter((s) => s.completed);
        const vol = done.reduce((a, s) => a + s.weightKg * s.reps, 0);
        return (
          <Card key={ex.exerciseId} style={styles.exCard}>
            <Text style={styles.exName}>{meta?.name ?? ex.exerciseId}</Text>
            <Text style={styles.exMeta}>
              {done.length}/{ex.plannedSets} 组 · 容量 {Math.round(vol)} kg
              {ex.painReported ? ' · 有不适' : ''}
            </Text>
            {done.map((s) => (
              <Text key={s.id} style={styles.setLine}>
                第 {s.setIndex} 组 {formatWeight(s.weightKg)} kg × {s.reps}
                {s.rpe ? ` · RPE ${s.rpe}` : ''}
              </Text>
            ))}
          </Card>
        );
      })}

      <Button title="回到首页" onPress={() => router.replace('/(tabs)')} style={styles.btn} />
      <Button
        title="查看训练计划"
        variant="soft"
        onPress={() => router.replace('/(tabs)/workout')}
        style={styles.btn}
      />
    </Screen>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statVal}>
        {value}
        {unit ? <Text style={styles.unit}> {unit}</Text> : null}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: { ...Typography.label, color: Colors.primary, marginTop: Spacing.md },
  title: { ...Typography.h1, marginTop: Spacing.xs },
  sub: { ...Typography.caption, marginBottom: Spacing.xl },
  stats: { flexDirection: 'row', marginBottom: Spacing.xl, paddingVertical: Spacing.xl },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { ...Typography.numberSm },
  unit: { ...Typography.caption, fontWeight: '400' },
  statLabel: { ...Typography.caption, marginTop: 4 },
  section: { ...Typography.h3, marginBottom: Spacing.md },
  exCard: { marginBottom: Spacing.md },
  exName: { ...Typography.bodyMedium },
  exMeta: { ...Typography.caption, marginTop: 2, marginBottom: Spacing.sm },
  setLine: { ...Typography.caption, marginBottom: 2 },
  btn: { marginTop: Spacing.sm },
});
