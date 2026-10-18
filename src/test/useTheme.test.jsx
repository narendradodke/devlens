import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useThemeState } from '../hooks/useTheme';

describe('useThemeState hook', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    vi.restoreAllMocks();
  });

  it('initializes with default theme and updates documentElement', () => {
    const { result } = renderHook(() => useThemeState());
    expect(['light', 'dark']).toContain(result.current.theme);
    if (result.current.theme === 'dark') {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    }
  });

  it('toggles theme correctly between light and dark', () => {
    const { result } = renderHook(() => useThemeState());
    const initialTheme = result.current.theme;

    act(() => {
      result.current.toggleTheme();
    });

    const expectedNewTheme = initialTheme === 'dark' ? 'light' : 'dark';
    expect(result.current.theme).toBe(expectedNewTheme);
    expect(localStorage.getItem('devlens-theme')).toBe(expectedNewTheme);

    if (expectedNewTheme === 'dark') {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    } else {
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    }
  });

  it('allows setting explicit theme', () => {
    const { result } = renderHook(() => useThemeState());

    act(() => {
      result.current.setTheme('light');
    });

    expect(result.current.theme).toBe('light');
    expect(result.current.isDark).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
