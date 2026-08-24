'use client';

import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from '@/components/icons';
import styles from './ThemeToggle.module.css';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Khôi phục theme từ localStorage hoặc theo hệ thống
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleToggle = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  if (!mounted) {
    return (
      <button className={styles.themeToggle} aria-label="Chuyển đổi giao diện sáng/tối">
        <SunIcon className={styles.sunIcon} />
      </button>
    );
  }

  return (
    <button
      className={styles.themeToggle}
      onClick={handleToggle}
      aria-label="Chuyển đổi giao diện sáng/tối"
      type="button"
    >
      <SunIcon className={styles.sunIcon} />
      <MoonIcon className={styles.moonIcon} />
    </button>
  );
}
