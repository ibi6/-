import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Plus, Trash2 } from 'lucide-react-native';
import {
  Button,
  Card,
  EmptyState,
  MacroRing,
  ProgressBar,
  Screen,
  SectionHeader,
} from '@/components/common';
import { Colors, Radius, Spacing, Typography } from '@/theme';
import { useNutritionStore } from '@/stores';
import { mealTypeLabel, addDays, todayISO } from '@/utils/date';
import type { MealType } from '@/types';

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function NutritionTab() {
  const selectedDate = useNutritionStore((s) => s.selectedDate);
  const summary = useNutritionStore((s) => s.summary);
  const meals = useNutritionStore((s) => s.meals);
  const targets = useNutritionStore((s) => s.targets);
  const isLoading = useNutritionStore((s) => s.isLoading);
  const setDate = useNutritionStore((s) => s.setDate);
  const removeMealFood = useNutritionStore((s) => s.removeMealFood);
  const deleteMeal = useNutritionStore((s) => s.deleteMeal);

  const byType = useMemo(() => {
    const map = new Map<MealType, typeof meals>();
    for (const t of MEAL_ORDER) map.set(t, []);
    for (const m of meals) {
      const list = map.get(m.mealType) ?? [];
      list.push(m);
      map.set(m.mealType, list);
    }
    return map;
  }, [meals]);

  const shiftDate = (delta: number) => setDate(addDays(selectedDate, delta));

  const onRemoveFood = (mealId: string, foodId: string, name: string) => {
    Alert.alert('删除食物', `移除「${name}」？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => void removeMealFood(mealId, foodId) },
    ]);
  };

  return (
    <Screen loading={isLoading && !summary}>
      <Text style={styles.title}>饮食</Text>

      <View style={styles.dateRow}>
        <Pressable onPress={() => shiftDate(-1)} hitSlop={8}>
          <Text style={styles.dateNav}>‹ 前一天</Text>
        </Pressable>
        <Pressable onPress={() => setDate(todayISO())}>
          <Text style={styles.dateCenter}>{selectedDate}</Text>
        </Pressable>
        <Pressable onPress={() => shiftDate(1)} hitSlop={8}>
          <Text style={styles.dateNav}>后一天 ›</Text>
        </Pressable>
      </View>

      <Card>
        <View style={styles.calRow}>
          <View>
            <Text style={styles.calValue}>{Math.round(summary?.consumed.calories ?? 0)}</Text>
            <Text style={styles.calLabel}>已摄入 / {targets.calories} kcal</Text>
          </View>
          {(() => {
            const remain = Math.round(summary?.remaining.calories ?? targets.calories);
            const over = remain < 0;
            return (
              <Text style={[styles.remain, over && styles.remainOver]}>
                {over ? `已超 ${Math.abs(remain)}` : `剩余 ${remain}`}
              </Text>
            );
          })()}
        </View>
        <ProgressBar progress={summary?.progress.calories ?? 0} color={Colors.calorie} style={styles.bar} />
        {(summary?.progress.calories ?? 0) > 1 ? (
          <Text style={styles.overHint}>今日热量已超过目标，可适当减少下一餐份量或增加活动量</Text>
        ) : null}
        <View style={styles.macroRow}>
          <MacroRing label="蛋白" value={summary?.consumed.protein ?? 0} target={targets.protein} color={Colors.protein} />
          <MacroRing label="碳水" value={summary?.consumed.carbs ?? 0} target={targets.carbs} color={Colors.carbs} />
          <MacroRing label="脂肪" value={summary?.consumed.fat ?? 0} target={targets.fat} color={Colors.fat} />
        </View>
      </Card>

      <View style={styles.actions}>
        <Button title="搜索添加食物" onPress={() => router.push('/nutrition/search')} style={styles.flex} />
        <Button title="快捷添加" variant="soft" onPress={() => router.push('/nutrition/add')} style={styles.flex} />
      </View>

      {MEAL_ORDER.map((type) => {
        const list = byType.get(type) ?? [];
        const foods = list.flatMap((m) => m.foods.map((f) => ({ ...f, mealId: m.id })));
        const mealCal = foods.reduce((s, f) => s + f.calories, 0);
        return (
          <View key={type}>
            <SectionHeader
              title={`${mealTypeLabel(type)} · ${Math.round(mealCal)} kcal`}
              actionLabel="添加"
              onAction={() => router.push({ pathname: '/nutrition/search', params: { mealType: type } })}
            />
            {foods.length === 0 ? (
              <Card style={styles.emptyMeal}>
                <Text style={styles.emptyText}>还没有记录</Text>
                <Pressable
                  style={styles.addChip}
                  onPress={() => router.push({ pathname: '/nutrition/search', params: { mealType: type } })}
                >
                  <Plus size={16} color={Colors.primary} />
                  <Text style={styles.addChipText}>添加</Text>
                </Pressable>
              </Card>
            ) : (
              list.map((meal) => (
                <Card key={meal.id} style={styles.mealCard}>
                  {meal.foods.map((f) => (
                    <View key={f.id} style={styles.foodRow}>
                      <View style={styles.foodInfo}>
                        <Text style={styles.foodName}>{f.name}</Text>
                        <Text style={styles.foodMeta}>
                          {f.weightG}g · {Math.round(f.calories)} kcal · P{Math.round(f.protein)} C
                          {Math.round(f.carbs)} F{Math.round(f.fat)}
                        </Text>
                      </View>
                      <Pressable onPress={() => onRemoveFood(meal.id, f.id, f.name)} hitSlop={8}>
                        <Trash2 size={18} color={Colors.danger} />
                      </Pressable>
                    </View>
                  ))}
                  {meal.foods.length > 0 ? (
                    <Pressable
                      onPress={() =>
                        Alert.alert('删除整餐', `删除${mealTypeLabel(type)}全部记录？`, [
                          { text: '取消', style: 'cancel' },
                          { text: '删除', style: 'destructive', onPress: () => void deleteMeal(meal.id) },
                        ])
                      }
                    >
                      <Text style={styles.deleteMeal}>删除整餐</Text>
                    </Pressable>
                  ) : null}
                </Card>
              ))
            )}
          </View>
        );
      })}

      {meals.length === 0 ? (
        <EmptyState
          title="今天还没吃什么？"
          description="搜索食物或用 AI 识别添加"
          actionLabel="去添加"
          onAction={() => router.push('/nutrition/search')}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...Typography.h1, marginTop: Spacing.md, marginBottom: Spacing.md },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  dateNav: { ...Typography.captionMedium, color: Colors.primary },
  dateCenter: { ...Typography.bodyMedium },
  calRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  calValue: { ...Typography.number },
  calLabel: { ...Typography.caption },
  remain: { ...Typography.bodyMedium, color: Colors.primary },
  remainOver: { color: Colors.danger },
  overHint: { ...Typography.caption, color: Colors.warning, marginBottom: Spacing.sm },
  bar: { marginVertical: Spacing.md },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: Spacing.sm },
  actions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  flex: { flex: 1 },
  emptyMeal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  emptyText: { ...Typography.caption },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  addChipText: { ...Typography.captionMedium, color: Colors.primary },
  mealCard: { marginBottom: Spacing.sm },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  foodInfo: { flex: 1, paddingRight: Spacing.md },
  foodName: { ...Typography.bodyMedium },
  foodMeta: { ...Typography.caption, marginTop: 2 },
  deleteMeal: { ...Typography.caption, color: Colors.danger, marginTop: Spacing.sm, textAlign: 'right' },
});
