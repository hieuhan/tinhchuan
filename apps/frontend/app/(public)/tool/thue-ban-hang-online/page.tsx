import React from 'react';
import type { Metadata } from 'next';
import {
  HouseIcon,
  FileTextIcon,
  CalculatorIcon,
  QuestionCircleIcon,
  CheckCircleIcon,
  CartIcon,
} from '@/components/icons';
import { Breadcrumb } from '@/components/ui/Breadcrumb/Breadcrumb';
import { ArticleCard } from '@/components/ui/ArticleCard/ArticleCard';
import { FaqAccordion } from '@/components/ui/FaqAccordion/FaqAccordion';
import { formatDate } from '@/lib/format';
import { resolveActiveTaxRule } from './action';
import TaxCalculator from './TaxCalculator';
import TaxHistoryAccordion from './TaxHistoryAccordion';
import { generateBreadcrumbSchema, generateFaqSchema, generateSoftwareAppSchema } from '@/lib/seo/schema';
import styles from './tool.module.css';

// Render động ở mọi request: tránh Next.js prerender lúc build (tránh lỗi khi DB chưa sẵn sàng lúc Docker build image). Mỗi request tự query DB mới nhất.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Công cụ tính thuế bán hàng online 2026 | TinhChuan.vn',
  description:
    'Tính thuế GTGT và TNCN cho hộ kinh doanh, cá nhân bán hàng online (Shopee, TikTok Shop, Facebook...) theo Nghị định 141/2026/NĐ-CP. Kết quả có căn cứ pháp lý rõ ràng.',
};

const breadcrumbItems = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Tính thuế bán hàng online' },
];

const miniFaqItems = [
  {
    question: 'Bán dưới 1 tỷ có phải kê khai không?',
    answer:
      'Nếu tổng doanh thu trong năm từ 1 tỷ đồng trở xuống, hộ kinh doanh không phải nộp thuế GTGT và TNCN nhưng vẫn cần thực hiện nghĩa vụ thông báo/kê khai doanh thu theo quy định.',
  },
  {
    question: 'Sàn TMĐT tự khấu trừ thì sao?',
    answer:
      'Các sàn TMĐT có chức năng thanh toán sẽ tự động khấu trừ thuế theo tỷ lệ quy định. Nếu cả năm doanh thu dưới 1 tỷ, bạn có thể làm thủ tục hoàn thuế hoặc quyết toán lại.',
  },
  {
    question: 'Tôi bán trên nhiều sàn thì doanh thu có cộng lại không?',
    answer:
      'Có. Ngưỡng xét miễn thuế (1 tỷ đồng/năm) áp dụng trên tổng doanh thu từ tất cả các kênh (sàn TMĐT, mạng xã hội, website, cửa hàng...).',
  },
  {
    question: 'Doanh thu tính thuế là doanh thu trước hay sau phí sàn?',
    answer:
      'Doanh thu tính thuế là toàn bộ số tiền bán hàng trước khi trừ các khoản phí sàn, phí vận chuyển và chiết khấu khác.',
  },
];

export default async function OnlineSalesTaxCalculatorPage() {
  // Lấy quy tắc thuế active từ DB/mock để hiển thị ngày hiệu lực động trên badge header
  let effectiveDateText: string | null = null;
  try {
    const activeRule = await resolveActiveTaxRule();
    if (activeRule?.legalSourceInfo?.effectiveDate) {
      effectiveDateText = formatDate(activeRule.legalSourceInfo.effectiveDate);
    }
  } catch (err) {
    // Vì render động ở mỗi request, khi DB lỗi thì log server và ẩn badge ngày để tránh hiển thị thông tin sai căn cứ
    console.error(
      '[OnlineSalesTaxCalculatorPage] Lỗi khi truy vấn active tax rule:',
      err instanceof Error ? err.message : err
    );
    effectiveDateText = null;
  }

  // Sinh dữ liệu JSON-LD Schema.org
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tinhchuan.vn';
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);
  const faqSchema = generateFaqSchema(miniFaqItems);
  const softwareAppSchema = generateSoftwareAppSchema({
    name: metadata.title as string,
    description: metadata.description as string,
    url: `${baseUrl}/tool/thue-ban-hang-online`,
  });

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/', icon: <HouseIcon /> },
          { label: 'Tính thuế bán hàng online' },
        ]}
      />

      {/* ===== Page Header ===== */}
      {/* Badge "hiệu lực từ [ngày]" theo CONTEXT.md nguyên tắc 2 */}
      <section className={styles.pageHeader}>
        <div className={styles.container}>
          <div className={styles.pageHeaderTop}>
            <h1 className={styles.pageTitle}>Công cụ tính thuế bán hàng online</h1>
            {/* Badge ngày hiệu lực — chỉ hiển thị khi có dữ liệu tax_rule hợp lệ từ DB/mock */}
            {effectiveDateText && (
              <span className={styles.badgeEffective}>
                Hiệu lực từ {effectiveDateText}
              </span>
            )}
          </div>
          {/* "Cập nhật lần cuối" theo CONTEXT.md nguyên tắc 3 */}
          <p className={styles.pageSubtitle}>
            Cập nhật lần cuối 18/08/2026 · Căn cứ Nghị định 141/2026/NĐ-CP
          </p>
        </div>
      </section>

      {/* ===== Form + Kết quả (Client Component) ===== */}
      <section className={styles.calculatorSection}>
        <div className={styles.container}>
          {/*
            TaxCalculator là 'use client' - xử lý form input, gọi Server Action
            calculateTax(), hiển thị kết quả + legalSource từ DB (không hardcode).
          */}
          <TaxCalculator />
        </div>
      </section>

      {/* ===== Căn cứ pháp lý ===== */}
      <section className={styles.legalSection}>
        <div className={styles.container}>
          <div className={styles.legalCard}>
            <div className={styles.legalHeader}>
              <div className={styles.legalIcon}>
                <FileTextIcon />
              </div>
              <h2 className={styles.legalTitle}>Căn cứ pháp lý</h2>
            </div>
            <div className={styles.legalContent}>
              <ul className={styles.legalList}>
                <li>
                  <a
                    href="https://xaydungchinhsach.chinhphu.vn/nghi-quyet-198-2025-qh15-ve-mot-so-co-che-chinh-sach-dac-biet-phat-trien-kinh-te-tu-nhan-119250517191622422.htm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.legalDocLink}
                  >
                    Nghị quyết 198/2025/QH15
                  </a>
                </li>
                <li>
                  <a
                    href="https://vanban.chinhphu.vn/?pageid=27160&docid=217111"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.legalDocLink}
                  >
                    Nghị định 68/2026/NĐ-CP (5/3/2026)
                  </a>
                </li>
                <li>
                  <a
                    href="https://vanban.chinhphu.vn/?pageid=27160&docid=217960"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.legalDocLink}
                  >
                    Nghị định 141/2026/NĐ-CP (29/4/2026, hiệu lực hồi tố từ 1/1/2026) — sửa ngưỡng 500 triệu → 1 tỷ
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Lịch sử thay đổi ngưỡng thuế (accordion, Client Component) ===== */}
      {/* Panel "Xem lịch sử thay đổi" theo CONTEXT.md nguyên tắc 5 */}
      <section className={styles.historySection}>
        <div className={styles.container}>
          <TaxHistoryAccordion />
        </div>
      </section>

      {/* ===== Cách tính + FAQ ===== */}
      <section className={styles.infoSection}>
        <div className={styles.container}>
          <div className={styles.infoGrid}>
            {/* Cách tính */}
            <div className={styles.infoCard}>
              <div className={styles.infoHeader}>
                <div className={styles.infoIcon}>
                  <CalculatorIcon />
                </div>
                <h2 className={styles.infoTitle}>Cách tính</h2>
              </div>
              <p className={styles.infoText}>
                Nếu doanh thu trong năm trên 1 tỷ đồng (áp dụng đến 3 tỷ đồng/năm):
              </p>
              <ul className={styles.infoList}>
                <li>
                  <strong>Thuế GTGT</strong> = Doanh thu × 1%{' '}
                  <span className={styles.infoListNote}>(tính trên toàn bộ doanh thu)</span>
                </li>
                <li>
                  <strong>Thuế TNCN</strong> = (Doanh thu − 1 tỷ) × 0,5%{' '}
                  <span className={styles.infoListNote}>(chỉ tính trên phần vượt ngưỡng)</span>
                </li>
              </ul>
              <p className={styles.infoText} style={{ marginTop: '0.75rem' }}>
                Ví dụ: Doanh thu 1,8 tỷ → GTGT = 18 triệu, TNCN = 4 triệu, Tổng = 22 triệu.
              </p>
            </div>

            {/* Câu hỏi thường gặp (mini accordion) */}
            <div className={styles.infoCard}>
              <div className={styles.infoHeader}>
                <div className={styles.infoIcon}>
                  <QuestionCircleIcon />
                </div>
                <h2 className={styles.infoTitle}>Câu hỏi thường gặp</h2>
              </div>
              <FaqAccordion items={miniFaqItems} />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Bài viết liên quan ===== */}
      <section className={styles.relatedSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Bài viết liên quan</h2>
          {/* TODO: query content_page (status='approved', pageType='knowledge') */}
          <div className={styles.relatedGrid}>
            <ArticleCard
              href="/kien-thuc/nguong-doanh-thu-chiu-thue-ban-hang-online-2026"
              icon={<FileTextIcon />}
              title="Ngưỡng doanh thu chịu thuế bán hàng online 2026 là bao nhiêu?"
              date="18/08/2026"
              showCalendarIcon
            />
            <ArticleCard
              href="/kien-thuc/cach-tinh-thue-ban-hang-tren-shopee-tiktok"
              icon={<CartIcon />}
              title="Cách tính thuế bán hàng trên Shopee, TikTok Shop"
              date="18/08/2026"
              showCalendarIcon
            />
          </div>
        </div>
      </section>

      {/* ===== Disclaimer bắt buộc (CONTEXT.md nguyên tắc 6) ===== */}
      <section className={styles.disclaimerSection}>
        <div className={styles.container}>
          <div className={styles.disclaimerBox}>
            <span className={styles.disclaimerIcon}>
              <CheckCircleIcon />
            </span>
            <p className={styles.disclaimerText}>
              Kết quả chỉ mang tính chất tham khảo, không phải tư vấn thuế chính thức.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

