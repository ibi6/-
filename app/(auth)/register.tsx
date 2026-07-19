import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Screen, TextField } from '@/components/common';
import { Colors, Spacing, Typography } from '@/theme';
import { useAuthStore } from '@/stores';
import { registerSchema, type RegisterForm } from '@/validators/auth';

export default function RegisterScreen() {
  const register = useAuthStore((s) => s.register);
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await register(data.email, data.password, data.name);
      router.replace('/onboarding');
    } catch {
      Alert.alert('注册失败', '请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>创建账号</Text>
      <Text style={styles.sub}>几步完成注册，开启你的健身之旅</Text>

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField label="昵称" value={value} onBlur={onBlur} onChangeText={onChange} error={errors.name?.message} placeholder="怎么称呼你" />
        )}
      />
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
          />
        )}
      />

      <Button title="注册并继续" loading={loading} onPress={handleSubmit(onSubmit)} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>已有账号？</Text>
        <Link href="/(auth)/login" asChild>
          <Pressable>
            <Text style={styles.link}>登录</Text>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...Typography.h2, marginTop: Spacing.xxl, marginBottom: Spacing.xs },
  sub: { ...Typography.caption, marginBottom: Spacing.xxl },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xxl, gap: 6 },
  footerText: { ...Typography.caption },
  link: { ...Typography.captionMedium, color: Colors.primary },
});
