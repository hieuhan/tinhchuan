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
        {/* TODO: bật lại Link khi có nội dung Giới thiệu/Điều khoản/Chính sách bảo mật thật */}
        <div className={styles.footerLinks}>
          <span className={styles.footerText}>Giới thiệu</span>
          <span className={styles.footerDivider}>|</span>
          <span className={styles.footerText}>Điều khoản sử dụng</span>
          <span className={styles.footerDivider}>|</span>
          <span className={styles.footerText}>Chính sách bảo mật</span>
        </div>
        <p className={styles.footerCopy}>© 2026 TinhChuan.vn. All rights reserved.</p>
      </div>
    </footer>
  );
}
