import React from 'react';
import type { Metadata } from 'next';
import {
  ArrowRightIcon,
  FileTextIcon,
  CalculatorIcon,
  ShieldCheckIcon,
  RepeatIcon,
  GiftIcon,
  LightningIcon,
  CartIcon,
  ScaleIcon,
} from '@/components/icons';
import { Button } from '@/components/ui/Button/Button';
import { StepCard } from '@/components/ui/StepCard/StepCard';
import { FeatureCard } from '@/components/ui/FeatureCard/FeatureCard';
import { ArticleCard } from '@/components/ui/ArticleCard/ArticleCard';
import { FaqAccordion } from '@/components/ui/FaqAccordion/FaqAccordion';
import type { FaqItemData } from '@/components/ui/FaqAccordion/FaqAccordion';
import { formatDate, formatVnd } from '@/lib/format';
import { resolveActiveTaxRule } from './tool/thue-ban-hang-online/action';
import styles from './home.module.css';

// Render động ở mọi request: tránh Next.js prerender lúc build (tránh lỗi khi DB chưa sẵn sàng lúc Docker build image). Mỗi request tự query DB mới nhất.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tính thuế bán hàng online - TinhChuan.vn',
  description: 'Công cụ giúp bạn xác định nhanh nghĩa vụ thuế theo quy định mới nhất, dựa trên nguồn luật chính thống.',
};

const faqItems: FaqItemData[] = [
  {
    id: 1,
    question: 'Bán dưới 1 tỷ có phải kê khai không?',
    answer: (
      <>
        <p>
          Từ 01/01/2026, theo <strong>Nghị định 141/2026/NĐ-CP</strong> (nâng ngưỡng miễn thuế từ 500 triệu lên 1 tỷ đồng/năm), hộ kinh doanh và cá nhân kinh doanh có doanh thu <strong>từ 1 tỷ đồng/năm trở xuống</strong> được miễn hoàn toàn thuế GTGT và thuế TNCN.
        </p>
        <p>
          Tuy nhiên &quot;miễn thuế&quot; không có nghĩa là không phải làm gì. Bạn vẫn phải <strong>thông báo doanh thu thực tế cả năm</strong> cho cơ quan thuế, chậm nhất là <strong>ngày 31/01 năm sau</strong> (ví dụ: doanh thu năm 2026 thông báo trước 31/01/2027). Đây là nghĩa vụ thông báo để xác nhận thuộc diện miễn, khác với việc kê khai và nộp tiền thuế.
        </p>
      </>
    ),
  },
  {
    id: 2,
    question: 'Sàn TMĐT tự khấu trừ thuế thì sao?',
    answer: (
      <>
        <p>
          Theo <strong>Nghị định 117/2025/NĐ-CP</strong>, các sàn có chức năng thanh toán (Shopee, TikTok Shop, Lazada...) <strong>bắt buộc khấu trừ và nộp thuế thay ngay trên từng đơn hàng</strong>, không phân biệt doanh thu năm của bạn đã vượt ngưỡng 1 tỷ hay chưa - vì sàn không thể biết tổng doanh thu của bạn từ các kênh khác.
        </p>
        <p>
          Nếu cuối năm, <strong>tổng doanh thu từ mọi kênh ≤ 1 tỷ đồng</strong>, bạn được <strong>hoàn lại</strong> toàn bộ số thuế đã bị khấu trừ - làm thủ tục hoàn thuế tại cơ quan thuế nơi cư trú, dùng chứng từ khấu trừ do sàn cấp làm căn cứ. Nếu vượt ngưỡng, số thuế sàn đã nộp thay sẽ được trừ vào nghĩa vụ thuế thực tế phải nộp - bạn không bị nộp trùng hai lần.
        </p>
      </>
    ),
  },
  {
    id: 3,
    question: 'Cách xác định doanh thu khi bán trên nhiều kênh?',
    answer: (
      <>
        <p>
          Doanh thu để xét ngưỡng 1 tỷ là <strong>tổng doanh thu cộng dồn từ tất cả các kênh</strong> - cả online (nhiều sàn TMĐT khác nhau, mạng xã hội) lẫn offline (cửa hàng, bán trực tiếp) - chứ không tính riêng từng kênh.
        </p>
        <p>
          Lưu ý quan trọng: <strong>mỗi sàn chỉ khấu trừ dựa trên doanh thu phát sinh trên sàn đó</strong>, không biết tổng doanh thu đa kênh của bạn. Vì vậy bạn cần tự theo dõi, cộng dồn doanh thu từ mọi nguồn để biết chính xác mình có vượt ngưỡng hay không, và khai đủ khi thông báo doanh thu cuối năm.
        </p>
      </>
    ),
  },
];

export default async function HomePage() {
  // Lấy dữ liệu quy tắc thuế động từ DB/mock ở mỗi request
  let activeRuleInfo: {
    thresholdText: string;
    effectiveDateText: string;
    legalTitleText: string;
  } | null = null;

  try {
    const rule = await resolveActiveTaxRule();
    if (rule) {
      activeRuleInfo = {
        thresholdText: formatVnd(rule.ruleValue.threshold),
        effectiveDateText: formatDate(rule.legalSourceInfo.effectiveDate),
        legalTitleText: rule.legalSourceInfo.documentNumber
          ? `Áp dụng theo ${rule.legalSourceInfo.documentType} ${rule.legalSourceInfo.documentNumber}`
          : rule.legalSourceInfo.title,
      };
    }
  } catch (err) {
    // Vì render động ở mỗi request, khi DB lỗi thì log server và ẩn Status Card để tránh hiển thị thông tin sai căn cứ
    console.error('[HomePage] Lỗi khi truy vấn active tax rule:', err);
    activeRuleInfo = null;
  }

  return (
    <>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                Tính thuế bán hàng online,<br />có căn cứ rõ ràng
              </h1>
              <p className={styles.heroSubtitle}>
                Công cụ giúp bạn xác định nhanh nghĩa vụ thuế theo quy định mới nhất, dựa trên nguồn luật chính thống.
              </p>
              <div className={styles.heroActions}>
                <Button href="/tool/thue-ban-hang-online" variant="primary" icon={<ArrowRightIcon />}>
                  Tính thuế ngay
                </Button>
                <Button href="/kien-thuc/nguong-doanh-thu-chiu-thue-ban-hang-online-2026" variant="link" icon={<ArrowRightIcon />}>
                  Xem kiến thức
                </Button>
              </div>
            </div>
            <div className={styles.heroCard}>
              {activeRuleInfo && (
                <div className={styles.statusCard}>
                  <div className={styles.statusBadge}>
                    <span className={styles.statusDot}></span>
                    Hiệu lực từ {activeRuleInfo.effectiveDateText}
                  </div>
                  <p className={styles.statusLabel}>Ngưỡng doanh thu chịu thuế</p>
                  <p className={styles.statusAmount}>
                    {activeRuleInfo.thresholdText} <span className={styles.statusCurrency}>VNĐ</span>
                  </p>
                  <p className={styles.statusSource}>{activeRuleInfo.legalTitleText}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Cách hoạt động */}
      <section className={styles.howItWorks}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Cách hoạt động</h2>
          <div className={styles.stepsGrid}>
            <StepCard
              step={1}
              icon={<FileTextIcon />}
              title="1. Nhập doanh thu"
              description="Nhập doanh thu trong năm và chọn kênh bán hàng."
            />
            <StepCard
              step={2}
              icon={<CalculatorIcon />}
              title="2. Xem kết quả ngay"
              description="Nhận ngay kết quả thuế phải nộp hoặc thông báo miễn thuế."
            />
            <StepCard
              step={3}
              icon={<ShieldCheckIcon />}
              title="3. Có căn cứ pháp lý rõ ràng"
              description="Mọi kết quả đều được trích dẫn văn bản pháp lý chính thống."
            />
          </div>
        </div>
      </section>

      {/* Vì sao chọn */}
      <section className={styles.features}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Vì sao chọn tinhchuan.vn</h2>
          <div className={styles.featuresGrid}>
            <FeatureCard
              icon={<FileTextIcon />}
              title="Có căn cứ pháp lý"
              description="Trích dẫn văn bản gốc mọi kết quả."
            />
            <FeatureCard
              icon={<RepeatIcon />}
              title="Cập nhật liên tục"
              description="Theo dõi thay đổi luật thuế."
            />
            <FeatureCard
              icon={<GiftIcon />}
              title="Miễn phí sử dụng"
              description="Sử dụng miễn phí, không giới hạn."
            />
            <FeatureCard
              icon={<LightningIcon />}
              title="Tính toán tức thời"
              description="Kết quả nhanh chóng, chính xác, dễ hiểu."
            />
          </div>
        </div>
      </section>

      {/* Kiến thức & FAQ */}
      <section className={styles.knowledgeFaq}>
        <div className={styles.container}>
          <div className={styles.knowledgeFaqGrid}>
            {/* Kiến thức mới cập nhật */}
            <div className={styles.knowledgeSection}>
              <h2 className={styles.sectionTitle}>Kiến thức mới cập nhật</h2>
              {/* TODO: query content_page (status='approved', pageType='knowledge') */}
              <div className={styles.articleList}>
                <ArticleCard
                  href="/kien-thuc/nguong-doanh-thu-chiu-thue-ban-hang-online-2026"
                  icon={<FileTextIcon />}
                  title="Ngưỡng doanh thu chịu thuế bán hàng online 2026 là bao nhiêu?"
                  description="Cập nhật ngưỡng doanh thu chịu thuế và các quy định quan trọng áp dụng từ năm 2026."
                  date="18/08/2026"
                  status="Đang hiệu lực"
                />
                <ArticleCard
                  href="/kien-thuc/cach-tinh-thue-ban-hang-tren-shopee-tiktok"
                  icon={<CartIcon />}
                  title="Cách tính thuế bán hàng trên Shopee, TikTok Shop"
                  description="Hướng dẫn chi tiết cách tính thuế và tỷ lệ khấu trừ khi bán hàng trên sàn TMĐT."
                  date="16/08/2026"
                  status="Đang hiệu lực"
                />
                <ArticleCard
                  href="/kien-thuc/nghi-dinh-141-2026-thay-doi-gi"
                  icon={<ScaleIcon />}
                  title="Nghị định 141/2026 thay đổi gì về thuế hộ kinh doanh?"
                  description="Tổng hợp các điểm mới nổi bật theo Nghị định 141/2026/NĐ-CP."
                  date="15/08/2026"
                  status="Đang hiệu lực"
                />
              </div>
            </div>

            {/* Câu hỏi thường gặp */}
            <div className={styles.faqSection}>
              <h2 className={styles.sectionTitle}>Câu hỏi thường gặp</h2>
              <FaqAccordion items={faqItems} />
            </div>
          </div>
        </div>
      </section>

      {/* Về tinhchuan.vn */}
      <section className={styles.aboutSection}>
        <div className={styles.container}>
          <div className={styles.aboutCard}>
            <div className={styles.aboutIcon}>
              <ShieldCheckIcon />
            </div>
            <div className={styles.aboutContent}>
              <h2 className={styles.aboutTitle}>
                Về <span className={styles.textPrimary}>tinhchuan.vn</span>
              </h2>
              <p className={styles.aboutDesc}>
                TinhChuan.vn là nền tảng tra cứu và tính toán thuế cá nhân tại Việt Nam. Chúng tôi cung cấp công cụ tính thuế dễ dùng, dữ liệu cập nhật liên tục và luôn có căn cứ pháp lý rõ ràng, giúp bạn tuân thủ đúng quy định và yên tâm kinh doanh.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
