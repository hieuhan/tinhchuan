import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  HouseIcon,
  CalendarIcon,
  TableIcon,
  CalculatorIcon,
  ExclamationTriangleIcon,
  FileTextIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  CartIcon,
  ScaleIcon,
} from '@/components/icons';
import { Breadcrumb } from '@/components/ui/Breadcrumb/Breadcrumb';
import { FaqAccordion } from '@/components/ui/FaqAccordion/FaqAccordion';
import type { FaqItemData } from '@/components/ui/FaqAccordion/FaqAccordion';
import { ArticleCard } from '@/components/ui/ArticleCard/ArticleCard';
import { generateBreadcrumbSchema, generateFaqSchema } from '@/lib/seo/schema';
import styles from './article.module.css';

export const metadata: Metadata = {
  title: 'Ngưỡng doanh thu chịu thuế bán hàng online 2026 là bao nhiêu? - TinhChuan.vn',
  description:
    'Từ ngày 01/01/2026, ngưỡng doanh thu không chịu thuế đối với hộ, cá nhân kinh doanh bán hàng online được điều chỉnh từ 500 triệu đồng lên 1 tỷ đồng doanh thu/năm.',
};

const breadcrumbItems = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Kiến thức', href: '/kien-thuc' },
  { label: 'Ngưỡng doanh thu chịu thuế 2026' },
];

const faqItems: FaqItemData[] = [
  {
    id: 1,
    question: 'Doanh thu tính theo năm dương lịch hay năm tài chính?',
    answer: (
      <p>
        Doanh thu được tính theo năm dương lịch (từ ngày 01/01 đến ngày 31/12), không phải năm tài chính của doanh nghiệp.
      </p>
    ),
    answerPlainText:
      'Doanh thu được tính theo năm dương lịch (từ ngày 01/01 đến ngày 31/12), không phải năm tài chính của doanh nghiệp.',
  },
  {
    id: 2,
    question: 'Nếu bán trên nhiều kênh thì tính gộp doanh thu thế nào?',
    answer: (
      <p>
        Tổng doanh thu từ tất cả các kênh (sàn TMĐT, mạng xã hội, website, cửa hàng...) được cộng dồn để xét ngưỡng 1 tỷ đồng/năm.
      </p>
    ),
    answerPlainText:
      'Tổng doanh thu từ tất cả các kênh (sàn TMĐT, mạng xã hội, website, cửa hàng...) được cộng dồn để xét ngưỡng 1 tỷ đồng/năm.',
  },
  {
    id: 3,
    question: 'Nếu sàn TMĐT đã khấu trừ thuế thì tôi có phải nộp thêm không?',
    answer: (
      <p>
        Nếu tổng doanh thu cả năm ≤ 1 tỷ đồng, bạn được hoàn lại số thuế đã bị khấu trừ. Nếu vượt ngưỡng, số thuế sàn đã nộp thay sẽ được trừ vào nghĩa vụ thuế thực tế.
      </p>
    ),
    answerPlainText:
      'Nếu tổng doanh thu cả năm ≤ 1 tỷ đồng, bạn được hoàn lại số thuế đã bị khấu trừ. Nếu vượt ngưỡng, số thuế sàn đã nộp thay sẽ được trừ vào nghĩa vụ thuế thực tế.',
  },
];

export default function RevenueThresholdArticlePage() {
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);
  const faqSchema = generateFaqSchema(faqItems);

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

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/', icon: <HouseIcon /> },
          { label: 'Kiến thức', href: '/kien-thuc' },
          { label: 'Ngưỡng doanh thu chịu thuế 2026' },
        ]}
      />

      {/* Article Header */}
      <section className={styles.articleHeader}>
        <div className={styles.container}>
          <h1 className={styles.articleTitle}>Ngưỡng doanh thu chịu thuế bán hàng online 2026 là bao nhiêu?</h1>
          <p className={styles.articleMeta}>
            <span className={styles.metaIcon}>
              <CalendarIcon />
            </span>
            Cập nhật lần cuối: 18/08/2026
          </p>
        </div>
      </section>

      {/* Article Content */}
      <article className={styles.articleContentSection}>
        <div className={styles.container}>
          <div className={styles.articleBody}>
            <p>
              Từ ngày 01/01/2026, ngưỡng doanh thu không chịu thuế đối với hộ, cá nhân kinh doanh bán hàng online được điều chỉnh từ 500 triệu đồng lên 1 tỷ đồng doanh thu/năm.
            </p>
            <p>
              Quy định mới giúp mở rộng phạm vi hỗ trợ cho người kinh doanh nhỏ lẻ, giảm bớt nghĩa vụ thuế cho những ai có doanh thu thấp, đồng thời phù hợp hơn với thực tế phát triển của thương mại điện tử.
            </p>
            <p>
              Dưới đây là bảng so sánh ngưỡng doanh thu trước và sau khi thay đổi theo Nghị định 141/2026/NĐ-CP.
            </p>

            {/* Table so sánh */}
            <div className={styles.comparisonTableCard}>
              <h2 className={styles.tableTitle}>
                <span className={styles.tableTitleIcon}>
                  <TableIcon />
                </span>
                So sánh ngưỡng doanh thu không chịu thuế
              </h2>
              {/* TODO: nối Formula Engine, không giữ số tĩnh */}
              <div className={styles.tableWrapper}>
                <table className={styles.comparisonTable}>
                  <thead>
                    <tr>
                      <th>Thời điểm áp dụng</th>
                      <th>Ngưỡng doanh thu không chịu thuế</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Trước 01/01/2026</td>
                      <td>500.000.000 VNĐ</td>
                    </tr>
                    <tr>
                      <td>Từ 01/01/2026</td>
                      <td>1.000.000.000 VNĐ</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* CTA Box */}
            <div className={styles.ctaBox}>
              <div className={styles.ctaBoxLeft}>
                <div className={styles.ctaBoxHeader}>
                  <div className={styles.ctaBoxIcon}>
                    <CalculatorIcon />
                  </div>
                  <h3 className={styles.ctaBoxTitle}>Tính thử thuế của bạn ngay</h3>
                </div>
                <p className={styles.ctaBoxText}>
                  Nhập doanh thu, chọn kênh bán hàng để xem số thuế phải nộp theo quy định mới nhất.
                </p>
              </div>
              <Link href="/tool/thue-ban-hang-online" className={styles.btnCtaBox}>
                Sử dụng công cụ ngay
                <span className={styles.btnArrow}>
                  <ArrowRightIcon />
                </span>
              </Link>
            </div>

            {/* Warning Box */}
            <div className={styles.warningBox}>
              <div className={styles.warningBoxHeader}>
                <div className={styles.warningBoxIcon}>
                  <ExclamationTriangleIcon />
                </div>
                <h3 className={styles.warningBoxTitle}>Lưu ý quan trọng</h3>
              </div>
              <p className={styles.warningBoxText}>
                Một số sàn TMĐT vẫn khấu trừ thuế ngay cả khi doanh thu cả năm dưới ngưỡng. Số tiền đã khấu trừ có thể được hoàn hoặc quyết toán khi bạn kê khai thuế.
              </p>
              <Link href="/kien-thuc/cach-tinh-thue-ban-hang-tren-shopee-tiktok" className={styles.warningBoxLink}>
                Xem chi tiết tại bài viết: Cách tính thuế bán hàng trên Shopee, TikTok Shop
                <span className={styles.linkArrow}>
                  <ArrowRightIcon />
                </span>
              </Link>
            </div>

            {/* Đối tượng áp dụng */}
            <h2 className={styles.sectionHeading}>Đối tượng áp dụng</h2>
            <p>
              Quy định về ngưỡng doanh thu không chịu thuế áp dụng cho hộ kinh doanh, cá nhân kinh doanh có hoạt động bán hàng hóa, cung cấp dịch vụ trên các nền tảng thương mại điện tử, mạng xã hội, website hoặc các hình thức khác.
            </p>
            <p>
              Nếu tổng doanh thu trong năm dương lịch không vượt quá 1.000.000.000 VNĐ thì không phải nộp thuế GTGT và thuế TNCN. Nếu vượt ngưỡng, bạn cần khai và nộp thuế theo quy định.
            </p>

            {/* Căn cứ pháp lý */}
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
                      Nghị quyết 198/2025/QH15 về một số cơ chế, chính sách đặc biệt phát triển kinh tế tư nhân
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://vanban.chinhphu.vn/?pageid=27160&docid=217111"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.legalDocLink}
                    >
                      Nghị định 68/2026/NĐ-CP quy định chính sách thuế và quản lý thuế đối với hộ kinh doanh, cá nhân kinh doanh
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://vanban.chinhphu.vn/?pageid=27160&docid=217960"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.legalDocLink}
                    >
                      Nghị định 141/2026/NĐ-CP về sửa đổi, bổ sung chính sách thuế hộ kinh doanh, cá nhân kinh doanh
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* FAQ */}
            <h2 className={styles.sectionHeading}>Câu hỏi thường gặp</h2>
            <FaqAccordion items={faqItems} />

            {/* Bài viết liên quan */}
            <h2 className={styles.sectionHeading}>Bài viết liên quan</h2>
            {/* TODO: query content_page (status='approved', pageType='knowledge') */}
            <div className={styles.relatedGrid}>
              <ArticleCard
                href="/kien-thuc/cach-tinh-thue-ban-hang-tren-shopee-tiktok"
                icon={<CartIcon />}
                title="Cách tính thuế bán hàng trên Shopee, TikTok Shop"
                date="17/08/2026"
                showCalendarIcon
              />
              <ArticleCard
                href="/kien-thuc/nghi-dinh-141-2026-thay-doi-gi"
                icon={<ScaleIcon />}
                title="Nghị định 141/2026 thay đổi gì về thuế hộ kinh doanh?"
                date="17/08/2026"
                showCalendarIcon
              />
            </div>

            {/* Disclaimer */}
            <div className={styles.disclaimerBox}>
              <span className={styles.disclaimerIcon}>
                <CheckCircleIcon />
              </span>
              <p className={styles.disclaimerText}>
                Nội dung được tổng hợp từ các văn bản pháp luật hiện hành và cập nhật liên tục.
              </p>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
