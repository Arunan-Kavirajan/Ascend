import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type ThemeContextType = {
  theme: string;
  toggleTheme: (e?: React.MouseEvent) => void;
  setTheme: (newTheme: string) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<string>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem('ascend-theme');
    return saved ? saved : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ascend-theme', theme);
  }, [theme]);

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleTheme = (e?: React.MouseEvent) => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    const x = e ? e.clientX : window.innerWidth - 40;
    const y = e ? e.clientY : 40;

    document.documentElement.style.setProperty('--toggle-x', `${x}px`);
    document.documentElement.style.setProperty('--toggle-y', `${y}px`);

    const update = () => {
      setThemeState(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    };

    if (document.startViewTransition) {
      document.startViewTransition(update);
    } else {
      update();
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
