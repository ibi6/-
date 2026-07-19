import { TextStyle } from 'react-native';
import { Colors } from './colors';

export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  } as TextStyle,
  h2: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  } as TextStyle,
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  } as TextStyle,
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.textPrimary,
    lineHeight: 22,
  } as TextStyle,
  bodyMedium: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  } as TextStyle,
  caption: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 18,
  } as TextStyle,
  captionMedium: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  } as TextStyle,
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.2,
  } as TextStyle,
  button: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  } as TextStyle,
  number: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  } as TextStyle,
  numberSm: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  } as TextStyle,
} as const;
