import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CheckCircle2, ChevronLeft, ShieldAlert } from 'lucide-react-native';
import { Button, Card, Screen } from '@/components/common';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/theme';
import { clearActivityData } from '@/stores';

export default function SettingsScreen() {
  const [clearing, setClearing] = useState(false);

  const onClearActivity = () => {
    Alert.alert(
      '清除健康与活动数据？',
      '将永久删除训练、饮食、身体记录和 AI 对话。登录状态、基础资料与界面设置会保留，此操作无法撤销。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认清除',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            try {
              await clearActivityData();
              setClearing(false);
              Alert.alert('已清除', '健康与活动数据已从本机删除。', [
                { text: '完成', onPress: () => router.replace('/(tabs)') },
              ]);
            } catch {
              setClearing(false);
              Alert.alert('清除失败', '本地存储暂时不可用，请稍后重试。');
            }
          },
        },
      ],
    );
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
          <Text style={styles.eyebrow}>偏好与隐私</Text>
          <Text style={styles.title}>设置</Text>
        </View>
      </View>

      <Card style={styles.card}>
        <Text style={styles.section}>当前版本</Text>
        <StatusRow label="界面语言" value="简体中文" />
        <StatusRow label="计量单位" value="公制 · kg / cm" />
        <StatusRow label="外观主题" value="浅色界面" last />
        <Text style={styles.hint}>V2 仅展示已完整支持的选项，不会保存无效偏好。</Text>
      </Card>

      <Card style={styles.privacyCard}>
        <View style={styles.privacyHeader}>
          <View style={styles.privacyIcon}>
            <CheckCircle2 size={21} color={Colors.success} />
          </View>
          <View style={styles.privacyCopy}>
            <Text style={styles.privacyTitle}>数据仅保存在本机</Text>
            <Text style={styles.privacyText}>
              当前为 Mock 演示，没有真实云同步；删除后无法从服务器恢复。
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.dangerCard}>
        <View style={styles.dangerHeader}>
          <View style={styles.dangerIcon}>
            <ShieldAlert size={21} color={Colors.danger} />
          </View>
          <View style={styles.dangerCopy}>
            <Text style={styles.dangerTitle}>健康与活动数据</Text>
            <Text style={styles.dangerText}>
              清除训练、饮食、身体和 AI 对话；保留账号资料与当前设置。
            </Text>
          </View>
        </View>
        <Button
          title="清除健康与活动数据"
          variant="danger"
          loading={clearing}
          onPress={onClearActivity}
          accessibilityHint="确认后删除健康与活动数据"
        />
      </Card>

      <Text style={styles.footer}>FitAI V2 · 本地 Mock · 无真实云同步</Text>
    </Screen>
  );
}

function StatusRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.statusRow, !last && styles.statusBorder]}>
      <Text style={styles.statusLabel}>{label}</Text>
      <View style={styles.valuePill}>
        <Text style={styles.statusValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
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
    ...Shadows.soft,
  },
  eyebrow: { ...Typography.label, color: Colors.primary, marginBottom: 2 },
  title: { ...Typography.h2 },
  card: { marginBottom: Spacing.md },
  section: { ...Typography.h3, marginBottom: Spacing.sm },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  statusBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  statusLabel: { ...Typography.body, color: Colors.textSecondary },
  valuePill: {
    maxWidth: '62%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.primarySoft,
  },
  statusValue: { ...Typography.captionMedium, color: Colors.primary, textAlign: 'right' },
  hint: { ...Typography.caption, marginTop: Spacing.md },
  privacyCard: { marginBottom: Spacing.md, borderColor: '#CBEFDF', backgroundColor: '#F5FCF9' },
  privacyHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  privacyIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E4F8EF',
  },
  privacyCopy: { flex: 1, minWidth: 0, marginLeft: Spacing.md },
  privacyTitle: { ...Typography.bodyMedium, color: Colors.success },
  privacyText: { ...Typography.caption, marginTop: Spacing.xs },
  dangerCard: { marginTop: Spacing.sm, borderColor: '#FFD3DA', backgroundColor: '#FFF8F9' },
  dangerHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.lg },
  dangerIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE9ED',
  },
  dangerCopy: { flex: 1, minWidth: 0, marginLeft: Spacing.md },
  dangerTitle: { ...Typography.bodyMedium, color: Colors.danger },
  dangerText: { ...Typography.caption, marginTop: Spacing.xs },
  footer: { ...Typography.label, textAlign: 'center', marginTop: Spacing.xxl },
});
