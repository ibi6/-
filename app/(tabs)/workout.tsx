import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Chip, EmptyState, Screen, SectionHeader } from '@/components/common';
import { Colors, Spacing, Typography } from '@/theme';
import { useWorkoutStore } from '@/stores';
import { weekdayLabel, formatDuration } from '@/utils/date';
import { getExerciseById } from '@/data';
import type { PlanDay } from '@/types';

export default function WorkoutTab() {
  const weeklyPlan = useWorkoutStore((s) => s.weeklyPlan);
  const sessions = useWorkoutStore((s) => s.sessions);
  const isLoading = useWorkoutStore((s) => s.isLoading);
  const startPlanDay = useWorkoutStore((s) => s.startPlanDay);
  const startTodayWorkout = useWorkoutStore((s) => s.startTodayWorkout);
  const loadWeeklyPlan = useWorkoutStore((s) => s.loadWeeklyPlan);
  const getTodayPlanDay = useWorkoutStore((s) => s.getTodayPlanDay);
  const [filter, setFilter] = useState<'all' | 'train' | 'rest'>('all');

  const today = getTodayPlanDay();
  const days = (weeklyPlan?.days ?? []).filter((d) => {
    if (filter === 'train') return !d.isRestDay;
    if (filter === 'rest') return d.isRestDay;
    return true;
  });

  const completedDates = new Set(sessions.filter((s) => s.completedAt).map((s) => s.planDayDate));

  const onStart = async (day?: PlanDay) => {
    try {
      if (day) {
        if (day.isRestDay) {
          Alert.alert('休息日', '今天安排为休息，建议恢复与拉伸。');
          return;
        }
        await startPlanDay(day);
      } else {
        await startTodayWorkout();
      }
      router.push('/workout/session');
    } catch {
      Alert.alert('无法开始', '请稍后重试');
    }
  };

  return (
    <Screen loading={isLoading && !weeklyPlan}>
      <Text style={styles.title}>训练</Text>
      <Text style={styles.sub}>
        {weeklyPlan ? `周起始 ${weeklyPlan.weekStart}` : '加载本周计划…'}
      </Text>

      {today && !today.isRestDay ? (
        <Card style={styles.todayCard}>
          <Text style={styles.todayLabel}>今日推荐</Text>
          <Text style={styles.todayTitle}>{today.title}</Text>
          <Text style={styles.todayMeta}>
            {today.focus} · {today.estimatedMinutes} 分钟 · {today.exercises.length} 动作
          </Text>
          <Button title="开始今日训练" onPress={() => onStart(today)} loading={isLoading} />
        </Card>
      ) : null}

      <SectionHeader title="本周计划" actionLabel="刷新" onAction={() => void loadWeeklyPlan()} />
      <View style={styles.filters}>
        <Chip label="全部" selected={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label="训练日" selected={filter === 'train'} onPress={() => setFilter('train')} />
        <Chip label="休息日" selected={filter === 'rest'} onPress={() => setFilter('rest')} />
      </View>

      {days.length === 0 ? (
        <EmptyState title="暂无计划" description="下拉刷新或重新登录 Demo 账号" actionLabel="刷新" onAction={() => void loadWeeklyPlan()} />
      ) : (
        days.map((day) => {
          const done = completedDates.has(day.date);
          return (
            <Card key={day.date} style={styles.dayCard} onPress={() => !day.isRestDay && onStart(day)}>
              <View style={styles.dayHeader}>
                <View>
                  <Text style={styles.dayWeek}>{weekdayLabel(day.date)}</Text>
                  <Text style={styles.dayDate}>{day.date}</Text>
                </View>
                <View style={[styles.badge, day.isRestDay ? styles.badgeRest : done ? styles.badgeDone : styles.badgeTrain]}>
                  <Text style={styles.badgeText}>
                    {day.isRestDay ? '休息' : done ? '已完成' : '训练'}
                  </Text>
                </View>
              </View>
              <Text style={styles.dayTitle}>{day.title}</Text>
              <Text style={styles.dayMeta}>
                {day.isRestDay
                  ? '主动恢复 · 拉伸 / 散步'
                  : `${day.focus} · ${day.estimatedMinutes} 分钟 · 难度 ${day.difficulty}/5`}
              </Text>
              {!day.isRestDay ? (
                <View style={styles.exList}>
                  {day.exercises.slice(0, 3).map((ex) => {
                    const meta = getExerciseById(ex.exerciseId);
                    return (
                      <Text key={ex.exerciseId} style={styles.exItem}>
                        · {meta?.name ?? ex.exerciseId} {ex.sets}×{ex.reps}
                      </Text>
                    );
                  })}
                  {day.exercises.length > 3 ? (
                    <Text style={styles.exItem}>…另有 {day.exercises.length - 3} 个动作</Text>
                  ) : null}
                </View>
              ) : null}
              {!day.isRestDay && !done ? (
                <Button title="开始" size="sm" onPress={() => onStart(day)} style={styles.startBtn} />
              ) : null}
            </Card>
          );
        })
      )}

      <SectionHeader title="最近训练" />
      {sessions.filter((s) => s.completedAt).slice(0, 5).length === 0 ? (
        <EmptyState title="还没有完成的训练" description="完成一次训练后会出现在这里" />
      ) : (
        sessions
          .filter((s) => s.completedAt)
          .slice(0, 5)
          .map((s) => (
            <Card key={s.id} style={styles.sessionCard}>
              <Text style={styles.dayTitle}>{s.title}</Text>
              <Text style={styles.dayMeta}>
                {s.planDayDate}
                {s.durationSec ? ` · ${formatDuration(s.durationSec)}` : ''}
                {s.totalVolumeKg ? ` · 容量 ${Math.round(s.totalVolumeKg)} kg` : ''}
              </Text>
            </Card>
          ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...Typography.h1, marginTop: Spacing.md },
  sub: { ...Typography.caption, marginBottom: Spacing.lg },
  todayCard: { marginBottom: Spacing.md, backgroundColor: Colors.primarySoft, borderColor: Colors.primary },
  todayLabel: { ...Typography.label, color: Colors.primary },
  todayTitle: { ...Typography.h2, marginTop: Spacing.xs },
  todayMeta: { ...Typography.caption, marginVertical: Spacing.md },
  filters: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.sm },
  dayCard: { marginBottom: Spacing.md },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  dayWeek: { ...Typography.captionMedium, color: Colors.primary },
  dayDate: { ...Typography.label },
  badge: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: 999 },
  badgeTrain: { backgroundColor: Colors.primarySoft },
  badgeDone: { backgroundColor: '#D8F5E8' },
  badgeRest: { backgroundColor: Colors.border },
  badgeText: { ...Typography.label, color: Colors.textPrimary },
  dayTitle: { ...Typography.h3, marginTop: Spacing.sm },
  dayMeta: { ...Typography.caption, marginTop: 4 },
  exList: { marginTop: Spacing.md },
  exItem: { ...Typography.caption, marginBottom: 2 },
  startBtn: { marginTop: Spacing.md },
  sessionCard: { marginBottom: Spacing.sm },
});
