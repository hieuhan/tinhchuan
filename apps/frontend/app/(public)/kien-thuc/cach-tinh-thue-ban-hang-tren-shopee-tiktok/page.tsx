import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  HouseIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CalculatorIcon,
  FileTextIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  ScaleIcon,
} from '@/components/icons';
import { Breadcrumb } from '@/components/ui/Breadcrumb/Breadcrumb';
import { FaqAccordion } from '@/components/ui/FaqAccordion/FaqAccordion';
import type { FaqItemData } from '@/components/ui/FaqAccordion/FaqAccordion';
import { ArticleCard } from '@/components/ui/ArticleCard/ArticleCard';
import { generateBreadcrumbSchema, generateFaqSchema } from '@/lib/seo/schema';
import styles from './article.module.css';

export const metadata: Metadata = {
  title: 'Cách tính thuế bán hàng trên Shopee, TikTok Shop - TinhChuan.vn',
  description:
    'Theo quy định tại Nghị định 117/2025/NĐ-CP, các sàn thương mại điện tử có chức năng thanh toán có trách nhiệm khấu trừ, nộp thay thuế GTGT và thuế TNCN cho hộ kinh doanh.',
};

const breadcrumbItems = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Kiến thức', href: '/kien-thuc' },
  { label: 'Cách tính thuế bán hàng trên Shopee, TikTok Shop' },
];

const faqItems: FaqItemData[] = [
  {
    id: 1,
    question: 'Tôi bán trên nhiều sàn thì mỗi sàn tự khấu trừ riêng hay tính gộp?',
    answer: (
      <p>
        Mỗi sàn chỉ khấu trừ dựa trên doanh thu phát sinh trên sàn đó. Tuy nhiên, ngưỡng xét miễn thuế (1 tỷ đồng/năm) được tính trên TỔNG doanh thu từ tất cả các kênh. Nếu tổng vượt ngưỡng, bạn phải nộp thuế; nếu không, có thể làm thủ tục hoàn thuế.
      </p>
    ),
    answerPlainText:
      'Mỗi sàn chỉ khấu trừ dựa trên doanh thu phát sinh trên sàn đó. Tuy nhiên, ngưỡng xét miễn thuế (1 tỷ đồng/năm) được tính trên TỔNG doanh thu từ tất cả các kênh. Nếu tổng vượt ngưỡng, bạn phải nộp thuế; nếu không, có thể làm thủ tục hoàn thuế.',
  },
  {
    id: 2,
    question: 'Sàn khấu trừ sai thì tôi làm sao để đòi lại?',
    answer: (
      <p>
        Liên hệ trực tiếp với bộ phận hỗ trợ người bán của sàn để yêu cầu điều chỉnh. Nếu không được giải quyết, bạn có thể khiếu nại lên cơ quan thuế quản lý trực tiếp, kèm theo chứng từ khấu trừ do sàn cấp.
      </p>
    ),
    answerPlainText:
      'Liên hệ trực tiếp với bộ phận hỗ trợ người bán của sàn để yêu cầu điều chỉnh. Nếu không được giải quyết, bạn có thể khiếu nại lên cơ quan thuế quản lý trực tiếp, kèm theo chứng từ khấu trừ do sàn cấp.',
  },
  {
    id: 3,
    question: 'Không có mã số thuế thì sàn xử lý thế nào?',
    answer: (
      <p>
        Nếu bạn không cung cấp mã số thuế, sàn vẫn khấu trừ thuế theo tỷ lệ mặc định nhưng sẽ gặp khó khăn khi đối soát và hoàn thuế sau này. Khuyến nghị đăng ký mã số thuế cá nhân tại cơ quan thuế gần nhất.
      </p>
    ),
    answerPlainText:
      'Nếu bạn không cung cấp mã số thuế, sàn vẫn khấu trừ thuế theo tỷ lệ mặc định nhưng sẽ gặp khó khăn khi đối soát và hoàn thuế sau này. Khuyến nghị đăng ký mã số thuế cá nhân tại cơ quan thuế gần nhất.',
  },
];

export default function KnowledgeArticlePage() {
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
          { label: 'Cách tính thuế bán hàng trên Shopee, TikTok Shop' },
        ]}
      />

      {/* Article Header */}
      <section className={styles.articleHeader}>
        <div className={styles.container}>
          <h1 className={styles.articleTitle}>Cách tính thuế bán hàng trên Shopee, TikTok Shop</h1>
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
              Theo quy định tại Nghị định 117/2025/NĐ-CP, các sàn thương mại điện tử có chức năng thanh toán (Shopee, TikTok Shop, Lazada, Tiki, ...) có trách nhiệm khấu trừ, nộp thay thuế giá trị gia tăng (GTGT) và thuế thu nhập cá nhân (TNCN) cho hộ kinh doanh, cá nhân kinh doanh trên nền tảng.
            </p>
            <p>
              Sàn sẽ tự động khấu trừ theo tỷ lệ % trên doanh thu trước khi thanh toán cho người bán. Người bán chỉ cần cung cấp đúng mã số thuế (MST) để sàn kê khai và nộp thuế thay.
            </p>
            <p>
              Nếu doanh thu của bạn thuộc diện không phải nộp thuế (ví dụ: dưới ngưỡng 1 tỷ đồng/năm theo quy định), người bán vẫn có thể được hoàn hoặc quyết toán lại thuế vào cuối năm.
            </p>

            {/* Section heading */}
            <h2 className={styles.sectionHeading}>Tỷ lệ khấu trừ thuế áp dụng trên các sàn TMĐT phổ biến</h2>

            {/* Table tỷ lệ khấu trừ */}
            <div className={styles.rateTableCard}>
              {/* TODO: nối Formula Engine, không giữ số tĩnh */}
              {/* Desktop: dùng table */}
              <div className={styles.tableWrapperDesktop}>
                <table className={styles.rateTable}>
                  <thead>
                    <tr>
                      <th rowSpan={2}>
                        Doanh thu<br />(trước VAT)
                      </th>
                      <th colSpan={2}>Tỷ lệ khấu trừ</th>
                      <th rowSpan={2}>
                        Tổng<br />tỷ lệ
                      </th>
                      <th rowSpan={2}>
                        Ví dụ: Doanh thu 10.000.000đ<br />Số tiền bị khấu trừ
                      </th>
                    </tr>
                    <tr>
                      <th>Thuế GTGT</th>
                      <th>Thuế TNCN</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Dưới 100 triệu đồng/tháng</td>
                      <td>1%</td>
                      <td>0,5%</td>
                      <td>1,5%</td>
                      <td>150.000đ</td>
                    </tr>
                    <tr>
                      <td>Từ 100 đến 300 triệu đồng/tháng</td>
                      <td>2%</td>
                      <td>1%</td>
                      <td>3%</td>
                      <td>300.000đ</td>
                    </tr>
                    <tr>
                      <td>Trên 300 triệu đồng/tháng</td>
                      <td>3%</td>
                      <td>1,5%</td>
                      <td>4,5%</td>
                      <td>450.000đ</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Mobile: dùng card stack */}
              <div className={styles.rateCardsMobile}>
                <div className={styles.rateCardItem}>
                  <div className={styles.rateCardHeader}>Dưới 100 triệu đồng/tháng</div>
                  <div className={styles.rateCardRow}>
                    <span className={styles.rateCardLabel}>Thuế GTGT</span>
                    <span className={styles.rateCardValue}>1%</span>
                  </div>
                  <div className={styles.rateCardRow}>
                    <span className={styles.rateCardLabel}>Thuế TNCN</span>
                    <span className={styles.rateCardValue}>0,5%</span>
                  </div>
                  <div className={styles.rateCardRow}>
                    <span className={styles.rateCardLabel}>Tổng tỷ lệ</span>
                    <span className={`${styles.rateCardValue} ${styles.rateCardTotal}`}>1,5%</span>
                  </div>
                  <div className={`${styles.rateCardRow} ${styles.rateCardExample}`}>
                    <span className={styles.rateCardLabel}>Ví dụ 10.000.000đ bị khấu trừ</span>
                    <span className={styles.rateCardValue}>150.000đ</span>
                  </div>
                </div>
                <div className={styles.rateCardItem}>
                  <div className={styles.rateCardHeader}>Từ 100 đến 300 triệu đồng/tháng</div>
                  <div className={styles.rateCardRow}>
                    <span className={styles.rateCardLabel}>Thuế GTGT</span>
                    <span className={styles.rateCardValue}>2%</span>
                  </div>
                  <div className={styles.rateCardRow}>
                    <span className={styles.rateCardLabel}>Thuế TNCN</span>
                    <span className={styles.rateCardValue}>1%</span>
                  </div>
                  <div className={styles.rateCardRow}>
                    <span className={styles.rateCardLabel}>Tổng tỷ lệ</span>
                    <span className={`${styles.rateCardValue} ${styles.rateCardTotal}`}>3%</span>
                  </div>
                  <div className={`${styles.rateCardRow} ${styles.rateCardExample}`}>
                    <span className={styles.rateCardLabel}>Ví dụ 10.000.000đ bị khấu trừ</span>
                    <span className={styles.rateCardValue}>300.000đ</span>
                  </div>
                </div>
                <div className={styles.rateCardItem}>
                  <div className={styles.rateCardHeader}>Trên 300 triệu đồng/tháng</div>
                  <div className={styles.rateCardRow}>
                    <span className={styles.rateCardLabel}>Thuế GTGT</span>
                    <span className={styles.rateCardValue}>3%</span>
                  </div>
                  <div className={styles.rateCardRow}>
                    <span className={styles.rateCardLabel}>Thuế TNCN</span>
                    <span className={styles.rateCardValue}>1,5%</span>
                  </div>
                  <div className={styles.rateCardRow}>
                    <span className={styles.rateCardLabel}>Tổng tỷ lệ</span>
                    <span className={`${styles.rateCardValue} ${styles.rateCardTotal}`}>4,5%</span>
                  </div>
                  <div className={`${styles.rateCardRow} ${styles.rateCardExample}`}>
                    <span className={styles.rateCardLabel}>Ví dụ 10.000.000đ bị khấu trừ</span>
                    <span className={styles.rateCardValue}>450.000đ</span>
                  </div>
                </div>
              </div>
            </div>

            <p className={styles.tableNote}>
              Lưu ý: Tỷ lệ có thể thay đổi theo từng sàn và từng thời kỳ. Vui lòng theo dõi thông báo mới nhất từ sàn.
            </p>

            {/* Warning Box */}
            <div className={styles.warningBox}>
              <div className={styles.warningBoxHeader}>
                <div className={styles.warningBoxIcon}>
                  <ExclamationTriangleIcon />
                </div>
                <h3 className={styles.warningBoxTitle}>Lưu ý quan trọng</h3>
              </div>
              <p className={styles.warningBoxText}>
                Một số sàn TMĐT vẫn khấu trừ thuế ngay cả khi doanh thu cả năm dưới ngưỡng phải nộp thuế. Việc khấu trừ này là tạm thời, không đồng nghĩa bạn phải nộp thuế nếu doanh thu cả năm nằm dưới ngưỡng. Bạn có thể được hoàn hoặc quyết toán lại thuế khi kê khai cuối năm.
              </p>
              <Link href="/kien-thuc/xu-ly-khi-san-tmdt-khau-tru-thue" className={styles.warningBoxLink}>
                Xem chi tiết cách xử lý tại: Cách xử lý khi sàn TMĐT khấu trừ thuế
                <span className={styles.linkArrow}>
                  <ArrowRightIcon />
                </span>
              </Link>
            </div>

            {/* CTA Box */}
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

            {/* Legal Card */}
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
                      href="https://vanban.chinhphu.vn/?pageid=27160&docid=213883"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.legalDocLink}
                    >
                      Nghị định 117/2025/NĐ-CP ngày 09/06/2025 quy định quản lý thuế đối với hoạt động kinh doanh trên nền tảng thương mại điện tử
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://congbao.chinhphu.vn/van-ban/thong-tu-so-40-2021-tt-btc-33850.htm"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.legalDocLink}
                    >
                      Thông tư 40/2021/TT-BTC ngày 01/06/2021 hướng dẫn thuế GTGT, TNCN và quản lý thuế đối với hộ kinh doanh, cá nhân kinh doanh
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
                href="/kien-thuc/nguong-doanh-thu-chiu-thue-ban-hang-online-2026"
                icon={<TrendingUpIcon />}
                title="Ngưỡng doanh thu chịu thuế bán hàng online 2026 là bao nhiêu?"
                date="18/08/2026"
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
                Kết quả chỉ mang tính tham khảo, không phải tư vấn thuế chính thức.
              </p>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
