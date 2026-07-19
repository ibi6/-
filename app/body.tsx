import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { Button, Card, EmptyState, Screen, SectionHeader, TextField } from '@/components/common';
import { Colors, Spacing, Typography } from '@/theme';
import { useHealthStore, useUserStore } from '@/stores';
import { todayISO } from '@/utils/date';

export default function BodyScreen() {
  const measurements = useHealthStore((s) => s.measurements);
  const isLoading = useHealthStore((s) => s.isLoading);
  const load = useHealthStore((s) => s.load);
  const add = useHealthStore((s) => s.add);
  const remove = useHealthStore((s) => s.remove);
  const latest = useHealthStore((s) => s.latest());
  const profile = useUserStore((s) => s.profile);

  const [weight, setWeight] = useState(String(latest?.weightKg ?? profile?.weightKg ?? ''));
  const [bodyFat, setBodyFat] = useState(latest?.bodyFatPct != null ? String(latest.bodyFatPct) : '');
  const [waist, setWaist] = useState(latest?.waistCm != null ? String(latest.waistCm) : '');
  const [chest, setChest] = useState(latest?.chestCm != null ? String(latest.chestCm) : '');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void load();
  }, [load]);

  const onSave = async () => {
    const w = Number(weight);
    if (!Number.isFinite(w) || w <= 0 || w > 400) {
      Alert.alert('请输入有效体重', '体重需在 0–400 kg 之间');
      return;
    }
    const bf = bodyFat.trim() ? Number(bodyFat) : undefined;
    const waistCm = waist.trim() ? Number(waist) : undefined;
    const chestCm = chest.trim() ? Number(chest) : undefined;
    if (bf != null && (!Number.isFinite(bf) || bf < 0 || bf > 70)) {
      Alert.alert('体脂率无效', '请输入 0–70 之间的数字');
      return;
    }
    setSaving(true);
    try {
      await add({
        date: todayISO(),
        weightKg: w,
        bodyFatPct: bf,
        waistCm: Number.isFinite(waistCm as number) ? waistCm : undefined,
        chestCm: Number.isFinite(chestCm as number) ? chestCm : undefined,
        note: note.trim() || undefined,
      });
      setNote('');
      Alert.alert('已保存', '身体数据已更新');
    } catch {
      Alert.alert('保存失败', '请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const onRemove = (id: string, date: string) => {
    Alert.alert('删除记录', `删除 ${date} 的数据？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => void remove(id) },
    ]);
  };

  const sorted = [...measurements].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Screen loading={isLoading && !measurements.length} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>身体数据</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>返回</Text>
        </Pressable>
      </View>

      <Card style={styles.latest}>
        <Text style={styles.latestLabel}>最新</Text>
        <View style={styles.latestRow}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{latest?.weightKg ?? profile?.weightKg ?? '—'}</Text>
            <Text style={styles.statLabel}>体重 kg</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{latest?.bodyFatPct ?? '—'}</Text>
            <Text style={styles.statLabel}>体脂 %</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{latest?.waistCm ?? '—'}</Text>
            <Text style={styles.statLabel}>腰围 cm</Text>
          </View>
        </View>
      </Card>

      <SectionHeader title="新增记录" />
      <Card>
        <TextField
          label="体重 (kg) *"
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          placeholder="70"
        />
        <TextField
          label="体脂率 (%)"
          value={bodyFat}
          onChangeText={setBodyFat}
          keyboardType="decimal-pad"
          placeholder="可选"
        />
        <TextField
          label="腰围 (cm)"
          value={waist}
          onChangeText={setWaist}
          keyboardType="decimal-pad"
          placeholder="可选"
        />
        <TextField
          label="胸围 (cm)"
          value={chest}
          onChangeText={setChest}
          keyboardType="decimal-pad"
          placeholder="可选"
        />
        <TextField label="备注" value={note} onChangeText={setNote} placeholder="可选" />
        <Button title="保存今日数据" onPress={() => void onSave()} loading={saving} />
      </Card>

      <SectionHeader title="历史记录" />
      {sorted.length === 0 ? (
        <EmptyState title="还没有身体数据" description="记录体重与围度，跟踪变化" />
      ) : (
        sorted.map((m) => (
          <Card key={m.id} style={styles.item}>
            <View style={styles.itemRow}>
              <View style={styles.flex}>
                <Text style={styles.itemDate}>{m.date}</Text>
                <Text style={styles.itemMeta}>
                  {m.weightKg} kg
                  {m.bodyFatPct != null ? ` · 体脂 ${m.bodyFatPct}%` : ''}
                  {m.waistCm != null ? ` · 腰 ${m.waistCm}cm` : ''}
                  {m.chestCm != null ? ` · 胸 ${m.chestCm}cm` : ''}
                </Text>
                {m.note ? <Text style={styles.note}>{m.note}</Text> : null}
              </View>
              <Pressable onPress={() => onRemove(m.id, m.date)} hitSlop={8}>
                <Trash2 size={18} color={Colors.danger} />
              </Pressable>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  title: { ...Typography.h1 },
  back: { ...Typography.captionMedium, color: Colors.primary },
  latest: { marginBottom: Spacing.md, backgroundColor: Colors.primarySoft, borderColor: Colors.primary },
  latestLabel: { ...Typography.label, color: Colors.primary },
  latestRow: { flexDirection: 'row', marginTop: Spacing.md },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { ...Typography.numberSm },
  statLabel: { ...Typography.caption, marginTop: 4 },
  item: { marginBottom: Spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1, paddingRight: Spacing.md },
  itemDate: { ...Typography.bodyMedium },
  itemMeta: { ...Typography.caption, marginTop: 2 },
  note: { ...Typography.label, marginTop: 4 },
});
