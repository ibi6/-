import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Screen } from '@/components/common';
import { Colors, Spacing, Typography } from '@/theme';
import { useSettingsStore } from '@/stores';

export default function SettingsScreen() {
  const units = useSettingsStore((s) => s.units);
  const language = useSettingsStore((s) => s.language);
  const haptics = useSettingsStore((s) => s.haptics);
  const notifications = useSettingsStore((s) => s.notifications);
  const restTimerSound = useSettingsStore((s) => s.restTimerSound);
  const darkMode = useSettingsStore((s) => s.darkMode);
  const update = useSettingsStore((s) => s.update);
  const reset = useSettingsStore((s) => s.reset);

  const onReset = () => {
    Alert.alert('恢复默认设置', '将重置语言、单位与开关选项', [
      { text: '取消', style: 'cancel' },
      { text: '重置', style: 'destructive', onPress: () => reset() },
    ]);
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>设置</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>返回</Text>
        </Pressable>
      </View>

      <Card style={styles.card}>
        <Text style={styles.section}>单位</Text>
        <View style={styles.row}>
          <Seg
            label="公制 (kg/cm)"
            active={units === 'metric'}
            onPress={() => update({ units: 'metric' })}
          />
          <Seg
            label="英制 (lb/in)"
            active={units === 'imperial'}
            onPress={() => update({ units: 'imperial' })}
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.section}>语言</Text>
        <View style={styles.row}>
          <Seg label="中文" active={language === 'zh'} onPress={() => update({ language: 'zh' })} />
          <Seg label="English" active={language === 'en'} onPress={() => update({ language: 'en' })} />
        </View>
        <Text style={styles.hint}>V1 界面文案以中文为主，English 选项已预留</Text>
      </Card>

      <Card style={styles.card}>
        <ToggleRow
          label="触感反馈"
          value={haptics}
          onChange={(v) => update({ haptics: v })}
        />
        <ToggleRow
          label="通知提醒"
          value={notifications}
          onChange={(v) => update({ notifications: v })}
        />
        <ToggleRow
          label="休息计时音效"
          value={restTimerSound}
          onChange={(v) => update({ restTimerSound: v })}
        />
        <ToggleRow
          label="深色模式"
          value={darkMode}
          onChange={(v) => update({ darkMode: v })}
          last
        />
        <Text style={styles.hint}>深色模式 V1 仅保存偏好，完整主题将在后续版本启用</Text>
      </Card>

      <Button title="恢复默认" variant="ghost" onPress={onReset} />
      <Text style={styles.footer}>FitAI V1 · 本地设置 · 数据存于本机</Text>
    </Screen>
  );
}

function Seg({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.seg, active && styles.segOn]} onPress={onPress}>
      <Text style={[styles.segText, active && styles.segTextOn]}>{label}</Text>
    </Pressable>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  last,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.toggleRow, !last && styles.toggleBorder]}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Colors.border, true: Colors.primaryLight }}
        thumbColor={value ? Colors.primary : Colors.surface}
      />
    </View>
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
  card: { marginBottom: Spacing.md },
  section: { ...Typography.captionMedium, color: Colors.textSecondary, marginBottom: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.sm },
  seg: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  segOn: { backgroundColor: Colors.primarySoft, borderColor: Colors.primary },
  segText: { ...Typography.captionMedium },
  segTextOn: { color: Colors.primary },
  hint: { ...Typography.label, marginTop: Spacing.md },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  toggleBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  toggleLabel: { ...Typography.body },
  footer: { ...Typography.label, textAlign: 'center', marginTop: Spacing.xxl },
});
