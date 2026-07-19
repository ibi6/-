import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { Button, Card, Screen, TextField } from '@/components/common';
import { Colors, Spacing, Typography } from '@/theme';
import { useWorkoutStore, getSuggestedLoad } from '@/stores';
import { useSessionTimer } from '@/hooks/useSessionTimer';
import { getExerciseById } from '@/data';
import { formatWeight } from '@/utils/date';
import type { Rpe } from '@/types';

export default function WorkoutSessionScreen() {
  const activeSession = useWorkoutStore((s) => s.activeSession);
  const phase = useWorkoutStore((s) => s.phase);
  const currentExerciseIndex = useWorkoutStore((s) => s.currentExerciseIndex);
  const currentSetIndex = useWorkoutStore((s) => s.currentSetIndex);
  const setPhase = useWorkoutStore((s) => s.setPhase);
  const logSet = useWorkoutStore((s) => s.logSet);
  const skipRest = useWorkoutStore((s) => s.skipRest);
  const completeWorkout = useWorkoutStore((s) => s.completeWorkout);
  const abandonWorkout = useWorkoutStore((s) => s.abandonWorkout);
  const { restSecondsLeft, isResting } = useSessionTimer();

  const exercise = activeSession?.exercises[currentExerciseIndex];
  const meta = exercise ? getExerciseById(exercise.exerciseId) : null;
  const suggested = useMemo(
    () => getSuggestedLoad(activeSession, currentExerciseIndex),
    [activeSession, currentExerciseIndex],
  );

  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState<Rpe | undefined>();
  const [pain, setPain] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!exercise) return;
    const lastDone = [...exercise.sets].reverse().find((s) => s.completed);
    const w =
      (suggested?.nextWeightKg && suggested.nextWeightKg > 0
        ? suggested.nextWeightKg
        : undefined) ??
      lastDone?.weightKg ??
      20;
    const r = suggested?.nextReps ?? lastDone?.reps ?? exercise.plannedReps;
    setWeight(String(w));
    setReps(String(r));
    setRpe(undefined);
    setPain(false);
  }, [
    exercise,
    currentExerciseIndex,
    currentSetIndex,
    suggested?.nextWeightKg,
    suggested?.nextReps,
  ]);

  useEffect(() => {
    if (!activeSession && phase !== 'summary' && phase !== 'completed') {
      router.back();
    }
  }, [activeSession, phase]);

  if (!activeSession || !exercise) {
    return (
      <Screen>
        <Text style={styles.title}>无进行中的训练</Text>
        <Button title="返回" onPress={() => router.back()} />
      </Screen>
    );
  }

  const onAbandon = () => {
    Alert.alert('放弃训练', '当前进度不会保存为完成记录，确定退出？', [
      { text: '继续训练', style: 'cancel' },
      {
        text: '放弃',
        style: 'destructive',
        onPress: () => {
          abandonWorkout();
          router.back();
        },
      },
    ]);
  };

  const onLog = async () => {
    const w = Number(weight);
    const r = Number(reps);
    if (!Number.isFinite(w) || w < 0 || !Number.isFinite(r) || r <= 0) {
      Alert.alert('请检查输入', '重量需 ≥ 0，次数需 > 0');
      return;
    }
    setSubmitting(true);
    try {
      await logSet({
        weightKg: w,
        reps: Math.round(r),
        rpe,
        painFlag: pain,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onComplete = async () => {
    setSubmitting(true);
    try {
      await completeWorkout();
      router.replace('/workout/summary');
    } catch {
      Alert.alert('完成失败', '请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const totalEx = activeSession.exercises.length;
  const plannedSets = exercise.plannedSets;

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <View style={styles.flex}>
          <Text style={styles.sessionTitle}>{activeSession.title}</Text>
          <Text style={styles.progress}>
            动作 {currentExerciseIndex + 1}/{totalEx} · 第 {Math.min(currentSetIndex + 1, plannedSets)}/
            {plannedSets} 组
          </Text>
        </View>
        <Pressable onPress={onAbandon} hitSlop={10} style={styles.closeBtn}>
          <X size={22} color={Colors.textSecondary} />
        </Pressable>
      </View>

      {phase === 'preparing' ? (
        <Card style={styles.heroCard}>
          <Text style={styles.phaseLabel}>准备开始</Text>
          <Text style={styles.exName}>{meta?.name ?? exercise.name}</Text>
          <Text style={styles.exMeta}>
            {[meta?.muscleGroup, ...(meta?.secondaryMuscles ?? [])].filter(Boolean).join(' · ')}
            {' · '}
            目标 {plannedSets}×{exercise.plannedReps}
          </Text>
          {meta?.cues?.length ? (
            <View style={styles.cues}>
              {meta.cues.slice(0, 3).map((c) => (
                <Text key={c} style={styles.cue}>
                  · {c}
                </Text>
              ))}
            </View>
          ) : null}
          <Button title="开始第一组" onPress={() => setPhase('activeSet')} style={styles.mt} />
        </Card>
      ) : null}

      {phase === 'activeSet' ? (
        <>
          <Card style={styles.heroCard}>
            <Text style={styles.phaseLabel}>进行中</Text>
            <Text style={styles.exName}>{meta?.name ?? exercise.name}</Text>
            <Text style={styles.exMeta}>
              目标 {exercise.plannedReps} 次
              {suggested && suggested.nextWeightKg > 0
                ? ` · 建议 ${formatWeight(suggested.nextWeightKg)} kg × ${suggested.nextReps}`
                : ''}
            </Text>
            {suggested?.reason ? <Text style={styles.suggestNote}>{suggested.reason}</Text> : null}
          </Card>

          <Card>
            <TextField
              label="重量 (kg)"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder="0"
            />
            <TextField
              label="次数"
              value={reps}
              onChangeText={setReps}
              keyboardType="number-pad"
              placeholder="0"
            />
            <Text style={styles.rpeLabel}>RPE（可选）</Text>
            <View style={styles.rpeRow}>
              {([6, 7, 8, 9, 10] as Rpe[]).map((v) => (
                <Pressable
                  key={v}
                  style={[styles.rpeChip, rpe === v && styles.rpeChipOn]}
                  onPress={() => setRpe(rpe === v ? undefined : v)}
                >
                  <Text style={[styles.rpeText, rpe === v && styles.rpeTextOn]}>{v}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.painRow} onPress={() => setPain((p) => !p)}>
              <View style={[styles.checkbox, pain && styles.checkboxOn]} />
              <Text style={styles.painText}>本组有疼痛 / 不适（会降低下次建议负荷）</Text>
            </Pressable>
            <Button title="完成这组" onPress={() => void onLog()} loading={submitting} />
          </Card>

          <Card style={styles.historyCard}>
            <Text style={styles.historyTitle}>本组进度</Text>
            {exercise.sets.map((s, i) => (
              <Text key={s.id} style={styles.historyItem}>
                第 {i + 1} 组{' '}
                {s.completed
                  ? `${formatWeight(s.weightKg)} kg × ${s.reps}${s.rpe ? ` · RPE ${s.rpe}` : ''}`
                  : i === currentSetIndex
                    ? '进行中…'
                    : '待完成'}
              </Text>
            ))}
          </Card>
        </>
      ) : null}

      {isResting || phase === 'resting' ? (
        <Card style={styles.restCard}>
          <Text style={styles.phaseLabel}>休息</Text>
          <Text style={styles.timer}>{restSecondsLeft}s</Text>
          <Text style={styles.exMeta}>
            下一组：{meta?.name ?? exercise.name} · 第{' '}
            {Math.min(currentSetIndex + 1, plannedSets)}/{plannedSets}
          </Text>
          <Button title="跳过休息" variant="soft" onPress={skipRest} style={styles.mt} />
        </Card>
      ) : null}

      {phase === 'completed' ? (
        <Card style={styles.heroCard}>
          <Text style={styles.phaseLabel}>全部完成</Text>
          <Text style={styles.exName}>干得漂亮！</Text>
          <Text style={styles.exMeta}>所有动作已记录，点击生成训练总结</Text>
          <Button title="查看总结" onPress={() => void onComplete()} loading={submitting} style={styles.mt} />
          <Button title="放弃不保存" variant="ghost" onPress={onAbandon} style={styles.mt} />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  flex: { flex: 1 },
  sessionTitle: { ...Typography.h2 },
  progress: { ...Typography.caption, marginTop: 4 },
  closeBtn: { padding: Spacing.sm },
  title: { ...Typography.h2, marginVertical: Spacing.xl },
  heroCard: { marginBottom: Spacing.md, backgroundColor: Colors.primarySoft, borderColor: Colors.primary },
  phaseLabel: { ...Typography.label, color: Colors.primary },
  exName: { ...Typography.h1, fontSize: 24, marginTop: Spacing.xs },
  exMeta: { ...Typography.caption, marginTop: Spacing.sm },
  suggestNote: { ...Typography.caption, color: Colors.primary, marginTop: Spacing.sm },
  cues: { marginTop: Spacing.md },
  cue: { ...Typography.caption, marginBottom: 2 },
  mt: { marginTop: Spacing.lg },
  rpeLabel: { ...Typography.captionMedium, color: Colors.textSecondary, marginBottom: Spacing.sm },
  rpeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  rpeChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  rpeChipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  rpeText: { ...Typography.captionMedium },
  rpeTextOn: { color: Colors.white },
  painRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg, gap: Spacing.sm },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  checkboxOn: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  painText: { ...Typography.caption, flex: 1 },
  historyCard: { marginTop: Spacing.md },
  historyTitle: { ...Typography.bodyMedium, marginBottom: Spacing.sm },
  historyItem: { ...Typography.caption, marginBottom: 4 },
  restCard: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    backgroundColor: '#E8F1FF',
    borderColor: Colors.rest ?? Colors.blue,
  },
  timer: { ...Typography.number, fontSize: 56, color: Colors.rest ?? Colors.blue, marginVertical: Spacing.md },
});
