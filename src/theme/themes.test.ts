import assert from 'node:assert/strict'
import test from 'node:test'
import { getThemeCssVars, themes } from './themes.ts'

test('every accent theme exposes complete interactive CSS tokens', () => {
  for (const theme of themes) {
    const vars = getThemeCssVars(theme.id)
    assert.equal(vars['--accent'], theme.swatch)
    for (const key of [
      '--accent',
      '--accent-2',
      '--accent-deep',
      '--accent-hover',
      '--accent-soft',
      '--accent-border',
      '--accent-ring',
      '--accent-contrast',
    ]) {
      assert.ok(vars[key], `${theme.id} is missing ${key}`)
    }
  }
})

function relativeLuminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

test('primary action colors meet WCAG AA contrast', () => {
  for (const theme of themes) {
    const vars = getThemeCssVars(theme.id)
    const foreground = relativeLuminance(vars['--accent-contrast'])
    const background = relativeLuminance(vars['--accent-deep'])
    const ratio = (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05)
    assert.ok(ratio >= 4.5, `${theme.id} contrast is ${ratio.toFixed(2)}:1`)
  }
})
