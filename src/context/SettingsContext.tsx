import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { preferences } from '@/lib/session';

export type ThemeMode = 'system' | 'light' | 'dark';

interface SettingsContextValue {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  confirmDeletion: boolean;
  setConfirmDeletion: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function useSystemDark() {
  const query = '(prefers-color-scheme: dark)';
  const [dark, setDark] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = (e: MediaQueryListEvent) => setDark(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);
  return dark;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => preferences.get('themeMode', 'system'));
  const [confirmDeletion, setConfirmDeletionState] = useState<boolean>(() => preferences.get('confirmDeletion', true));
  const systemDark = useSystemDark();
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemDark);

  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', themeMode);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#191C19' : '#006D39');
  }, [themeMode, isDark]);

  const value = useMemo(
    () => ({
      themeMode,
      setThemeMode: (mode: ThemeMode) => {
        setThemeModeState(mode);
        preferences.set('themeMode', mode);
      },
      isDark,
      confirmDeletion,
      setConfirmDeletion: (v: boolean) => {
        setConfirmDeletionState(v);
        preferences.set('confirmDeletion', v);
      },
    }),
    [themeMode, isDark, confirmDeletion],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings deve ser usado dentro de SettingsProvider');
  return ctx;
}
