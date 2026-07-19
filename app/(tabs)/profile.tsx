import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  ChevronRight,
  Settings,
  Crown,
  Activity,
  LogOut,
  User as UserIcon,
} from 'lucide-react-native';
import { Card, Screen } from '@/components/common';
import { Colors, Radius, Spacing, Typography } from '@/theme';
import {
  useAuthStore,
  useUserStore,
  useSubscriptionStore,
  useHealthStore,
} from '@/stores';
import { experienceLabel, goalLabel } from '@/utils/date';

export default function ProfileTab() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const profile = useUserStore((s) => s.profile);
  const plan = useSubscriptionStore((s) => s.plan);
  const isActive = useSubscriptionStore((s) => s.isActive);
  const latest = useHealthStore((s) => s.latest());

  const onLogout = () => {
    Alert.alert('退出登录', '确定退出当前账号？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <Screen>
      <Text style={styles.title}>我的</Text>

      <Card style={styles.profileCard}>
        <View style={styles.avatar}>
          <UserIcon size={28} color={Colors.primary} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{profile?.name ?? user?.name ?? '用户'}</Text>
          <Text style={styles.email}>{profile?.email ?? user?.email ?? ''}</Text>
          {profile ? (
            <Text style={styles.meta}>
              {goalLabel(profile.goal)} · {experienceLabel(profile.experience)} ·{' '}
              {profile.heightCm}cm / {profile.weightKg}kg
            </Text>
          ) : null}
        </View>
      </Card>

      <Card style={styles.statCard}>
        <View style={styles.statItem}>
          <Text style={styles.statVal}>{latest?.weightKg ?? profile?.weightKg ?? '—'}</Text>
          <Text style={styles.statLabel}>体重 kg</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statVal}>{profile?.trainingDaysPerWeek ?? '—'}</Text>
          <Text style={styles.statLabel}>每周训练</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statVal}>{isActive ? 'Pro' : 'Free'}</Text>
          <Text style={styles.statLabel}>会员</Text>
        </View>
      </Card>

      <View style={styles.menu}>
        <MenuRow
          icon={<Activity size={20} color={Colors.success} />}
          label="身体数据"
          onPress={() => router.push('/body')}
        />
        <MenuRow
          icon={<Crown size={20} color={Colors.warning} />}
          label={isActive ? `订阅管理（${plan}）` : '升级 Pro'}
          onPress={() => router.push('/subscription')}
        />
        <MenuRow
          icon={<Settings size={20} color={Colors.textSecondary} />}
          label="设置"
          onPress={() => router.push('/settings')}
        />
        <MenuRow
          icon={<LogOut size={20} color={Colors.danger} />}
          label="退出登录"
          danger
          onPress={onLogout}
        />
      </View>

      <Text style={styles.footer}>FitAI V1 · 本地 Mock 演示 · 非医疗建议</Text>
    </Screen>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress}>
      <View style={styles.menuLeft}>
        {icon}
        <Text style={[styles.menuLabel, danger && { color: Colors.danger }]}>{label}</Text>
      </View>
      <ChevronRight size={18} color={Colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { ...Typography.h1, marginTop: Spacing.md, marginBottom: Spacing.lg },
  profileCard: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  profileInfo: { flex: 1 },
  name: { ...Typography.h3 },
  email: { ...Typography.caption, marginTop: 2 },
  meta: { ...Typography.label, marginTop: Spacing.xs },
  statCard: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { ...Typography.numberSm },
  statLabel: { ...Typography.caption, marginTop: 4 },
  divider: { width: 1, backgroundColor: Colors.border },
  menu: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  menuLabel: { ...Typography.bodyMedium },
  footer: { ...Typography.label, textAlign: 'center', marginTop: Spacing.xxxl },
});
