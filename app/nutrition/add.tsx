import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Screen } from '@/components/common';
import { Colors, Radius, Spacing, Typography } from '@/theme';
import { useNutritionStore } from '@/stores';
import { FOODS } from '@/data';
import { mealTypeLabel } from '@/utils/date';
import type { MealType } from '@/types';

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const QUICK_TAGS = ['chicken', 'egg', 'beef', 'salmon', 'rice', 'oat', 'milk', 'veggie', 'fruit'];

export default function NutritionAddScreen() {
  const params = useLocalSearchParams<{ mealType?: string }>();
  const initial = (params.mealType as MealType) || 'lunch';
  const [mealType, setMealType] = useState<MealType>(MEALS.includes(initial) ? initial : 'lunch');
  const [busyId, setBusyId] = useState<string | null>(null);
  const addFoodToMeal = useNutritionStore((s) => s.addFoodToMeal);

  const foods = useMemo(() => {
    const prioritized = FOODS.filter((f) =>
      (f.tags ?? []).some((t) => QUICK_TAGS.includes(t)),
    );
    return (prioritized.length ? prioritized : FOODS).slice(0, 24);
  }, []);

  const onAdd = async (foodId: string, weightG: number, name: string) => {
    setBusyId(foodId);
    try {
      await addFoodToMeal({ mealType, foodId, weightG });
      Alert.alert('已添加', `「${name}」已记入${mealTypeLabel(mealType)}`, [
        { text: '继续添加', style: 'cancel' },
        { text: '完成', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('添加失败', '请稍后重试');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>快捷添加</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancel}>关闭</Text>
        </Pressable>
      </View>

      <View style={styles.mealRow}>
        {MEALS.map((m) => (
          <Pressable
            key={m}
            style={[styles.mealChip, mealType === m && styles.mealChipOn]}
            onPress={() => setMealType(m)}
          >
            <Text style={[styles.mealChipText, mealType === m && styles.mealChipTextOn]}>
              {mealTypeLabel(m)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.hint}>点一下即可按常用份量加入{mealTypeLabel(mealType)}</Text>

      {foods.map((f) => {
        const g = f.commonServingG ?? 100;
        const cal = Math.round((f.per100g.calories * g) / 100);
        return (
          <Card key={f.id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.name}>{f.name}</Text>
                <Text style={styles.meta}>
                  {g}g · {cal} kcal · P{Math.round((f.per100g.protein * g) / 100)}
                </Text>
              </View>
              <Button
                title="添加"
                size="sm"
                fullWidth={false}
                loading={busyId === f.id}
                onPress={() => void onAdd(f.id, g, f.name)}
                style={styles.btn}
              />
            </View>
          </Card>
        );
      })}

      <Button
        title="去搜索更多食物"
        variant="soft"
        onPress={() =>
          router.replace({ pathname: '/nutrition/search', params: { mealType } })
        }
        style={styles.more}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  title: { ...Typography.h2 },
  cancel: { ...Typography.captionMedium, color: Colors.primary },
  mealRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  mealChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  mealChipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  mealChipText: { ...Typography.captionMedium },
  mealChipTextOn: { color: Colors.white },
  hint: { ...Typography.caption, marginBottom: Spacing.lg },
  card: { marginBottom: Spacing.sm, paddingVertical: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1, paddingRight: Spacing.md },
  name: { ...Typography.bodyMedium },
  meta: { ...Typography.caption, marginTop: 2 },
  btn: { minWidth: 72, paddingHorizontal: Spacing.lg },
  more: { marginTop: Spacing.xl, marginBottom: Spacing.xxl },
});
