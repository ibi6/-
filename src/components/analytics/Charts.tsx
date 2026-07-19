import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect } from 'react-native-svg';
import { Colors, Spacing, Typography } from '@/theme';

export type ChartPoint = {
  date: string;
  value: number;
};

type ChartProps = {
  data: ChartPoint[];
  width: number;
  height?: number;
  color?: string;
  accessibilityLabel: string;
};

const PADDING = 18;

export function LineChart({
  data,
  width,
  height = 180,
  color = Colors.chartLine,
  accessibilityLabel,
}: ChartProps) {
  const values = data.map((point) => point.value).filter(Number.isFinite);
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const innerWidth = Math.max(1, width - PADDING * 2);
  const innerHeight = Math.max(1, height - PADDING * 2);
  const points = data.map((point, index) => ({
    ...point,
    x:
      data.length === 1
        ? PADDING + innerWidth / 2
        : PADDING + (index / (data.length - 1)) * innerWidth,
    y: PADDING + ((max - point.value) / span) * innerHeight,
  }));

  return (
    <View accessible accessibilityLabel={accessibilityLabel}>
      <Svg width={width} height={height}>
        {[0, 0.5, 1].map((ratio) => (
          <Line
            key={ratio}
            x1={PADDING}
            x2={width - PADDING}
            y1={PADDING + innerHeight * ratio}
            y2={PADDING + innerHeight * ratio}
            stroke={Colors.border}
            strokeWidth={1}
          />
        ))}
        <Polyline
          points={points.map((point) => `${point.x},${point.y}`).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point) => (
          <Circle
            key={`${point.date}-${point.value}`}
            cx={point.x}
            cy={point.y}
            r={3.5}
            fill={Colors.surface}
            stroke={color}
            strokeWidth={2}
          />
        ))}
      </Svg>
      <View style={styles.legend}>
        <Text style={styles.label}>{data[0]?.date.slice(5) ?? ''}</Text>
        <Text style={styles.label}>{data[data.length - 1]?.date.slice(5) ?? ''}</Text>
      </View>
    </View>
  );
}

export function BarChart({
  data,
  width,
  height = 180,
  color = Colors.orange,
  accessibilityLabel,
}: ChartProps) {
  const values = data.map((point) => point.value).filter(Number.isFinite);
  if (values.length === 0) return null;
  const max = Math.max(1, ...values);
  const innerWidth = Math.max(1, width - PADDING * 2);
  const innerHeight = Math.max(1, height - PADDING * 2);
  const slot = innerWidth / data.length;
  const barWidth = Math.max(4, Math.min(24, slot * 0.62));

  return (
    <View accessible accessibilityLabel={accessibilityLabel}>
      <Svg width={width} height={height}>
        <Line
          x1={PADDING}
          x2={width - PADDING}
          y1={height - PADDING}
          y2={height - PADDING}
          stroke={Colors.border}
          strokeWidth={1}
        />
        {data.map((point, index) => {
          const barHeight = Math.max(2, (point.value / max) * innerHeight);
          return (
            <Rect
              key={`${point.date}-${point.value}`}
              x={PADDING + index * slot + (slot - barWidth) / 2}
              y={height - PADDING - barHeight}
              width={barWidth}
              height={barHeight}
              rx={barWidth / 2}
              fill={color}
            />
          );
        })}
      </Svg>
      <View style={styles.legend}>
        <Text style={styles.label}>{data[0]?.date.slice(5) ?? ''}</Text>
        <Text style={styles.label}>{data[data.length - 1]?.date.slice(5) ?? ''}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: PADDING,
    marginTop: -Spacing.xs,
  },
  label: { ...Typography.label },
});
