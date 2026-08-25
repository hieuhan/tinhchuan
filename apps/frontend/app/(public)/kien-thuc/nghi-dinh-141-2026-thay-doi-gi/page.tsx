import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  HouseIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CalculatorIcon,
  FileTextIcon,
  ClockHistoryIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  CartIcon,
  TrendingUpIcon,
} from '@/components/icons';
import { Breadcrumb } from '@/components/ui/Breadcrumb/Breadcrumb';
import { FaqAccordion } from '@/components/ui/FaqAccordion/FaqAccordion';
import type { FaqItemData } from '@/components/ui/FaqAccordion/FaqAccordion';
import { ArticleCard } from '@/components/ui/ArticleCard/ArticleCard';
import { generateBreadcrumbSchema, generateFaqSchema } from '@/lib/seo/schema';
import styles from './article.module.css';

export const metadata: Metadata = {
  title: 'Nghị định 141/2026 thay đổi gì về thuế hộ kinh doanh? - TinhChuan.vn',
  description:
    'Ngày 29/04/2026, Chính phủ ban hành Nghị định 141/2026/NĐ-CP sửa đổi, bổ sung một số điều của Nghị định 117/2025/NĐ-CP về quản lý thuế đối với hoạt động kinh doanh trên sàn thương mại điện tử và nền tảng số của hộ, cá nhân.',
};

const breadcrumbItems = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Kiến thức', href: '/kien-thuc' },
  { label: 'Nghị định 141/2026 thay đổi gì' },
];

const faqItems: FaqItemData[] = [
  {
    id: 1,
    question: 'Nghị định 141/2026/NĐ-CP có điểm gì mới nổi bật nhất?',
    answer: (
      <p>
        Thay đổi quan trọng nhất là nâng ngưỡng doanh thu không chịu thuế GTGT và TNCN cho hộ, cá nhân kinh doanh trên sàn TMĐT từ 500 triệu đồng lên 1 tỷ đồng/năm.
      </p>
    ),
    answerPlainText:
      'Thay đổi quan trọng nhất là nâng ngưỡng doanh thu không chịu thuế GTGT và TNCN cho hộ, cá nhân kinh doanh trên sàn TMĐT từ 500 triệu đồng lên 1 tỷ đồng/năm.',
  },
  {
    id: 2,
    question: 'Nghị định 141/2026 có hiệu lực hồi tố từ khi nào?',
    answer: (
      <p>
        Nghị định 141/2026/NĐ-CP được ban hành ngày 29/04/2026 nhưng áp dụng hiệu lực hồi tố từ ngày 01/01/2026 đối với các khoản thu phát sinh từ đầu năm.
      </p>
    ),
    answerPlainText:
      'Nghị định 141/2026/NĐ-CP được ban hành ngày 29/04/2026 nhưng áp dụng hiệu lực hồi tố từ ngày 01/01/2026 đối với các khoản thu phát sinh từ đầu năm.',
  },
  {
    id: 3,
    question: 'Nếu đã bị sàn khấu trừ thuế trước ngày 29/04/2026 mà doanh thu cả năm ≤ 1 tỷ thì xử lý thế nào?',
    answer: (
      <p>
        Trường hợp số thuế đã bị khấu trừ nhưng cuối năm tổng doanh thu cả năm từ mọi kênh không quá 1 tỷ đồng, người bán được đề nghị cơ quan thuế hoàn lại hoặc bù trừ số thuế đã nộp thừa khi quyết toán.
      </p>
    ),
    answerPlainText:
      'Trường hợp số thuế đã bị khấu trừ nhưng cuối năm tổng doanh thu cả năm từ mọi kênh không quá 1 tỷ đồng, người bán được đề nghị cơ quan thuế hoàn lại hoặc bù trừ số thuế đã nộp thừa khi quyết toán.',
  },
  {
    id: 4,
    question: 'Nghị định 141/2026 có thay đổi trách nhiệm khấu trừ của sàn TMĐT không?',
    answer: (
      <p>
        Cơ chế khấu trừ và nộp thay thuế của các sàn TMĐT (Shopee, TikTok Shop...) vẫn được giữ nguyên; các sàn vẫn thực hiện nộp thay theo tỷ lệ % quy định trên doanh thu từng đơn hàng.
      </p>
    ),
    answerPlainText:
      'Cơ chế khấu trừ và nộp thay thuế của các sàn TMĐT (Shopee, TikTok Shop...) vẫn được giữ nguyên; các sàn vẫn thực hiện nộp thay theo tỷ lệ % quy định trên doanh thu từng đơn hàng.',
  },
];

export default function Decree141ArticlePage() {
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
          { label: 'Nghị định 141/2026 thay đổi gì' },
        ]}
      />

      {/* Article Header */}
      <section className={styles.articleHeader}>
        <div className={styles.container}>
          <h1 className={styles.articleTitle}>Nghị định 141/2026 thay đổi gì</h1>
          <div className={styles.articleMetaRow}>
            <span className={styles.articleMeta}>
              <span className={styles.metaIcon}>
                <CalendarIcon />
              </span>
              Cập nhật lần cuối: 18/08/2026
            </span>
            <span className={styles.badgeTag}>Tin tức</span>
          </div>
          <p className={styles.articleIntro}>
            Ngày 29/04/2026, Chính phủ ban hành Nghị định 141/2026/NĐ-CP sửa đổi, bổ sung một số điều của Nghị định 117/2025/NĐ-CP về quản lý thuế đối với hoạt động kinh doanh trên sàn thương mại điện tử và nền tảng số của hộ, cá nhân.
          </p>
        </div>
      </section>

      {/* Retroactive Warning Banner */}
      <section className={styles.retroactiveSection}>
        <div className={styles.container}>
          <div className={styles.retroactiveBanner}>
            <span className={styles.retroactiveIcon}>
              <ExclamationTriangleIcon />
            </span>
            <p className={styles.retroactiveText}>
              <strong>Hiệu lực hồi tố</strong> — áp dụng cho cả giai đoạn trước ngày ban hành
            </p>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className={styles.timelineSection}>
        <div className={styles.container}>
          <div className={styles.timelineCard}>
            <div className={styles.timelineTrack}>
              <div className={styles.timelineLine}></div>
              <div className={styles.timelineItem}>
                <div className={`${styles.timelineDot} ${styles.timelineDotActive}`}></div>
                <div className={styles.timelineContent}>
                  <div className={styles.timelineDate}>01/01/2026</div>
                  <div className={styles.timelineTitle}>Ngày hiệu lực hồi tố</div>
                  <p className={styles.timelineDesc}>
                    Áp dụng cho các khoản thu đã phát sinh trước thời điểm Nghị định 141 có hiệu lực.
                  </p>
                </div>
              </div>
              <div className={styles.timelineItem}>
                <div className={styles.timelineDot}></div>
                <div className={styles.timelineContent}>
                  <div className={styles.timelineDate}>05/03/2026</div>
                  <div className={styles.timelineTitle}>Nghị định 68 ban hành</div>
                  <p className={styles.timelineDesc}>
                    Chính phủ ban hành Nghị định 68/2026/NĐ-CP quy định về quản lý thuế đối với kinh doanh trên sàn TMĐT và nền tảng số.
                  </p>
                </div>
              </div>
              <div className={styles.timelineItem}>
                <div className={styles.timelineDot}></div>
                <div className={styles.timelineContent}>
                  <div className={styles.timelineDate}>29/04/2026</div>
                  <div className={styles.timelineTitle}>Nghị định 141 sửa ngưỡng lên 1 tỷ đồng/năm</div>
                  <p className={styles.timelineDesc}>
                    Sửa đổi, bổ sung Nghị định 68, điều chỉnh ngưỡng doanh thu không chịu thuế lên 1 tỷ đồng/năm.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Những thay đổi chính */}
      <section className={styles.changesSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionHeading}>Những thay đổi chính</h2>
          <div className={styles.changesList}>
            <div className={styles.changeItem}>
              <div className={styles.changeIcon}>
                <CheckCircleIcon />
              </div>
              <div className={styles.changeContent}>
                <strong>Nâng ngưỡng doanh thu không chịu thuế từ 500 triệu lên 1 tỷ đồng/năm:</strong> Hộ, cá nhân có doanh thu từ hoạt động kinh doanh trên sàn TMĐT, nền tảng số không vượt quá 1 tỷ đồng/năm thì không phải nộp thuế GTGT và TNCN.
              </div>
            </div>
            <div className={styles.changeItem}>
              <div className={styles.changeIcon}>
                <CheckCircleIcon />
              </div>
              <div className={styles.changeContent}>
                <strong>Áp dụng hồi tố từ 01/01/2026:</strong> Mức ngưỡng mới được áp dụng từ đầu năm 2026, kể cả đối với các khoản thu đã phát sinh trước thời điểm Nghị định 141 có hiệu lực.
              </div>
            </div>
            <div className={styles.changeItem}>
              <div className={styles.changeIcon}>
                <CheckCircleIcon />
              </div>
              <div className={styles.changeContent}>
                <strong>Cơ chế khấu trừ và nộp thay không thay đổi:</strong> Các sàn TMĐT vẫn thực hiện khấu trừ và nộp thay thuế GTGT và TNCN theo tỷ lệ % trên doanh thu cho người bán.
              </div>
            </div>
            <div className={styles.changeItem}>
              <div className={styles.changeIcon}>
                <CheckCircleIcon />
              </div>
              <div className={styles.changeContent}>
                <strong>Bổ sung quy định về hoàn thuế/điều chỉnh:</strong> Trường hợp số thuế đã khấu trừ lớn hơn số thuế phải nộp (do doanh thu cả năm không vượt ngưỡng 1 tỷ), người bán có thể đề nghị hoàn hoặc bù trừ khi quyết toán.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaBox}>
            <div className={styles.ctaBoxLeft}>
              <div className={styles.ctaBoxHeader}>
                <div className={styles.ctaBoxIcon}>
                  <CalculatorIcon />
                </div>
                <h3 className={styles.ctaBoxTitle}>Tính thử thuế bán hàng của bạn ngay</h3>
              </div>
              <p className={styles.ctaBoxText}>
                Ước tính nhanh số thuế GTGT và TNCN bị khấu trừ theo doanh thu thực tế trên các sàn TMĐT (Shopee, TikTok Shop, Lazada,...).
              </p>
            </div>
            <Link href="/tool/thue-ban-hang-online" className={styles.btnCtaBox}>
              Sử dụng công cụ ngay
              <span className={styles.btnArrow}>
                <ArrowRightIcon />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.faqSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionHeading}>Câu hỏi thường gặp</h2>
          <FaqAccordion items={faqItems} />
        </div>
      </section>

      {/* Info Cards (Legal + History) */}
      <section className={styles.infoCardsSection}>
        <div className={styles.container}>
          <div className={styles.infoCardsGrid}>
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
                      href="https://vanban.chinhphu.vn/?pageid=27160&docid=217960"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.legalDocLink}
                    >
                      Nghị định 141/2026/NĐ-CP ngày 29/04/2026 của Chính phủ về sửa đổi, bổ sung chính sách thuế hộ kinh doanh, cá nhân kinh doanh
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://vanban.chinhphu.vn/?pageid=27160&docid=217111"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.legalDocLink}
                    >
                      Nghị định 68/2026/NĐ-CP ngày 05/03/2026 của Chính phủ quy định chính sách thuế và quản lý thuế đối với hộ kinh doanh, cá nhân kinh doanh
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://congbao.chinhphu.vn/van-ban/thong-tu-so-40-2021-tt-btc-33850.htm"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.legalDocLink}
                    >
                      Thông tư 40/2021/TT-BTC ngày 01/06/2021 của Bộ Tài chính hướng dẫn thuế GTGT, TNCN và quản lý thuế đối với hộ kinh doanh, cá nhân kinh doanh
                    </a>
                  </li>
                </ul>
              </div>
              <a
                href="https://vanban.chinhphu.vn/?pageid=27160&docid=217960"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.legalLink}
              >
                Xem văn bản gốc
                <span className={styles.linkArrow}>
                  <ArrowRightIcon />
                </span>
              </a>
            </div>

            {/* Lịch sử thay đổi quy định */}
            <div className={styles.historyCard}>
              <div className={styles.historyHeader}>
                <div className={styles.historyIcon}>
                  <ClockHistoryIcon />
                </div>
                <h2 className={styles.historyTitle}>Lịch sử thay đổi quy định</h2>
              </div>
              <div className={styles.historyContent}>
                <ul className={styles.historyList}>
                  <li>
                    <span className={styles.historyDate}>29/04/2026: </span>
                    Nghị định 141/2026/NĐ-CP - sửa ngưỡng lên 1 tỷ đồng/năm
                  </li>
                  <li>
                    <span className={styles.historyDate}>05/03/2026: </span>
                    Nghị định 68/2026/NĐ-CP - ban hành
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bài viết liên quan */}
      <section className={styles.relatedSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionHeading}>Bài viết liên quan</h2>
          {/* TODO: query content_page (status='approved', pageType='knowledge') */}
          <div className={styles.relatedGrid}>
            <ArticleCard
              href="/kien-thuc/cach-tinh-thue-ban-hang-tren-shopee-tiktok"
              icon={<CartIcon />}
              title="Cách tính thuế bán hàng trên Shopee, TikTok Shop"
              date="18/08/2026"
              showCalendarIcon
            />
            <ArticleCard
              href="/kien-thuc/nguong-doanh-thu-chiu-thue-ban-hang-online-2026"
              icon={<TrendingUpIcon />}
              title="Ngưỡng doanh thu chịu thuế mới nhất năm 2026"
              date="16/08/2026"
              showCalendarIcon
            />
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className={styles.disclaimerSection}>
        <div className={styles.container}>
          <div className={styles.disclaimerBox}>
            <span className={styles.disclaimerIcon}>
              <CheckCircleIcon />
            </span>
            <p className={styles.disclaimerText}>
              Kết quả chỉ mang tính tham khảo, không phải tư vấn thuế chính thức.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
