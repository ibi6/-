import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { AlertTriangle, CheckCircle2, ChevronLeft, Dumbbell } from 'lucide-react-native';
import { Button, Card, EmptyState, Screen } from '@/components/common';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/theme';
import {
  createExerciseDetailViewModel,
  createExerciseSegmentState,
} from '@/data/exercises';
import { useWorkoutStore } from '@/stores';

type GuidanceSegment = 'cues' | 'mistakes';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const hasActiveSession = useWorkoutStore((state) => Boolean(state.activeSession));
  const [segment, setSegment] = useState<GuidanceSegment>('cues');
  const detail = createExerciseDetailViewModel(id, hasActiveSession);

  if (!detail) {
    return (
      <Screen edges={['top', 'bottom']} contentStyle={styles.emptyContent}>
        <EmptyState
          title="未找到这个动作"
          description="动作信息缺失或链接已失效，请返回训练计划重新选择。"
          actionLabel="返回训练页"
          onAction={() => router.replace('/(tabs)/workout')}
        />
      </Screen>
    );
  }

  const guidanceItems = segment === 'cues' ? detail.cues : detail.commonMistakes;

  const handlePrimaryAction = () => {
    if (detail.primaryAction.route === '/workout/session') {
      router.replace('/workout/session');
      return;
    }
    router.replace('/(tabs)/workout');
  };

  return (
    <Screen edges={['top', 'bottom']} contentStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="返回上一页"
          hitSlop={8}
        >
          <ChevronLeft size={22} color={Colors.textPrimary} />
        </Pressable>
        <View>
          <Text style={styles.eyebrow}>训练动作</Text>
          <Text style={styles.headerTitle}>动作详情</Text>
        </View>
      </View>

      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.media}
      >
        <View style={[styles.decorativeCircle, styles.decorativeCircleTop]} />
        <View style={[styles.decorativeCircle, styles.decorativeCircleBottom]} />
        <View style={styles.mediaIcon}>
          <Dumbbell size={42} color={Colors.white} strokeWidth={1.8} />
        </View>
        <Text style={styles.mediaLabel}>动作示意</Text>
        <Text style={styles.mediaHint}>训练时保持稳定节奏与可控幅度</Text>
      </LinearGradient>

      <View style={styles.titleBlock}>
        <Text style={styles.title}>{detail.name}</Text>
        <Text style={styles.description}>{detail.description}</Text>
      </View>

      <View style={styles.detailGrid}>
        <DetailCard label="主要肌群" value={detail.primaryMuscle} />
        <DetailCard label="辅助肌群" value={detail.secondaryMuscles} />
        <DetailCard label="所需器械" value={detail.equipment} />
        <DetailCard label="动作难度" value={detail.difficulty} />
      </View>

      <Text style={styles.sectionTitle}>默认训练安排</Text>
      <View style={styles.metrics}>
        <Metric label="组数" value={detail.defaults.sets} />
        <Metric label="次数" value={detail.defaults.reps} />
        <Metric label="休息" value={detail.defaults.rest} />
      </View>

      <View style={styles.segmented} accessibilityRole="tablist">
        <SegmentButton
          label="动作要点"
          selected={segment === 'cues'}
          disabled={false}
          onPress={() => setSegment('cues')}
        />
        <SegmentButton
          label="常见错误"
          selected={segment === 'mistakes'}
          disabled={false}
          onPress={() => setSegment('mistakes')}
        />
      </View>

      <Card style={[styles.guidanceCard, segment === 'mistakes' && styles.warningCard]}>
        {guidanceItems.map((item, index) => (
          <View key={`${item}-${index}`} style={styles.guidanceRow}>
            {segment === 'cues' ? (
              <CheckCircle2 size={20} color={Colors.primary} />
            ) : (
              <AlertTriangle size={20} color={Colors.warning} />
            )}
            <View style={styles.guidanceCopy}>
              <Text style={styles.guidanceIndex}>第 {index + 1} 点</Text>
              <Text style={styles.guidanceText}>{item}</Text>
            </View>
          </View>
        ))}
        {segment === 'mistakes' ? (
          <Text style={styles.safetyText}>{detail.safetyNotice}</Text>
        ) : null}
      </Card>

      <View style={styles.actionArea}>
        <Text style={styles.actionHint}>
          {hasActiveSession
            ? '你有一场进行中的训练，可直接返回继续记录。'
            : '请返回训练计划，从训练日卡片开始一场训练。'}
        </Text>
        <Button
          title={detail.primaryAction.label}
          onPress={handlePrimaryAction}
          size="lg"
          accessibilityHint={
            hasActiveSession ? '进入正在进行的训练' : '返回训练计划选择训练日'
          }
        />
      </View>
    </Screen>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailCard}>
      <Text style={styles.detailLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.detailValue} numberOfLines={2} ellipsizeMode="tail">
        {value}
      </Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function SegmentButton({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const segmentState = createExerciseSegmentState(selected, disabled);

  return (
    <Pressable
      onPress={onPress}
      disabled={segmentState.disabled}
      style={({ pressed }) => [
        styles.segmentButton,
        selected && styles.segmentButtonSelected,
        disabled && styles.segmentButtonDisabled,
        pressed && styles.pressed,
      ]}
      accessibilityRole="tab"
      accessibilityState={segmentState.accessibilityState}
      accessibilityLabel={label}
      accessibilityHint={selected ? '当前已显示，可切换到其他分段' : `切换到${label}`}
    >
      <Text
        style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: Spacing.md },
  emptyContent: { flexGrow: 1, justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  eyebrow: { ...Typography.label, color: Colors.primary, marginBottom: 2 },
  headerTitle: { ...Typography.h2 },
  media: {
    minHeight: 220,
    overflow: 'hidden',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    ...Shadows.card,
  },
  decorativeCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  decorativeCircleTop: { top: -72, right: -30 },
  decorativeCircleBottom: { bottom: -92, left: -36 },
  mediaIcon: {
    width: 88,
    height: 88,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.30)',
  },
  mediaLabel: { ...Typography.h3, color: Colors.white, marginTop: Spacing.lg },
  mediaHint: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.78)',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  titleBlock: { marginVertical: Spacing.xl },
  title: { ...Typography.h1 },
  description: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.sm },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  detailCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: 140,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  detailLabel: { ...Typography.label },
  detailValue: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    flexShrink: 1,
  },
  sectionTitle: { ...Typography.h3, marginTop: Spacing.xxl, marginBottom: Spacing.md },
  metrics: { flexDirection: 'row', gap: Spacing.sm },
  metric: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 88,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primarySoft,
  },
  metricValue: { ...Typography.numberSm, color: Colors.primary },
  metricLabel: { ...Typography.label, marginTop: Spacing.xs },
  segmented: {
    flexDirection: 'row',
    padding: Spacing.xs,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.border,
  },
  segmentButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  segmentButtonSelected: { backgroundColor: Colors.surface, ...Shadows.soft },
  segmentButtonDisabled: { opacity: 0.45 },
  segmentLabel: { ...Typography.bodyMedium, color: Colors.textSecondary },
  segmentLabelSelected: { color: Colors.primary },
  guidanceCard: { paddingBottom: Spacing.sm },
  warningCard: { backgroundColor: '#FFF9EE', borderColor: '#FFE2AA' },
  guidanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  guidanceCopy: { flex: 1 },
  guidanceIndex: { ...Typography.label, color: Colors.primary, marginBottom: 2 },
  guidanceText: { ...Typography.body },
  safetyText: {
    ...Typography.caption,
    color: Colors.danger,
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#FFE2AA',
  },
  actionArea: { marginTop: Spacing.xxl, marginBottom: Spacing.lg },
  actionHint: {
    ...Typography.caption,
    textAlign: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  pressed: { opacity: 0.78 },
});
