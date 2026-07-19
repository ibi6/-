import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Scale, Sparkles, Utensils } from 'lucide-react-native';
import { Button, Card, EmptyState, Screen, TextField } from '@/components/common';
import { getFoodById } from '@/data';
import { useNutritionStore } from '@/stores';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/theme';
import type { MealType } from '@/types';
import {
  computeMealFoodNutrients,
  foodServingOptions,
  parseFoodWeight,
} from '@/utils/nutrition';
import { mealTypeLabel } from '@/utils/date';

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function FoodDetailScreen() {
  const params = useLocalSearchParams<{ id?: string; mealType?: string }>();
  const food = params.id ? getFoodById(params.id) : undefined;
  const initialMeal = params.mealType as MealType;
  const [mealType, setMealType] = useState<MealType>(
    MEALS.includes(initialMeal) ? initialMeal : 'lunch',
  );
  const [weight, setWeight] = useState(() => String(food?.commonServingG ?? 100));
  const [adding, setAdding] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const addFoodToMeal = useNutritionStore((state) => state.addFoodToMeal);

  const parsedWeight = parseFoodWeight(weight);
  const nutrients = useMemo(
    () =>
      food && parsedWeight
        ? computeMealFoodNutrients(food.per100g, parsedWeight)
        : { calories: 0, protein: 0, carbs: 0, fat: 0 },
    [food, parsedWeight],
  );

  if (!food) {
    return (
      <Screen edges={['top', 'bottom']}>
        <EmptyState
          title="没有找到这项食物"
          description="食物参数可能已失效，请返回搜索页重新选择。"
          actionLabel="返回饮食"
          onAction={() => router.replace('/(tabs)/nutrition')}
        />
      </Screen>
    );
  }

  const onAdd = async () => {
    setSubmitted(true);
    if (!parsedWeight) return;
    setAdding(true);
    try {
      await addFoodToMeal({ mealType, foodId: food.id, weightG: parsedWeight });
      Alert.alert('记录成功', `已将「${food.name}」添加到${mealTypeLabel(mealType)}`, [
        { text: '继续查看', style: 'cancel' },
        { text: '查看饮食', onPress: () => router.replace('/(tabs)/nutrition') },
      ]);
    } catch (error) {
      Alert.alert(
        '添加失败',
        error instanceof Error ? error.message : '暂时无法保存，请稍后重试。',
      );
    } finally {
      setAdding(false);
    }
  };

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
        <View>
          <Text style={styles.eyebrow}>营养档案</Text>
          <Text style={styles.headerTitle}>食物详情</Text>
        </View>
      </View>

      <LinearGradient
        colors={[Colors.primarySoft, '#F8F6FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroIcon}>
          <Utensils size={28} color={Colors.primary} />
        </View>
        <Text style={styles.title}>{food.name}</Text>
        {food.brand ? <Text style={styles.brand}>{food.brand}</Text> : null}
        <View style={styles.tags}>
          {(food.tags ?? ['日常食物']).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.metrics}>
        <Metric label="热量" value={`${nutrients.calories}`} unit="kcal" color={Colors.calorie} />
        <Metric label="蛋白" value={`${nutrients.protein}`} unit="g" color={Colors.protein} />
        <Metric label="碳水" value={`${nutrients.carbs}`} unit="g" color={Colors.carbs} />
        <Metric label="脂肪" value={`${nutrients.fat}`} unit="g" color={Colors.fat} />
      </View>

      <Card style={styles.formCard}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.smallIcon}>
            <Scale size={18} color={Colors.primary} />
          </View>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>调整食用份量</Text>
            <Text style={styles.sectionHint}>营养数据会随重量实时计算</Text>
          </View>
        </View>

        <View style={styles.servings}>
          {foodServingOptions(food.commonServingG).map((grams) => (
            <Pressable
              key={grams}
              style={[styles.servingChip, parsedWeight === grams && styles.servingChipActive]}
              onPress={() => setWeight(String(grams))}
              accessibilityRole="button"
              accessibilityLabel={`选择 ${grams} 克`}
            >
              <Text
                style={[
                  styles.servingChipText,
                  parsedWeight === grams && styles.servingChipTextActive,
                ]}
              >
                {grams}g
              </Text>
            </Pressable>
          ))}
        </View>

        <TextField
          label="自定义重量 (g)"
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          placeholder="例如 150"
          error={submitted && !parsedWeight ? '请输入 0–5000 克之间的有效重量' : undefined}
        />

        <Text style={styles.mealLabel}>记录到</Text>
        <View style={styles.mealRow}>
          {MEALS.map((meal) => (
            <Pressable
              key={meal}
              style={[styles.mealChip, mealType === meal && styles.mealChipActive]}
              onPress={() => setMealType(meal)}
              accessibilityRole="button"
              accessibilityState={{ selected: mealType === meal }}
            >
              <Text style={[styles.mealChipText, mealType === meal && styles.mealChipTextActive]}>
                {mealTypeLabel(meal)}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <View style={styles.note}>
        <Sparkles size={17} color={Colors.primary} />
        <Text style={styles.noteText}>数据为常见食材估算值，烹饪方式和品牌可能带来差异。</Text>
      </View>

      <Button
        title={`添加 ${Math.round(nutrients.calories)} kcal 到${mealTypeLabel(mealType)}`}
        loading={adding}
        disabled={!parsedWeight}
        onPress={() => void onAdd()}
        style={styles.bottomButton}
      />
    </Screen>
  );
}

function Metric({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <View style={styles.metric}>
      <View style={[styles.metricDot, { backgroundColor: color }]} />
      <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.metricUnit}>{unit}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
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
  },
  eyebrow: { ...Typography.label, color: Colors.primary, textTransform: 'uppercase' },
  headerTitle: { ...Typography.h2 },
  hero: {
    padding: Spacing.xxl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: '#DDD6FF',
    ...Shadows.soft,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: { ...Typography.h1 },
  brand: { ...Typography.caption, marginTop: Spacing.xs },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.lg },
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.86)',
  },
  tagText: { ...Typography.captionMedium, color: Colors.primary },
  metrics: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  metric: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingHorizontal: 3,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricDot: { width: 6, height: 6, borderRadius: 3, marginBottom: Spacing.sm },
  metricValue: { ...Typography.numberSm },
  metricUnit: { ...Typography.label, marginTop: 1 },
  metricLabel: { ...Typography.caption, marginTop: Spacing.xs },
  formCard: { marginTop: Spacing.lg },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  smallIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySoft,
  },
  sectionCopy: { flex: 1, marginLeft: Spacing.md },
  sectionTitle: { ...Typography.h3 },
  sectionHint: { ...Typography.caption, marginTop: 2 },
  servings: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  servingChip: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  servingChipActive: { backgroundColor: Colors.primarySoft, borderColor: Colors.primary },
  servingChipText: { ...Typography.captionMedium },
  servingChipTextActive: { color: Colors.primary },
  mealLabel: { ...Typography.captionMedium, color: Colors.textSecondary, marginBottom: Spacing.sm },
  mealRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  mealChip: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
  },
  mealChipActive: { backgroundColor: Colors.primary },
  mealChipText: { ...Typography.captionMedium },
  mealChipTextActive: { color: Colors.white },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  noteText: { ...Typography.caption, flex: 1 },
  bottomButton: { marginTop: Spacing.lg, marginBottom: Spacing.xxl },
});
