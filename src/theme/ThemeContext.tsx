import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  applyThemeVars,
  getPalette,
  getTheme,
  loadStoredTheme,
  THEME_STORAGE_KEY,
  themes,
  type ThemeId,
} from './themes'
import { ThemeContext, type ThemeContextValue } from './theme-context'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const id = loadStoredTheme()
    // 同步首帧，避免闪白
    if (typeof document !== 'undefined') applyThemeVars(id)
    return id
  })

  useEffect(() => {
    applyThemeVars(themeId)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeId)
    } catch {
      /* ignore */
    }
  }, [themeId])

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id)
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeId,
      theme: getTheme(themeId),
      palette: getPalette(themeId),
      themes,
      setTheme,
    }),
    [themeId, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
