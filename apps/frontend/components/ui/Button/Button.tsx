import React from 'react';
import Link from 'next/link';
import styles from './Button.module.css';

interface ButtonProps {
  variant?: 'primary' | 'link';
  href?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
}

export function Button({
  variant = 'primary',
  href,
  children,
  icon,
  className = '',
  onClick,
  type = 'button',
  'aria-label': ariaLabel,
}: ButtonProps) {
  const combinedClassName = `${styles.btn} ${styles[variant]} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={combinedClassName} aria-label={ariaLabel}>
        {children}
        {icon && <span className={styles.icon}>{icon}</span>}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={combinedClassName}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
      {icon && <span className={styles.icon}>{icon}</span>}
    </button>
  );
}
