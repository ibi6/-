import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Screen, TextField } from '@/components/common';
import { Colors, Radius, Spacing, Typography } from '@/theme';
import { useNutritionStore } from '@/stores';
import { mealTypeLabel } from '@/utils/date';
import type { FoodItem, MealType } from '@/types';

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function NutritionSearchScreen() {
  const params = useLocalSearchParams<{ mealType?: string }>();
  const initialMeal = (params.mealType as MealType) || 'lunch';
  const [mealType, setMealType] = useState<MealType>(
    MEALS.includes(initialMeal) ? initialMeal : 'lunch',
  );
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [weight, setWeight] = useState('100');
  const [adding, setAdding] = useState(false);

  const searchResults = useNutritionStore((s) => s.searchResults);
  const searchFoods = useNutritionStore((s) => s.searchFoods);
  const clearSearch = useNutritionStore((s) => s.clearSearch);
  const addFoodToMeal = useNutritionStore((s) => s.addFoodToMeal);
  const isLoading = useNutritionStore((s) => s.isLoading);

  useEffect(() => {
    return () => clearSearch();
  }, [clearSearch]);

  useEffect(() => {
    const t = setTimeout(() => {
      void searchFoods(query);
    }, 250);
    return () => clearTimeout(t);
  }, [query, searchFoods]);

  const onPick = (food: FoodItem) => {
    setSelected(food);
    setWeight(String(food.commonServingG ?? 100));
  };

  const onAdd = async () => {
    if (!selected) return;
    const w = Number(weight);
    if (!Number.isFinite(w) || w <= 0) return;
    setAdding(true);
    try {
      await addFoodToMeal({ mealType, foodId: selected.id, weightG: w });
      clearSearch();
      router.back();
    } finally {
      setAdding(false);
    }
  };

  const preview =
    selected && Number(weight) > 0
      ? {
          cal: (selected.per100g.calories * Number(weight)) / 100,
          p: (selected.per100g.protein * Number(weight)) / 100,
          c: (selected.per100g.carbs * Number(weight)) / 100,
          f: (selected.per100g.fat * Number(weight)) / 100,
        }
      : null;

  return (
    <Screen scroll={false} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>搜索食物</Text>
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

        <TextField
          label="关键词"
          value={query}
          onChangeText={setQuery}
          placeholder="鸡胸、鸡蛋、米饭…"
          autoFocus
          returnKeyType="search"
        />

        {selected ? (
          <Card style={styles.selected}>
            <Text style={styles.foodName}>{selected.name}</Text>
            <Text style={styles.foodMeta}>
              每 100g · {Math.round(selected.per100g.calories)} kcal · P
              {Math.round(selected.per100g.protein)} C{Math.round(selected.per100g.carbs)} F
              {Math.round(selected.per100g.fat)}
            </Text>
            <TextField
              label="重量 (g)"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
            />
            {preview ? (
              <Text style={styles.preview}>
                ≈ {Math.round(preview.cal)} kcal · P{Math.round(preview.p)} C{Math.round(preview.c)}{' '}
                F{Math.round(preview.f)}
              </Text>
            ) : null}
            <Button title={`添加到${mealTypeLabel(mealType)}`} onPress={() => void onAdd()} loading={adding} />
            <Button title="重选" variant="ghost" onPress={() => setSelected(null)} />
          </Card>
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(f) => f.id}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.empty}>
                {query.trim()
                  ? isLoading
                    ? '搜索中…'
                    : '没有匹配的食物'
                  : '输入关键词开始搜索'}
              </Text>
            }
            ListHeaderComponent={
              query.trim() && !searchResults.length && isLoading ? (
                <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.lg }} />
              ) : null
            }
            renderItem={({ item }) => (
              <Pressable style={styles.row} onPress={() => onPick(item)}>
                <View style={styles.flex}>
                  <Text style={styles.foodName}>{item.name}</Text>
                  <Text style={styles.foodMeta}>
                    {item.brand ? `${item.brand} · ` : ''}
                    {Math.round(item.per100g.calories)} kcal/100g
                    {item.commonServingG ? ` · 常用 ${item.commonServingG}g` : ''}
                  </Text>
                </View>
                <Text style={styles.add}>添加</Text>
              </Pressable>
            )}
          />
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  foodName: { ...Typography.bodyMedium },
  foodMeta: { ...Typography.caption, marginTop: 2 },
  add: { ...Typography.captionMedium, color: Colors.primary },
  empty: { ...Typography.caption, textAlign: 'center', marginTop: Spacing.xxl },
  selected: { marginTop: Spacing.sm },
  preview: { ...Typography.captionMedium, color: Colors.primary, marginBottom: Spacing.md },
});
