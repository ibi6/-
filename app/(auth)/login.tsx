import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Screen, TextField } from '@/components/common';
import { Colors, Spacing, Typography } from '@/theme';
import { useAuthStore, useUserStore } from '@/stores';
import { loginSchema, type LoginForm } from '@/validators/auth';

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const hydrateDemo = useAuthStore((s) => s.hydrateDemo);
  const loadProfile = useUserStore((s) => s.loadProfile);
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'demo@fitai.app', password: 'demo1234' },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      await loadProfile();
      router.replace('/');
    } catch {
      Alert.alert('登录失败', '请检查邮箱或密码');
    } finally {
      setLoading(false);
    }
  };

  const onDemo = async () => {
    setLoading(true);
    try {
      await hydrateDemo();
      await loadProfile();
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <LinearGradient colors={[Colors.primarySoft, Colors.background]} style={styles.hero}>
        <Text style={styles.brand}>FitAI</Text>
        <Text style={styles.tagline}>智能健身 · 精准饮食</Text>
      </LinearGradient>

      <Text style={styles.title}>欢迎回来</Text>
      <Text style={styles.sub}>登录后同步你的训练与营养计划</Text>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="邮箱"
            autoCapitalize="none"
            keyboardType="email-address"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.email?.message}
            placeholder="you@example.com"
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="密码"
            secureTextEntry
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.password?.message}
            placeholder="至少 6 位"
          />
        )}
      />

      <Button title="登录" loading={loading} onPress={handleSubmit(onSubmit)} />
      <View style={styles.gap} />
      <Button title="一键体验 Demo 账号" variant="soft" loading={loading} onPress={onDemo} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>还没有账号？</Text>
        <Link href="/(auth)/register" asChild>
          <Pressable>
            <Text style={styles.link}>注册</Text>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 24,
    padding: Spacing.xxl,
    marginBottom: Spacing.xxl,
    marginTop: Spacing.lg,
  },
  brand: { ...Typography.h1, color: Colors.primary, fontSize: 36 },
  tagline: { ...Typography.caption, marginTop: Spacing.xs },
  title: { ...Typography.h2, marginBottom: Spacing.xs },
  sub: { ...Typography.caption, marginBottom: Spacing.xxl },
  gap: { height: Spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xxl, gap: 6 },
  footerText: { ...Typography.caption },
  link: { ...Typography.captionMedium, color: Colors.primary },
});
