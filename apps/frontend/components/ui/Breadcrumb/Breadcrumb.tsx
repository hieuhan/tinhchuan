import React from 'react';
import Link from 'next/link';
import { ChevronRightIcon } from '@/components/icons';
import styles from './Breadcrumb.module.css';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div className={styles.breadcrumbSection}>
      <div className={styles.container}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <React.Fragment key={index}>
                {index > 0 && (
                  <span className={styles.breadcrumbSeparator}>
                    <ChevronRightIcon />
                  </span>
                )}
                {isLast || !item.href ? (
                  <span className={styles.breadcrumbCurrent} aria-current={isLast ? 'page' : undefined}>
                    {item.icon}
                    {item.label}
                  </span>
                ) : (
                  <Link href={item.href} className={styles.breadcrumbLink}>
                    {item.icon}
                    {item.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
