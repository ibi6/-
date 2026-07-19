import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Chip, Screen, TextField } from '@/components/common';
import { Colors, Spacing, Typography } from '@/theme';
import { useAuthStore, useUserStore } from '@/stores';
import { defaultTargets } from '@/utils/nutrition';
import { useNutritionStore } from '@/stores';
import type { Equipment, ExperienceLevel, Gender, Goal, UserProfile } from '@/types';

const GOALS: { id: Goal; label: string }[] = [
  { id: 'lose_fat', label: '减脂' },
  { id: 'build_muscle', label: '增肌' },
  { id: 'keep_fit', label: '保持健康' },
  { id: 'improve_endurance', label: '提升耐力' },
];

const EXP: { id: ExperienceLevel; label: string }[] = [
  { id: 'beginner', label: '新手' },
  { id: 'intermediate', label: '中级' },
  { id: 'advanced', label: '进阶' },
];

const EQ: { id: Equipment; label: string }[] = [
  { id: 'none', label: '徒手' },
  { id: 'dumbbells', label: '哑铃' },
  { id: 'home_basic', label: '家庭器械' },
  { id: 'full_gym', label: '全健身房' },
];

const GENDERS: { id: Gender; label: string }[] = [
  { id: 'male', label: '男' },
  { id: 'female', label: '女' },
  { id: 'other', label: '其他' },
  { id: 'prefer_not_say', label: '不愿透露' },
];

export default function OnboardingScreen() {
  const authUser = useAuthStore((s) => s.user);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const setTargets = useNutritionStore((s) => s.setTargets);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(authUser?.name ?? '');
  const [gender, setGender] = useState<Gender>('prefer_not_say');
  const [heightCm, setHeightCm] = useState('170');
  const [weightKg, setWeightKg] = useState('65');
  const [goal, setGoal] = useState<Goal>('keep_fit');
  const [experience, setExperience] = useState<ExperienceLevel>('beginner');
  const [equipment, setEquipment] = useState<Equipment>('none');
  const [days, setDays] = useState('3');

  const finish = async () => {
    setLoading(true);
    try {
      const h = Number(heightCm) || 170;
      const w = Number(weightKg) || 65;
      const now = new Date().toISOString();
      const profile: UserProfile = {
        id: authUser?.id ?? 'user_local',
        name: name.trim() || '健身者',
        email: authUser?.email ?? '',
        gender,
        heightCm: h,
        weightKg: w,
        goal,
        experience,
        equipment,
        trainingDaysPerWeek: Math.min(7, Math.max(1, Number(days) || 3)),
        onboardingCompleted: true,
        createdAt: now,
        updatedAt: now,
      };
      await completeOnboarding(profile);
      setTargets(defaultTargets(w, goal));
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.step}>步骤 {step + 1} / 3</Text>
      <Text style={styles.title}>
        {step === 0 ? '认识你' : step === 1 ? '你的目标' : '训练条件'}
      </Text>

      {step === 0 ? (
        <>
          <TextField label="昵称" value={name} onChangeText={setName} placeholder="怎么称呼你" />
          <Text style={styles.label}>性别</Text>
          <View style={styles.row}>
            {GENDERS.map((g) => (
              <Chip key={g.id} label={g.label} selected={gender === g.id} onPress={() => setGender(g.id)} />
            ))}
          </View>
          <TextField label="身高 (cm)" keyboardType="numeric" value={heightCm} onChangeText={setHeightCm} />
          <TextField label="体重 (kg)" keyboardType="numeric" value={weightKg} onChangeText={setWeightKg} />
        </>
      ) : null}

      {step === 1 ? (
        <>
          <Text style={styles.label}>主要目标</Text>
          <View style={styles.row}>
            {GOALS.map((g) => (
              <Chip key={g.id} label={g.label} selected={goal === g.id} onPress={() => setGoal(g.id)} />
            ))}
          </View>
          <Text style={styles.label}>经验水平</Text>
          <View style={styles.row}>
            {EXP.map((g) => (
              <Chip key={g.id} label={g.label} selected={experience === g.id} onPress={() => setExperience(g.id)} />
            ))}
          </View>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <Text style={styles.label}>可用器械</Text>
          <View style={styles.row}>
            {EQ.map((g) => (
              <Chip key={g.id} label={g.label} selected={equipment === g.id} onPress={() => setEquipment(g.id)} />
            ))}
          </View>
          <TextField
            label="每周训练天数"
            keyboardType="numeric"
            value={days}
            onChangeText={setDays}
            hint="1–7 天"
          />
        </>
      ) : null}

      <View style={styles.actions}>
        {step > 0 ? (
          <Button title="上一步" variant="secondary" onPress={() => setStep((s) => s - 1)} fullWidth={false} style={styles.half} />
        ) : null}
        {step < 2 ? (
          <Button title="下一步" onPress={() => setStep((s) => s + 1)} fullWidth={step === 0} style={step > 0 ? styles.half : undefined} />
        ) : (
          <Button title="完成并进入" loading={loading} onPress={finish} fullWidth={false} style={styles.half} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  step: { ...Typography.label, marginTop: Spacing.xl, color: Colors.primary },
  title: { ...Typography.h1, marginBottom: Spacing.xxl, marginTop: Spacing.sm },
  label: { ...Typography.captionMedium, marginBottom: Spacing.sm, color: Colors.textSecondary },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.lg },
  actions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  half: { flex: 1 },
});
