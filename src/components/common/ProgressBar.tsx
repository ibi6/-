import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Colors, Radius } from '@/theme';
import { clamp } from '@/utils/date';

type Props = {
  progress: number;
  color?: string;
  trackColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

export function ProgressBar({
  progress,
  color = Colors.primary,
  trackColor = Colors.primarySoft,
  height = 8,
  style,
}: Props) {
  const p = clamp(progress, 0, 1.2);
  const widthPct = Math.min(p, 1) * 100;
  return (
    <View style={[styles.track, { height, backgroundColor: trackColor }, style]}>
      <View
        style={[
          styles.fill,
          {
            width: `${widthPct}%`,
            backgroundColor: p > 1 ? Colors.warning : color,
            height,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: Radius.full,
  },
});
