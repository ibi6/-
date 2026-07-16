import { useContext } from 'react'
import { ThemeContext } from './theme-context'

/** 读取当前强调色和图表色板。 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
