import { useEffect, useState, useCallback } from 'react';
import type { Settings } from '@/types';

const SETTINGS_KEY = 'rc_settings';

function loadSettings(): Settings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as Settings;
    } catch {
      // fallthrough
    }
  }
  return { theme: 'system', rememberMe: false };
}

function saveSettings(s: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function applyTheme(theme: Settings['theme']) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  root.classList.toggle('dark', isDark);
}

export function useTheme() {
  const [settings, setSettings] = useState<Settings>(() => {
    const s = loadSettings();
    applyTheme(s.theme);
    return s;
  });

  useEffect(() => {
    applyTheme(settings.theme);
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (settings.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings.theme]);

  const setTheme = useCallback(
    (theme: Settings['theme']) => setSettings((s) => ({ ...s, theme })),
    [],
  );
  const setRememberMe = useCallback(
    (rememberMe: boolean) => setSettings((s) => ({ ...s, rememberMe })),
    [],
  );

  return { settings, setTheme, setRememberMe };
}
