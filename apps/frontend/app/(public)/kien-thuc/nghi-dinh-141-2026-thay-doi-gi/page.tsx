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
import styles from './article.module.css';

export const metadata: Metadata = {
  title: 'Nghị định 141/2026 thay đổi gì về thuế hộ kinh doanh? - TinhChuan.vn',
  description:
    'Ngày 29/04/2026, Chính phủ ban hành Nghị định 141/2026/NĐ-CP sửa đổi, bổ sung một số điều của Nghị định 117/2025/NĐ-CP về quản lý thuế đối với hoạt động kinh doanh trên sàn thương mại điện tử và nền tảng số của hộ, cá nhân.',
};

const faqItems: FaqItemData[] = [
  {
    id: 1,
    question: 'Tôi bán trên nhiều sàn thì mỗi sàn tự khấu trừ riêng hay tính gộp?',
    answer: (
      <p>
        Mỗi sàn chỉ khấu trừ dựa trên doanh thu phát sinh trên sàn đó. Tuy nhiên, ngưỡng xét miễn thuế (1 tỷ đồng/năm) được tính trên TỔNG doanh thu từ tất cả các kênh. Nếu tổng vượt ngưỡng, bạn phải nộp thuế; nếu không, có thể làm thủ tục hoàn thuế.
      </p>
    ),
  },
  {
    id: 2,
    question: 'Sàn khấu trừ sai thì tôi làm sao để đòi lại?',
    answer: (
      <p>
        Liên hệ trực tiếp với bộ phận hỗ trợ người bán của sàn để yêu cầu điều chỉnh. Nếu không được giải quyết, bạn có thể khiếu nại lên cơ quan thuế quản lý trực tiếp, kèm theo chứng từ khấu trừ do sàn cấp.
      </p>
    ),
  },
  {
    id: 3,
    question: 'Không có mã số thuế thì sàn xử lý thế nào?',
    answer: (
      <p>
        Nếu bạn không cung cấp mã số thuế, sàn vẫn khấu trừ thuế theo tỷ lệ mặc định nhưng sẽ gặp khó khăn khi đối soát và hoàn thuế sau này. Khuyến nghị đăng ký mã số thuế cá nhân tại cơ quan thuế gần nhất.
      </p>
    ),
  },
];

export default function Decree141ArticlePage() {
  return (
    <>
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
                <strong>Nâng ngưỡng doanh thu không chịu thuế từ 100 triệu lên 1 tỷ đồng/năm:</strong> Hộ, cá nhân có doanh thu từ hoàn kinh doanh trên sàn TMĐT, nền tảng số không vượt quá 1 tỷ đồng/năm thì không phải nộp thuế GTGT và TNCN.
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
                    <Link href="/van-ban/nghi-dinh-141-2026-nd-cp" className={styles.legalDocLink}>
                      Nghị định 141/2026/NĐ-CP ngày 29/04/2026 của Chính phủ
                    </Link>
                  </li>
                  <li>
                    <Link href="/van-ban/nghi-dinh-68-2026-nd-cp" className={styles.legalDocLink}>
                      Nghị định 68/2026/NĐ-CP ngày 05/03/2026 của Chính phủ
                    </Link>
                  </li>
                  <li>
                    <Link href="/van-ban/thong-tu-40-2021-tt-btc" className={styles.legalDocLink}>
                      Thông tư 40/2021/TT-BTC ngày 01/06/2021 của Bộ Tài chính
                    </Link>
                  </li>
                  <li>
                    <Link href="/van-ban/cong-van-4100-tct-kk" className={styles.legalDocLink}>
                      Công văn 4100/TCT-KK ngày 16/10/2023 của Tổng cục Thuế
                    </Link>
                  </li>
                </ul>
              </div>
              <Link href="/van-ban/nghi-dinh-141-2026-nd-cp" className={styles.legalLink}>
                Xem văn bản gốc
                <span className={styles.linkArrow}>
                  <ArrowRightIcon />
                </span>
              </Link>
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
                  <li>
                    <span className={styles.historyDate}>17/10/2023: </span>
                    Công văn 4100/TCT-KK - hướng dẫn thực hiện
                  </li>
                </ul>
              </div>
              <Link href="/van-ban" className={styles.historyLink}>
                Xem chi tiết
                <span className={styles.linkArrow}>
                  <ArrowRightIcon />
                </span>
              </Link>
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
