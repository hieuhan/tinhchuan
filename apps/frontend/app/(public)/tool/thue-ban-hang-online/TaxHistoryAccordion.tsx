'use client';

import React, { useState } from 'react';
import { ClockHistoryIcon, ChevronDownIcon } from '@/components/icons';
import styles from './tool.module.css';

/**
 * Accordion lịch sử thay đổi ngưỡng thuế.
 * Panel mở/đóng theo CONTEXT.md nguyên tắc 5.
 * Dữ liệu lịch sử là dữ liệu tĩnh (layout/marketing chrome) - không nối DB.
 */
export default function TaxHistoryAccordion() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={styles.accordionCard}>
      <button
        type="button"
        className={styles.accordionHeader}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.accordionTitle}>
          <span className={styles.accordionTitleIcon}>
            <ClockHistoryIcon />
          </span>
          Xem lịch sử thay đổi ngưỡng thuế
        </span>
        <span className={`${styles.accordionIcon} ${isOpen ? styles.accordionIconOpen : ''}`}>
          <ChevronDownIcon />
        </span>
      </button>

      {isOpen && (
        <div className={styles.accordionBody}>
          <table className={styles.historyTable}>
            <thead>
              <tr>
                <th>Thời điểm áp dụng</th>
                <th>Ngưỡng doanh thu miễn thuế</th>
                <th>Căn cứ pháp lý</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Trước 01/01/2026</td>
                <td>500.000.000 VNĐ/năm</td>
                <td>Nghị định 68/2026/NĐ-CP</td>
              </tr>
              <tr className={styles.historyTableRowCurrent}>
                <td>
                  <strong>Từ 01/01/2026 (hiện tại)</strong>
                </td>
                <td>
                  <strong>1.000.000.000 VNĐ/năm</strong>
                </td>
                <td>Nghị định 141/2026/NĐ-CP</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
