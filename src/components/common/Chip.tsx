import { Pressable, StyleSheet, Text } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/theme';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function Chip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected ? styles.selected : null]}
      disabled={!onPress}
    >
      <Text style={[styles.text, selected ? styles.textSelected : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  selected: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  text: { ...Typography.captionMedium, color: Colors.textSecondary },
  textSelected: { color: Colors.primary },
});
