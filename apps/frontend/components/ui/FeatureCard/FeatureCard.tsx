import React from 'react';
import styles from './FeatureCard.module.css';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureIcon}>{icon}</div>
      <div className={styles.featureText}>
        <h3 className={styles.featureTitle}>{title}</h3>
        <p className={styles.featureDesc}>{description}</p>
      </div>
    </div>
  );
}
