import type { FoodItem } from '@/types';

export const FOODS: FoodItem[] = [
  {
    id: 'food_chicken',
    name: '鸡胸肉',
    per100g: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    commonServingG: 150,
    tags: ['高蛋白', '减脂'],
  },
  {
    id: 'food_egg',
    name: '鸡蛋',
    per100g: { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
    commonServingG: 50,
    tags: ['早餐', '高蛋白'],
  },
  {
    id: 'food_beef',
    name: '牛肉',
    per100g: { calories: 250, protein: 26, carbs: 0, fat: 15 },
    commonServingG: 120,
    tags: ['高蛋白'],
  },
  {
    id: 'food_salmon',
    name: '三文鱼',
    per100g: { calories: 208, protein: 20, carbs: 0, fat: 13 },
    commonServingG: 120,
    tags: ['优质脂肪', '高蛋白'],
  },
  {
    id: 'food_rice',
    name: '米饭',
    per100g: { calories: 116, protein: 2.6, carbs: 26, fat: 0.3 },
    commonServingG: 200,
    tags: ['碳水'],
  },
  {
    id: 'food_brown_rice',
    name: '糙米',
    per100g: { calories: 111, protein: 2.6, carbs: 23, fat: 0.9 },
    commonServingG: 180,
    tags: ['碳水', '全谷物'],
  },
  {
    id: 'food_noodle',
    name: '面条',
    per100g: { calories: 138, protein: 4.5, carbs: 28, fat: 0.5 },
    commonServingG: 200,
    tags: ['碳水'],
  },
  {
    id: 'food_oat',
    name: '燕麦',
    per100g: { calories: 389, protein: 17, carbs: 66, fat: 7 },
    commonServingG: 40,
    tags: ['早餐', '碳水'],
  },
  {
    id: 'food_bread',
    name: '全麦面包',
    per100g: { calories: 247, protein: 13, carbs: 41, fat: 3.4 },
    commonServingG: 60,
    tags: ['碳水', '早餐'],
  },
  {
    id: 'food_sweet_potato',
    name: '红薯',
    per100g: { calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
    commonServingG: 200,
    tags: ['碳水'],
  },
  {
    id: 'food_potato',
    name: '土豆',
    per100g: { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
    commonServingG: 200,
    tags: ['碳水'],
  },
  {
    id: 'food_banana',
    name: '香蕉',
    per100g: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
    commonServingG: 120,
    tags: ['水果', '训练前后'],
  },
  {
    id: 'food_apple',
    name: '苹果',
    per100g: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
    commonServingG: 180,
    tags: ['水果'],
  },
  {
    id: 'food_milk',
    name: '牛奶',
    per100g: { calories: 54, protein: 3.3, carbs: 5, fat: 2.5 },
    commonServingG: 250,
    tags: ['乳制品'],
  },
  {
    id: 'food_yogurt',
    name: '酸奶',
    per100g: { calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3 },
    commonServingG: 150,
    tags: ['乳制品', '早餐'],
  },
  {
    id: 'food_broccoli',
    name: '西兰花',
    per100g: { calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
    commonServingG: 150,
    tags: ['蔬菜'],
  },
  {
    id: 'food_lettuce',
    name: '生菜',
    per100g: { calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
    commonServingG: 100,
    tags: ['蔬菜'],
  },
  {
    id: 'food_tomato',
    name: '番茄',
    per100g: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
    commonServingG: 150,
    tags: ['蔬菜'],
  },
  {
    id: 'food_avocado',
    name: '牛油果',
    per100g: { calories: 160, protein: 2, carbs: 9, fat: 15 },
    commonServingG: 80,
    tags: ['优质脂肪'],
  },
  {
    id: 'food_pb',
    name: '花生酱',
    per100g: { calories: 588, protein: 25, carbs: 20, fat: 50 },
    commonServingG: 20,
    tags: ['优质脂肪', '加餐'],
  },
  {
    id: 'food_nuts',
    name: '坚果',
    per100g: { calories: 607, protein: 20, carbs: 21, fat: 54 },
    commonServingG: 25,
    tags: ['优质脂肪', '加餐'],
  },
  {
    id: 'food_tofu',
    name: '豆腐',
    per100g: { calories: 76, protein: 8, carbs: 1.9, fat: 4.8 },
    commonServingG: 150,
    tags: ['高蛋白', '素食'],
  },
  {
    id: 'food_shrimp',
    name: '虾',
    per100g: { calories: 99, protein: 24, carbs: 0.2, fat: 0.3 },
    commonServingG: 100,
    tags: ['高蛋白'],
  },
  {
    id: 'food_tuna',
    name: '金枪鱼',
    per100g: { calories: 132, protein: 28, carbs: 0, fat: 1.3 },
    commonServingG: 100,
    tags: ['高蛋白'],
  },
  {
    id: 'food_corn',
    name: '玉米',
    per100g: { calories: 86, protein: 3.3, carbs: 19, fat: 1.2 },
    commonServingG: 150,
    tags: ['碳水'],
  },
  {
    id: 'food_blueberry',
    name: '蓝莓',
    per100g: { calories: 57, protein: 0.7, carbs: 14, fat: 0.3 },
    commonServingG: 80,
    tags: ['水果'],
  },
  {
    id: 'food_whey',
    name: '蛋白粉',
    per100g: { calories: 400, protein: 80, carbs: 8, fat: 5 },
    commonServingG: 30,
    tags: ['高蛋白', '补剂'],
  },
  {
    id: 'food_milk_tea',
    name: '奶茶',
    per100g: { calories: 80, protein: 1, carbs: 14, fat: 2.5 },
    commonServingG: 400,
    tags: ['饮品', '放纵餐'],
  },
  {
    id: 'food_hotpot',
    name: '火锅',
    per100g: { calories: 180, protein: 12, carbs: 8, fat: 11 },
    commonServingG: 400,
    tags: ['外食', '混合'],
  },
  {
    id: 'food_beef_noodle',
    name: '牛肉面',
    per100g: { calories: 120, protein: 6, carbs: 16, fat: 3.5 },
    commonServingG: 500,
    tags: ['外食', '正餐'],
  },
  {
    id: 'food_greek_yogurt',
    name: '希腊酸奶',
    per100g: { calories: 97, protein: 9, carbs: 3.6, fat: 5 },
    commonServingG: 150,
    tags: ['高蛋白', '乳制品'],
  },
  {
    id: 'food_quinoa',
    name: '藜麦',
    per100g: { calories: 120, protein: 4.4, carbs: 21, fat: 1.9 },
    commonServingG: 150,
    tags: ['碳水', '全谷物'],
  },
];

export function getFoodById(id: string): FoodItem | undefined {
  return FOODS.find((f) => f.id === id);
}

export function searchFoods(query: string): FoodItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return FOODS.slice(0, 20);
  return FOODS.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.tags?.some((t) => t.toLowerCase().includes(q)),
  );
}
