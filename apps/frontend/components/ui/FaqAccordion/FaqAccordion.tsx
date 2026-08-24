'use client';

import React, { useState } from 'react';
import { ChevronDownIcon } from '@/components/icons';
import styles from './FaqAccordion.module.css';

export interface FaqItemData {
  id?: string | number;
  question: string;
  answer: React.ReactNode;
}

interface FaqAccordionProps {
  items: FaqItemData[];
  defaultOpenIndex?: number;
}

export function FaqAccordion({ items, defaultOpenIndex }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(
    defaultOpenIndex !== undefined ? defaultOpenIndex : null
  );

  const handleToggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className={styles.faqList}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.id ?? index} className={`${styles.faqItem} ${isOpen ? styles.open : ''}`}>
            <button
              className={styles.faqQuestion}
              onClick={() => handleToggle(index)}
              aria-expanded={isOpen}
              type="button"
            >
              <span>{item.question}</span>
              <span className={styles.faqIcon}>
                <ChevronDownIcon />
              </span>
            </button>
            {isOpen && (
              <div className={styles.faqAnswer}>
                {typeof item.answer === 'string' ? <p>{item.answer}</p> : item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
