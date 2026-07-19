import { useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Camera,
  ChevronLeft,
  ImagePlus,
  RefreshCw,
  ScanLine,
  Sparkles,
} from 'lucide-react-native';
import { Button, Card, EmptyState, Screen } from '@/components/common';
import { getFoodById } from '@/data';
import { useChatStore, useNutritionStore } from '@/stores';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/theme';
import type { FoodRecognitionResult, MealType } from '@/types';
import { computeMealFoodNutrients, parseFoodWeight } from '@/utils/nutrition';
import { mealTypeLabel } from '@/utils/date';

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function FoodRecognitionScreen() {
  const params = useLocalSearchParams<{ mealType?: string }>();
  const initialMeal = params.mealType as MealType;
  const [mealType, setMealType] = useState<MealType>(
    MEALS.includes(initialMeal) ? initialMeal : 'lunch',
  );
  const lastRecognition = useChatStore((state) => state.lastRecognition);
  const [result, setResult] = useState<FoodRecognitionResult | null>(lastRecognition);
  const [imageUri, setImageUri] = useState(lastRecognition?.imageUri ?? '');
  const [weights, setWeights] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (lastRecognition?.candidates ?? []).map((candidate) => [
        candidate.foodId,
        String(candidate.suggestedWeightG),
      ]),
    ),
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const isThinking = useChatStore((state) => state.isThinking);
  const error = useChatStore((state) => state.error);
  const recognizeFood = useChatStore((state) => state.recognizeFood);
  const addFoodToMeal = useNutritionStore((state) => state.addFoodToMeal);

  const runRecognition = async (uri: string) => {
    setImageUri(uri);
    setResult(null);
    const next = await recognizeFood(uri);
    if (!next) return;
    setResult(next);
    setWeights(
      Object.fromEntries(
        next.candidates.map((candidate) => [
          candidate.foodId,
          String(candidate.suggestedWeightG),
        ]),
      ),
    );
  };

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      if (Platform.OS !== 'web') {
        const permission =
          source === 'camera'
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            '需要访问权限',
            source === 'camera'
              ? '请在系统设置中允许 FitAI 使用相机。'
              : '请在系统设置中允许 FitAI 读取照片。',
          );
          return;
        }
      }

      const pickerResult =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              quality: 0.8,
              allowsEditing: true,
              aspect: [4, 3],
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: 0.8,
              allowsEditing: true,
              aspect: [4, 3],
            });

      const uri = pickerResult.assets?.[0]?.uri;
      if (!pickerResult.canceled && uri) await runRecognition(uri);
    } catch (pickerError) {
      Alert.alert(
        '无法读取图片',
        pickerError instanceof Error ? pickerError.message : '请稍后重试。',
      );
    }
  };

  const onAdd = async (foodId: string, name: string) => {
    const weight = parseFoodWeight(weights[foodId] ?? '');
    if (!weight) {
      Alert.alert('重量不正确', '请输入 0–5000 克之间的有效重量。');
      return;
    }
    setBusyId(foodId);
    try {
      await addFoodToMeal({ mealType, foodId, weightG: weight });
      Alert.alert('已添加', `「${name}」已记录到${mealTypeLabel(mealType)}`, [
        { text: '继续识别', style: 'cancel' },
        { text: '查看饮食', onPress: () => router.replace('/(tabs)/nutrition') },
      ]);
    } catch (addError) {
      Alert.alert(
        '添加失败',
        addError instanceof Error ? addError.message : '暂时无法保存，请稍后重试。',
      );
    } finally {
      setBusyId(null);
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
        <View style={styles.headerCopy}>
          <View style={styles.titleLine}>
            <Text style={styles.headerTitle}>AI 食物识别</Text>
            <View style={styles.mockBadge}>
              <Text style={styles.mockBadgeText}>MOCK</Text>
            </View>
          </View>
          <Text style={styles.headerHint}>拍照后生成候选与估算份量</Text>
        </View>
      </View>

      {imageUri ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
          <View style={styles.scanningBadge}>
            <ScanLine size={16} color={Colors.white} />
            <Text style={styles.scanningText}>{isThinking ? '识别中…' : '图片已读取'}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.emptyHero}>
          <View style={styles.cameraOrb}>
            <Camera size={34} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>拍下这一餐</Text>
          <Text style={styles.heroText}>保持光线充足，让主要食材完整出现在画面中。</Text>
        </View>
      )}

      <View style={styles.captureActions}>
        <Button
          title="拍照"
          onPress={() => void pickImage('camera')}
          loading={isThinking}
          style={styles.actionButton}
        />
        <Button
          title="从相册选择"
          variant="soft"
          onPress={() => void pickImage('library')}
          disabled={isThinking}
          style={styles.actionButton}
        />
      </View>

      <View style={styles.tipCard}>
        <Sparkles size={17} color={Colors.primary} />
        <Text style={styles.tipText}>
          当前为本地 Mock 演示，识别结果不是医学或精确营养测量，请按实际份量修正。
        </Text>
      </View>

      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorTitle}>这次没有识别成功</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="重新识别"
            variant="soft"
            size="sm"
            disabled={!imageUri || isThinking}
            onPress={() => void runRecognition(imageUri)}
          />
        </Card>
      ) : null}

      {result ? (
        <>
          <View style={styles.resultHeader}>
            <View>
              <Text style={styles.resultTitle}>识别候选</Text>
              <Text style={styles.resultHint}>请选择最接近的一项，并修正重量</Text>
            </View>
            <Pressable
              onPress={() => void runRecognition(imageUri)}
              disabled={isThinking}
              style={styles.retryIcon}
              accessibilityRole="button"
              accessibilityLabel="重新识别当前图片"
            >
              <RefreshCw size={18} color={Colors.primary} />
            </Pressable>
          </View>

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

          {result.candidates.length ? (
            result.candidates.map((candidate, index) => {
              const food = getFoodById(candidate.foodId);
              const weight = parseFoodWeight(weights[candidate.foodId] ?? '');
              const nutrients =
                food && weight
                  ? computeMealFoodNutrients(food.per100g, weight)
                  : { calories: 0, protein: 0, carbs: 0, fat: 0 };
              return (
                <Card key={candidate.foodId} style={styles.candidateCard}>
                  <View style={styles.candidateTop}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.candidateCopy}>
                      <Text style={styles.candidateName}>{candidate.name}</Text>
                      <Text style={styles.confidence}>
                        匹配度 {Math.round(candidate.confidence * 100)}%
                      </Text>
                    </View>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/nutrition/food/[id]',
                          params: { id: candidate.foodId, mealType },
                        })
                      }
                      accessibilityRole="link"
                      accessibilityLabel={`查看${candidate.name}详情`}
                    >
                      <Text style={styles.detailLink}>详情</Text>
                    </Pressable>
                  </View>

                  <View style={styles.weightRow}>
                    <View style={styles.weightField}>
                      <TextInput
                        value={weights[candidate.foodId] ?? ''}
                        onChangeText={(value) =>
                          setWeights((current) => ({ ...current, [candidate.foodId]: value }))
                        }
                        keyboardType="decimal-pad"
                        style={styles.weightInput}
                        accessibilityLabel={`${candidate.name}重量，单位克`}
                      />
                      <Text style={styles.weightUnit}>g</Text>
                    </View>
                    <Text style={styles.nutritionPreview}>
                      {weight ? `${nutrients.calories} kcal · P ${nutrients.protein}g` : '请输入有效重量'}
                    </Text>
                  </View>

                  <Button
                    title={`添加到${mealTypeLabel(mealType)}`}
                    size="sm"
                    loading={busyId === candidate.foodId}
                    disabled={!food || !weight}
                    onPress={() => void onAdd(candidate.foodId, candidate.name)}
                  />
                </Card>
              );
            })
          ) : (
            <EmptyState
              title="没有找到可靠候选"
              description="换个角度重新拍摄，或改用文字搜索。"
              actionLabel="去搜索"
              onAction={() => router.replace('/nutrition/search')}
            />
          )}
        </>
      ) : !isThinking && imageUri && !error ? (
        <View style={styles.waitingCard}>
          <ImagePlus size={22} color={Colors.textMuted} />
          <Text style={styles.waitingText}>选择一张图片后，候选会显示在这里。</Text>
        </View>
      ) : null}
    </Screen>
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
  headerCopy: { flex: 1, minWidth: 0 },
  titleLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.sm },
  headerTitle: { ...Typography.h2 },
  headerHint: { ...Typography.caption, marginTop: 2 },
  mockBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.primarySoft,
  },
  mockBadgeText: { ...Typography.label, color: Colors.primary, fontSize: 10 },
  emptyHero: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: '#DDD6FF',
  },
  cameraOrb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.soft,
  },
  heroTitle: { ...Typography.h2 },
  heroText: { ...Typography.caption, textAlign: 'center', marginTop: Spacing.sm, maxWidth: 280 },
  previewWrap: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: Radius.xl,
    backgroundColor: Colors.border,
    aspectRatio: 4 / 3,
    ...Shadows.soft,
  },
  previewImage: { width: '100%', height: '100%' },
  scanningBadge: {
    position: 'absolute',
    left: Spacing.md,
    bottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(21,22,26,0.74)',
  },
  scanningText: { ...Typography.captionMedium, color: Colors.white },
  captureActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  actionButton: { flex: 1, minWidth: 0, paddingHorizontal: Spacing.md },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: '#F4F1FF',
  },
  tipText: { ...Typography.caption, flex: 1 },
  errorCard: { marginTop: Spacing.lg, borderColor: '#FFD3DA', backgroundColor: '#FFF7F8' },
  errorTitle: { ...Typography.h3, color: Colors.danger },
  errorText: { ...Typography.caption, marginVertical: Spacing.sm },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.md,
  },
  resultTitle: { ...Typography.h2 },
  resultHint: { ...Typography.caption, marginTop: 2 },
  retryIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySoft,
  },
  mealLabel: { ...Typography.captionMedium, color: Colors.textSecondary, marginBottom: Spacing.sm },
  mealRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  mealChip: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mealChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  mealChipText: { ...Typography.captionMedium },
  mealChipTextActive: { color: Colors.white },
  candidateCard: { marginBottom: Spacing.md },
  candidateTop: { flexDirection: 'row', alignItems: 'center' },
  rankBadge: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySoft,
  },
  rankText: { ...Typography.captionMedium, color: Colors.primary },
  candidateCopy: { flex: 1, minWidth: 0, marginLeft: Spacing.md },
  candidateName: { ...Typography.h3 },
  confidence: { ...Typography.caption, color: Colors.success, marginTop: 2 },
  detailLink: { ...Typography.captionMedium, color: Colors.primary, padding: Spacing.sm },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.md,
  },
  weightField: {
    width: 104,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
  },
  weightInput: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  weightUnit: { ...Typography.caption, paddingRight: Spacing.md },
  nutritionPreview: { ...Typography.captionMedium, flex: 1, textAlign: 'right' },
  waitingCard: { alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xxl },
  waitingText: { ...Typography.caption, textAlign: 'center' },
});
