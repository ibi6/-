import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Crown, Check } from 'lucide-react-native';
import { Button, Card, Screen } from '@/components/common';
import { Colors, Radius, Spacing, Typography } from '@/theme';
import { useSubscriptionStore } from '@/stores';
import { AppConfig } from '@/constants';

const PRO_FEATURES = [
  '无限 AI 对话（免费版每日限额）',
  '高级训练计划模板',
  '营养目标自定义与历史分析',
  '身体数据导出（预留）',
  '优先体验新功能',
];

export default function SubscriptionScreen() {
  const plan = useSubscriptionStore((s) => s.plan);
  const isActive = useSubscriptionStore((s) => s.isActive);
  const expiresAt = useSubscriptionStore((s) => s.expiresAt);
  const trialUsed = useSubscriptionStore((s) => s.trialUsed);
  const upgradeMock = useSubscriptionStore((s) => s.upgradeMock);
  const restoreMock = useSubscriptionStore((s) => s.restoreMock);
  const cancelMock = useSubscriptionStore((s) => s.cancelMock);

  const expiresLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  const onUpgrade = (p: 'pro_monthly' | 'pro_yearly') => {
    Alert.alert(
      '模拟开通 Pro',
      p === 'pro_yearly' ? '将模拟开通年度会员（365 天）' : '将模拟开通月度会员（30 天）',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认开通',
          onPress: () => {
            upgradeMock(p);
            Alert.alert('开通成功', '这是本地 Mock，未产生真实扣款');
          },
        },
      ],
    );
  };

  const onRestore = () => {
    restoreMock();
    Alert.alert('恢复成功', '已模拟恢复月度 Pro 订阅');
  };

  const onCancel = () => {
    Alert.alert('取消订阅', '将回到 Free 方案（Mock）', [
      { text: '再想想', style: 'cancel' },
      {
        text: '确认取消',
        style: 'destructive',
        onPress: () => {
          cancelMock();
          Alert.alert('已取消', '当前为 Free 方案');
        },
      },
    ]);
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>订阅</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>关闭</Text>
        </Pressable>
      </View>

      <Card style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={styles.crown}>
            <Crown size={22} color={isActive ? Colors.warning : Colors.textMuted} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.statusTitle}>{isActive ? 'Pro 会员' : 'Free 方案'}</Text>
            <Text style={styles.statusMeta}>
              {isActive
                ? `计划 ${plan === 'pro_yearly' ? '年度' : '月度'}${expiresLabel ? ` · 至 ${expiresLabel}` : ''}`
                : `AI 每日 ${AppConfig.freeAiMessagesPerDay} 次 · ${trialUsed ? '已试用过 Pro' : '可体验 Pro'}`}
            </Text>
          </View>
        </View>
      </Card>

      <Text style={styles.section}>Pro 权益</Text>
      <Card>
        {PRO_FEATURES.map((f) => (
          <View key={f} style={styles.feature}>
            <Check size={16} color={Colors.success} />
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </Card>

      {!isActive ? (
        <>
          <Card style={styles.planCard} onPress={() => onUpgrade('pro_monthly')}>
            <Text style={styles.planName}>月度 Pro</Text>
            <Text style={styles.planPrice}>¥28 / 月</Text>
            <Text style={styles.planHint}>模拟开通 30 天</Text>
            <Button title="开通月度" onPress={() => onUpgrade('pro_monthly')} style={styles.planBtn} />
          </Card>
          <Card style={[styles.planCard, styles.planYear]} onPress={() => onUpgrade('pro_yearly')}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>更划算</Text>
            </View>
            <Text style={styles.planName}>年度 Pro</Text>
            <Text style={styles.planPrice}>¥198 / 年</Text>
            <Text style={styles.planHint}>模拟开通 365 天 · 约 ¥16.5/月</Text>
            <Button title="开通年度" onPress={() => onUpgrade('pro_yearly')} style={styles.planBtn} />
          </Card>
        </>
      ) : (
        <Button title="取消订阅（Mock）" variant="danger" onPress={onCancel} style={styles.mt} />
      )}

      <Button title="恢复购买（Mock）" variant="soft" onPress={onRestore} style={styles.mt} />
      <Text style={styles.disclaimer}>
        本页为演示用 Mock 订阅，不会连接真实支付渠道，也不会产生费用。正式版将接入 App Store / 应用内购。
      </Text>
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
  statusCard: { marginBottom: Spacing.lg, backgroundColor: Colors.primarySoft, borderColor: Colors.primary },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  crown: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  flex: { flex: 1 },
  statusTitle: { ...Typography.h3 },
  statusMeta: { ...Typography.caption, marginTop: 2 },
  section: { ...Typography.h3, marginBottom: Spacing.md },
  feature: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  featureText: { ...Typography.body, flex: 1 },
  planCard: { marginTop: Spacing.md },
  planYear: { borderColor: Colors.primary },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 2,
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
  },
  badgeText: { ...Typography.label, color: Colors.white },
  planName: { ...Typography.bodyMedium },
  planPrice: { ...Typography.h2, color: Colors.primary, marginTop: 4 },
  planHint: { ...Typography.caption, marginTop: 4, marginBottom: Spacing.md },
  planBtn: { marginTop: Spacing.sm },
  mt: { marginTop: Spacing.lg },
  disclaimer: { ...Typography.label, textAlign: 'center', marginTop: Spacing.xxl, marginBottom: Spacing.xl },
});
