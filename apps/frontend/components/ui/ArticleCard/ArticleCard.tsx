import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon, CalendarIcon } from '@/components/icons';
import styles from './ArticleCard.module.css';

export interface ArticleCardProps {
  href?: string;
  icon: React.ReactNode;
  title: string;
  description?: string;
  date: string;
  status?: string;
  showCalendarIcon?: boolean;
  onClick?: () => void;
}

export function ArticleCard({
  href,
  icon,
  title,
  description,
  date,
  status,
  showCalendarIcon,
  onClick,
}: ArticleCardProps) {
  const content = (
    <>
      <div className={styles.articleIcon}>{icon}</div>
      <div className={styles.articleContent}>
        <h3 className={styles.articleTitle}>{title}</h3>
        {description && <p className={styles.articleDesc}>{description}</p>}
        <div className={styles.articleMeta}>
          <span className={styles.articleDate}>
            {showCalendarIcon && (
              <span className={styles.articleCalendarIcon}>
                <CalendarIcon />
              </span>
            )}
            {date}
          </span>
          {status ? (
            <span className={styles.articleStatus}>{status}</span>
          ) : (
            <span className={styles.articleArrow}>
              <ArrowRightIcon />
            </span>
          )}
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={styles.articleCard} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <article className={styles.articleCard} onClick={onClick}>
      {content}
    </article>
  );
}
