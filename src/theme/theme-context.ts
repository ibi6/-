import { createContext } from 'react'
import type { ThemeDef, ThemeId, ThemePalette } from './themes'

export interface ThemeContextValue {
  themeId: ThemeId
  theme: ThemeDef
  palette: ThemePalette
  themes: ThemeDef[]
  setTheme: (id: ThemeId) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
