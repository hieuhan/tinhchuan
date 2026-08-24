'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoIcon, MenuIcon, CloseIcon } from '@/components/icons';
import { ThemeToggle } from '@/components/layout/ThemeToggle/ThemeToggle';
import styles from './Header.module.css';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const isHome = pathname === '/';
  const isKnowledge = pathname.startsWith('/kien-thuc');

  return (
    <header className={styles.header}>
      <div className={`${styles.container} ${styles.headerInner}`}>
        <Link href="/" className={styles.logo} aria-label="TinhChuan.vn - Trang chủ" onClick={closeMenu}>
          <span className={styles.logoIcon}>
            <LogoIcon width={24} height={24} />
          </span>
          <span className={styles.logoText}>
            <span className={styles.logoBrand}>tinhchuan</span>
            <span className={styles.logoDomain}>.vn</span>
          </span>
        </Link>

        <nav className={styles.navDesktop} aria-label="Điều hướng chính">
          <Link href="/" className={`${styles.navLink} ${isHome ? styles.active : ''}`}>
            Trang chủ
          </Link>
          <Link href="/kien-thuc" className={`${styles.navLink} ${isKnowledge ? styles.active : ''}`}>
            Kiến thức
          </Link>
        </nav>

        <div className={styles.headerActions}>
          <ThemeToggle />
          <button
            className={styles.mobileMenuBtn}
            onClick={toggleMenu}
            aria-label={isMenuOpen ? 'Đóng menu' : 'Mở menu'}
            type="button"
          >
            {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.open : ''}`}>
        <nav className={styles.mobileNav} aria-label="Menu di động">
          <Link
            href="/"
            className={`${styles.mobileNavLink} ${isHome ? styles.active : ''}`}
            onClick={closeMenu}
          >
            Trang chủ
          </Link>
          <Link
            href="/kien-thuc"
            className={`${styles.mobileNavLink} ${isKnowledge ? styles.active : ''}`}
            onClick={closeMenu}
          >
            Kiến thức
          </Link>
        </nav>
      </div>
    </header>
  );
}
