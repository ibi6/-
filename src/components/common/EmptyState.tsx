import { StyleSheet, Text, View } from 'react-native';
import { Spacing, Typography } from '@/theme';
import { Button } from './Button';

type Props = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} style={styles.btn} fullWidth={false} size="sm" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', padding: Spacing.xxxl, gap: Spacing.sm },
  title: { ...Typography.h3, textAlign: 'center' },
  desc: { ...Typography.caption, textAlign: 'center', maxWidth: 280 },
  btn: { marginTop: Spacing.md, paddingHorizontal: Spacing.xxl },
});
