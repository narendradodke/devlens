import { useThemeState } from '../../hooks/useTheme';
import { ThemeContext } from '../../context/theme-context';

export function ThemeProvider({ children }) {
  const themeState = useThemeState();

  return <ThemeContext.Provider value={themeState}>{children}</ThemeContext.Provider>;
}
