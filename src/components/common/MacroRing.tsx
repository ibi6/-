import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Spacing, Typography } from '@/theme';
import { clamp } from '@/utils/date';

type Props = {
  label: string;
  value: number;
  target: number;
  unit?: string;
  color?: string;
  size?: number;
};

export function MacroRing({
  label,
  value,
  target,
  unit = 'g',
  color = Colors.primary,
  size = 72,
}: Props) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = target > 0 ? clamp(value / target, 0, 1.2) : 0;
  const dash = Math.min(ratio, 1) * c;

  return (
    <View style={styles.wrap}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={Colors.border}
            strokeWidth={stroke}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={ratio > 1 ? Colors.warning : color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${dash} ${c - dash}`}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Text style={styles.value}>{Math.round(value)}</Text>
        </View>
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.sub}>
        /{Math.round(target)}
        {unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', minWidth: 80 },
  center: { alignItems: 'center', justifyContent: 'center' },
  value: { ...Typography.captionMedium, color: Colors.textPrimary, fontWeight: '700' },
  label: { ...Typography.captionMedium, marginTop: Spacing.xs, color: Colors.textPrimary },
  sub: { ...Typography.label },
});
