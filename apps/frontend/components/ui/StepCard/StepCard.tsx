import React from 'react';
import styles from './StepCard.module.css';

interface StepCardProps {
  step: number | string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function StepCard({ step, icon, title, description }: StepCardProps) {
  return (
    <div className={styles.stepCard}>
      <div className={styles.stepNumber}>{step}</div>
      <div className={styles.stepIcon}>{icon}</div>
      <div className={styles.stepContent}>
        <h3 className={styles.stepTitle}>{title}</h3>
        <p className={styles.stepDesc}>{description}</p>
      </div>
    </div>
  );
}
