'use client';

import React, { useState, useTransition } from 'react';
import {
  ExclamationTriangleIcon,
  LockIcon,
  ChevronDownIcon,
  CheckCircleIcon,
} from '@/components/icons';
import { formatVnd, formatDate } from '@/lib/format';
import { calculateTax, type TaxActionSuccess } from './action';
import styles from './tool.module.css';

// Trạng thái kết quả tính toán
type CalculationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: TaxActionSuccess }
  | { status: 'error_over_limit' }    // revenue > 3 tỷ - thông báo thân thiện
  | { status: 'error_no_rule' }       // Không có rule được duyệt
  | { status: 'error_db_unavailable' } // DB không kết nối được - hệ thống bảo trì
  | { status: 'error_system' };       // Lỗi bất ngờ khác

export default function TaxCalculator() {
  const [revenueInput, setRevenueInput] = useState('');
  const [salesChannel, setSalesChannel] = useState('ecommerce');
  const [calcState, setCalcState] = useState<CalculationState>({ status: 'idle' });
  const [isPending, startTransition] = useTransition();

  const handleRevenueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Chỉ giữ lại chữ số, sau đó format lại với dấu phân cách nghìn
    let raw = e.target.value.replace(/\D/g, '');
    const formatted = raw ? parseInt(raw, 10).toLocaleString('vi-VN') : '';
    setRevenueInput(formatted);
    // Reset kết quả mỗi khi người dùng thay đổi doanh thu
    setCalcState({ status: 'idle' });
  };

  const handleCalculate = () => {
    // Bóc số thực từ chuỗi đã format (VD: "1.250.000.000" → 1250000000)
    const rawDigits = revenueInput.replace(/\D/g, '');
    const revenue = parseInt(rawDigits, 10);

    if (!revenue || revenue <= 0) return;

    startTransition(async () => {
      setCalcState({ status: 'loading' });

      // Gọi Server Action — trả về discriminated union, không throw
      const actionResult = await calculateTax({ revenue });

      if (actionResult.ok) {
        setCalcState({ status: 'success', data: actionResult });
      } else {
        // Ánh xạ errorCode sang trạng thái UI tương ứng
        switch (actionResult.errorCode) {
          case 'OVER_PHASE1_LIMIT':
            setCalcState({ status: 'error_over_limit' });
            break;
          case 'NO_ACTIVE_RULE':
            setCalcState({ status: 'error_no_rule' });
            break;
          case 'DB_UNAVAILABLE':
            setCalcState({ status: 'error_db_unavailable' });
            break;
          default:
            setCalcState({ status: 'error_system' });
        }
      }
    });
  };

  const isLoading = isPending;
  const hasRevenue = revenueInput.replace(/\D/g, '').length > 0;

  return (
    <div className={styles.calculatorGrid}>
      {/* ===== Form nhập doanh thu ===== */}
      <div className={styles.calculatorFormCard}>
        <h2 className={styles.cardTitle}>Thông tin tính thuế</h2>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="revenue">
            Doanh thu trong năm (VNĐ)
          </label>
          <input
            type="text"
            id="revenue"
            className={styles.formInput}
            value={revenueInput}
            onChange={handleRevenueChange}
            placeholder="Ví dụ: 1.250.000.000"
            inputMode="numeric"
            autoComplete="off"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="salesChannel">
            Kênh bán hàng
          </label>
          <div className={styles.selectWrapper}>
            <select
              id="salesChannel"
              className={styles.formSelect}
              value={salesChannel}
              onChange={(e) => setSalesChannel(e.target.value)}
            >
              <option value="ecommerce">Sàn thương mại điện tử</option>
              <option value="social">Mạng xã hội</option>
              <option value="offline">Cửa hàng trực tiếp</option>
            </select>
            <span className={styles.selectArrow}>
              <ChevronDownIcon />
            </span>
          </div>
        </div>

        <button
          type="button"
          className={styles.btnCalculate}
          id="calculateBtn"
          onClick={handleCalculate}
          disabled={isLoading || !hasRevenue}
          aria-busy={isLoading}
        >
          {isLoading ? 'Đang tính...' : 'Tính thuế'}
        </button>

        <p className={styles.formNote}>
          <span className={styles.formNoteIcon}>
            <LockIcon />
          </span>
          Dữ liệu của bạn được bảo mật và không lưu trữ
        </p>
      </div>

      {/* ===== Khung kết quả ===== */}
      <div className={styles.resultCard}>
        <h2 className={styles.cardTitle}>Kết quả dự kiến</h2>

        {/* Trạng thái chưa tính */}
        {calcState.status === 'idle' && (
          <div className={styles.resultIdle}>
            <p className={styles.resultIdleText}>
              Nhập doanh thu và nhấn <strong>Tính thuế</strong> để xem kết quả.
            </p>
          </div>
        )}

        {/* Đang tính toán */}
        {calcState.status === 'loading' && (
          <div className={styles.resultIdle}>
            <p className={styles.resultIdleText}>Đang tính toán...</p>
          </div>
        )}

        {/* Lỗi: doanh thu trên 3 tỷ — thông báo thân thiện, không phải lỗi kỹ thuật */}
        {calcState.status === 'error_over_limit' && (
          <div className={styles.errorOverLimitBox}>
            <span className={styles.errorOverLimitIcon}>
              <ExclamationTriangleIcon />
            </span>
            <div>
              <p className={styles.errorOverLimitTitle}>
                Công cụ hiện chưa hỗ trợ mức doanh thu trên 3 tỷ đồng/năm.
              </p>
              <p className={styles.errorOverLimitDesc}>
                Ở mức doanh thu này, cách tính thuế khác và cần tư vấn riêng.
                Vui lòng liên hệ kế toán hoặc cơ quan thuế địa phương.
              </p>
            </div>
          </div>
        )}

        {/* Lỗi: chưa có quy tắc thuế được duyệt */}
        {calcState.status === 'error_no_rule' && (
          <div className={styles.errorSystemBox}>
            <span className={styles.errorSystemIcon}>
              <ExclamationTriangleIcon />
            </span>
            <p className={styles.errorSystemText}>
              Chưa có dữ liệu thuế được duyệt cho ngày hôm nay. Vui lòng thử lại sau.
            </p>
          </div>
        )}

        {/* Lỗi: DB không kết nối — hiển thị thông báo bảo trì thân thiện */}
        {calcState.status === 'error_db_unavailable' && (
          <div className={styles.errorSystemBox}>
            <span className={styles.errorSystemIcon}>
              <ExclamationTriangleIcon />
            </span>
            <p className={styles.errorSystemText}>
              Hệ thống đang bảo trì, vui lòng thử lại sau.
            </p>
          </div>
        )}

        {/* Lỗi hệ thống bất ngờ */}
        {calcState.status === 'error_system' && (
          <div className={styles.errorSystemBox}>
            <span className={styles.errorSystemIcon}>
              <ExclamationTriangleIcon />
            </span>
            <p className={styles.errorSystemText}>
              Đã xảy ra lỗi khi tính toán. Vui lòng thử lại sau.
            </p>
          </div>
        )}

        {/* Thành công — hiển thị kết quả từ Server Action */}
        {calcState.status === 'success' && (
          <>
            {/* Badge trạng thái chịu thuế / miễn thuế */}
            {calcState.data.result.isTaxable ? (
              <div className={styles.taxStatusBadgeWarning}>
                <ExclamationTriangleIcon />
                Thuộc diện chịu thuế
              </div>
            ) : (
              <div className={styles.taxStatusBadgeSuccess}>
                <CheckCircleIcon />
                Không phải nộp thuế (Dưới ngưỡng{' '}
                {formatVnd(calcState.data.ruleValue.threshold)} đồng/năm)
              </div>
            )}

            {/* Tổng thuế phải nộp */}
            <p className={styles.resultLabel}>Tổng số thuế phải nộp</p>
            <p className={styles.resultAmount}>
              {formatVnd(calcState.data.result.totalTax)}{' '}
              <span className={styles.resultCurrency}>VNĐ</span>
            </p>

            {/* Chi tiết từng khoản — chỉ hiển thị khi thuộc diện chịu thuế */}
            {calcState.data.result.isTaxable && (
              <div className={styles.resultDetail}>
                <h3 className={styles.detailTitle}>Chi tiết</h3>
                <div className={styles.detailRow}>
                  <span className={styles.detailName}>
                    Thuế GTGT ({(calcState.data.ruleValue.vatRate * 100).toFixed(0)}%)
                  </span>
                  <span className={styles.detailValue}>
                    {formatVnd(calcState.data.result.vatTax)} VNĐ
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailName}>
                    Thuế TNCN (
                    {(calcState.data.ruleValue.pitRate * 100).toFixed(1)}% trên
                    phần vượt {formatVnd(calcState.data.ruleValue.threshold)} đồng)
                  </span>
                  <span className={styles.detailValue}>
                    {formatVnd(calcState.data.result.pitTax)} VNĐ
                  </span>
                </div>
              </div>
            )}

            {/* Dòng tổng cộng */}
            <div className={styles.resultTotal}>
              <span className={styles.totalLabel}>Tổng</span>
              <span className={styles.totalValue}>
                {formatVnd(calcState.data.result.totalTax)} VNĐ
              </span>
            </div>

            {/* Căn cứ pháp lý ngay dưới kết quả (CONTEXT.md nguyên tắc 1) */}
            <div className={styles.resultLegalSource}>
              <span className={styles.resultLegalSourceLabel}>Căn cứ:</span>
              <a
                href={calcState.data.legalSource.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.resultLegalSourceLink}
              >
                {calcState.data.legalSource.documentType}{' '}
                {calcState.data.legalSource.documentNumber}
              </a>
              <span className={styles.resultLegalSourceDate}>
                (Hiệu lực từ {formatDate(calcState.data.legalSource.effectiveDate)})
              </span>
            </div>

            {/* Disclaimer bắt buộc */}
            <p className={styles.resultDisclaimer}>
              * Kết quả chỉ mang tính chất tham khảo, không phải tư vấn thuế chính thức.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
