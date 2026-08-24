import Link from 'next/link';
import { LogoIcon } from '@/components/icons';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.container} ${styles.footerInner}`}>
        <div className={styles.footerBrand}>
          <Link href="/" className={styles.logo} aria-label="TinhChuan.vn">
            <span className={styles.logoIcon}>
              <LogoIcon width={20} height={20} />
            </span>
            <span>
              <span className={styles.logoBrand}>tinhchuan</span>
              <span className={styles.logoDomain}>.vn</span>
            </span>
          </Link>
        </div>
        <div className={styles.footerLinks}>
          <Link href="/gioi-thieu" className={styles.footerLink}>
            Giới thiệu
          </Link>
          <span className={styles.footerDivider}>|</span>
          <Link href="/dieu-khoan" className={styles.footerLink}>
            Điều khoản sử dụng
          </Link>
          <span className={styles.footerDivider}>|</span>
          <Link href="/bao-mat" className={styles.footerLink}>
            Chính sách bảo mật
          </Link>
        </div>
        <p className={styles.footerCopy}>© 2026 TinhChuan.vn. All rights reserved.</p>
      </div>
    </footer>
  );
}
