import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { BarChart3, ChevronLeft } from 'lucide-react-native';
import { BarChart, LineChart, type ChartPoint } from '@/components/analytics';
import { Card, Chip, EmptyState, Screen, SectionHeader } from '@/components/common';
import { Colors, Radius, Spacing, Typography } from '@/theme';
import { useHealthStore, useNutritionStore, useWorkoutStore } from '@/stores';
import { average, filterDatedItems, type AnalyticsRange } from '@/utils/analytics';
import { sumNutrients } from '@/utils/nutrition';
import { todayISO } from '@/utils/date';

type AnalyticsSection = 'overview' | 'workout' | 'nutrition' | 'body' | 'habit';

const RANGES: Array<{ value: AnalyticsRange; label: string }> = [
  { value: 'week', label: '周' },
  { value: 'month', label: '月' },
  { value: 'quarter', label: '三个月' },
  { value: 'year', label: '年' },
  { value: 'all', label: '全部' },
];

const SECTIONS: Array<{ value: AnalyticsSection; label: string }> = [
  { value: 'overview', label: '总览' },
  { value: 'workout', label: '训练' },
  { value: 'nutrition', label: '饮食' },
  { value: 'body', label: '身体' },
  { value: 'habit', label: '习惯' },
];

export default function AnalyticsScreen() {
  const { width } = useWindowDimensions();
  const [range, setRange] = useState<AnalyticsRange>('month');
  const [section, setSection] = useState<AnalyticsSection>('overview');
  const measurements = useHealthStore((state) => state.measurements);
  const sessions = useWorkoutStore((state) => state.sessions);
  const weeklyPlan = useWorkoutStore((state) => state.weeklyPlan);
  const mealsByDate = useNutritionStore((state) => state.mealsByDate);
  const today = todayISO();
  const chartWidth = Math.max(220, Math.min(560, width - Spacing.lg * 4));

  const bodyData = useMemo(
    () => filterDatedItems(measurements, range, today),
    [measurements, range, today],
  );
  const workoutData = useMemo(
    () =>
      filterDatedItems(
        sessions
          .filter((session) => Boolean(session.completedAt))
          .map((session) => ({ date: session.planDayDate, session })),
        range,
        today,
      ),
    [sessions, range, today],
  );
  const nutritionData = useMemo(
    () =>
      filterDatedItems(
        Object.entries(mealsByDate).map(([date, meals]) => ({
          date,
          calories: sumNutrients(meals.flatMap((meal) => meal.foods)).calories,
        })),
        range,
        today,
      ),
    [mealsByDate, range, today],
  );

  const weightPoints: ChartPoint[] = bodyData.map((item) => ({
    date: item.date,
    value: item.weightKg,
  }));
  const caloriePoints: ChartPoint[] = nutritionData.map((item) => ({
    date: item.date,
    value: item.calories,
  }));
  const totalVolume = workoutData.reduce(
    (sum, item) => sum + (item.session.totalVolumeKg ?? 0),
    0,
  );
  const plannedDays = weeklyPlan?.days.filter((day) => !day.isRestDay).length ?? 0;
  const weightChange =
    bodyData.length >= 2
      ? (bodyData[bodyData.length - 1]?.weightKg ?? 0) - (bodyData[0]?.weightKg ?? 0)
      : 0;

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="返回上一页"
        >
          <ChevronLeft size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>数据分析</Text>
          <Text style={styles.subtitle}>训练、营养与身体趋势</Text>
        </View>
        <View style={styles.iconTile}>
          <BarChart3 size={22} color={Colors.primary} />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {SECTIONS.map((item) => (
          <Chip
            key={item.value}
            label={item.label}
            selected={section === item.value}
            onPress={() => setSection(item.value)}
          />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {RANGES.map((item) => (
          <Chip
            key={item.value}
            label={item.label}
            selected={range === item.value}
            onPress={() => setRange(item.value)}
          />
        ))}
      </ScrollView>

      <View style={styles.metrics}>
        <MetricCard label="完成训练" value={`${workoutData.length}`} unit="次" tone={Colors.primary} />
        <MetricCard
          label="训练容量"
          value={`${Math.round(totalVolume)}`}
          unit="kg"
          tone={Colors.blue}
        />
        <MetricCard
          label="平均热量"
          value={`${Math.round(average(nutritionData.map((item) => item.calories)))}`}
          unit="kcal"
          tone={Colors.orange}
        />
        <MetricCard
          label="体重变化"
          value={`${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}`}
          unit="kg"
          tone={weightChange > 0 ? Colors.warning : Colors.success}
        />
      </View>

      {(section === 'overview' || section === 'body') && (
        <>
          <SectionHeader title="体重趋势" />
          <Card style={styles.chartCard}>
            {weightPoints.length ? (
              <LineChart
                data={weightPoints}
                width={chartWidth}
                accessibilityLabel={`体重趋势，共 ${weightPoints.length} 条记录`}
              />
            ) : (
              <EmptyState title="暂无身体数据" description="记录体重后即可查看趋势" />
            )}
          </Card>
        </>
      )}

      {(section === 'overview' || section === 'nutrition') && (
        <>
          <SectionHeader title="每日热量" />
          <Card style={styles.chartCard}>
            {caloriePoints.length ? (
              <BarChart
                data={caloriePoints}
                width={chartWidth}
                accessibilityLabel={`每日热量，共 ${caloriePoints.length} 天记录`}
              />
            ) : (
              <EmptyState title="暂无饮食数据" description="记录餐食后即可查看热量变化" />
            )}
          </Card>
        </>
      )}

      {(section === 'overview' || section === 'workout') && (
        <>
          <SectionHeader title="训练完成度" />
          <Card>
            <View style={styles.completionRow}>
              <View>
                <Text style={styles.completionValue}>{workoutData.length}</Text>
                <Text style={styles.completionLabel}>筛选范围内已完成</Text>
              </View>
              <View style={styles.completionRight}>
                <Text style={styles.completionValue}>{plannedDays}</Text>
                <Text style={styles.completionLabel}>当前周计划训练日</Text>
              </View>
            </View>
          </Card>
        </>
      )}

      {section === 'habit' && (
        <>
          <SectionHeader title="记录习惯" />
          <Card>
            <HabitRow label="有训练记录的日期" value={workoutData.length} />
            <HabitRow label="有饮食记录的日期" value={nutritionData.length} />
            <HabitRow label="有身体记录的日期" value={bodyData.length} last />
          </Card>
        </>
      )}
    </Screen>
  );
}

function MetricCard({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  tone: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricDot, { backgroundColor: tone }]} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
        {value} <Text style={styles.metricUnit}>{unit}</Text>
      </Text>
    </View>
  );
}

function HabitRow({ label, value, last }: { label: string; value: number; last?: boolean }) {
  return (
    <View style={[styles.habitRow, last && styles.habitRowLast]}>
      <Text style={styles.habitLabel}>{label}</Text>
      <Text style={styles.habitValue}>{value} 天</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerText: { flex: 1, paddingHorizontal: Spacing.md },
  title: { ...Typography.h1 },
  subtitle: { ...Typography.caption, marginTop: 2 },
  iconTile: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySoft,
  },
  chips: { paddingRight: Spacing.md },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 130,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  metricDot: { width: 8, height: 8, borderRadius: 4, marginBottom: Spacing.md },
  metricLabel: { ...Typography.caption },
  metricValue: { ...Typography.numberSm, marginTop: Spacing.xs },
  metricUnit: { ...Typography.label },
  chartCard: { alignItems: 'center', overflow: 'hidden' },
  completionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  completionRight: { alignItems: 'flex-end' },
  completionValue: { ...Typography.number },
  completionLabel: { ...Typography.caption, marginTop: Spacing.xs },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  habitRowLast: { borderBottomWidth: 0 },
  habitLabel: { ...Typography.body },
  habitValue: { ...Typography.bodyMedium, color: Colors.primary },
});
