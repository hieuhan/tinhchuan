import React from 'react';
import type { Metadata } from 'next';
import { FileTextIcon } from '@/components/icons';
import { Breadcrumb } from '@/components/ui/Breadcrumb/Breadcrumb';
import { ArticleCard } from '@/components/ui/ArticleCard/ArticleCard';
import { generateBreadcrumbSchema } from '@/lib/seo/schema';
import styles from './kien-thuc.module.css';

export const metadata: Metadata = {
  title: 'Thư viện kiến thức Thuế cá nhân & Bán hàng online - TinhChuan.vn',
  description:
    'Tổng hợp bài viết hướng dẫn, phân tích quy định pháp luật và giải đáp thắc mắc thuế cá nhân, bán hàng online cho người Việt Nam.',
};

const breadcrumbItems = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Kiến thức' },
];

// TODO Phase 2: query content_page (status='approved', pageType='knowledge') từ DB thay cho mảng hardcode
const knowledgeArticles = [
  {
    href: '/kien-thuc/nguong-doanh-thu-chiu-thue-ban-hang-online-2026',
    title: 'Ngưỡng doanh thu chịu thuế bán hàng online 2026 là bao nhiêu?',
    description:
      'Chi tiết quy định miễn thuế dưới 1 tỷ đồng/năm và cách tính thuế khi doanh thu vượt ngưỡng theo luật mới.',
    date: 'Hiệu lực từ 01/01/2026',
  },
  {
    href: '/kien-thuc/cach-tinh-thue-ban-hang-tren-shopee-tiktok',
    title: 'Cách tính thuế bán hàng trên Shopee, TikTok Shop',
    description:
      'Sàn TMĐT chính thức khấu trừ thuế từ 2026. Hướng dẫn cách tính thuế GTGT 1% + TNCN 0.5% và cách kê khai chuẩn.',
    date: 'Hiệu lực từ 01/01/2026',
  },
  {
    href: '/kien-thuc/nghi-dinh-141-2026-thay-doi-gi',
    title: 'Nghị định 141/2026/NĐ-CP thay đổi gì về thuế bán hàng online?',
    description:
      'Nâng ngưỡng miễn thuế lên 1 tỷ đồng/năm, chấm dứt thuế khoán. Phân tích các điểm mới cốt lõi hộ kinh doanh cần biết.',
    date: 'Hiệu lực từ 01/01/2026',
  },
];

export default function KnowledgePage() {
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <main className={styles.container}>
        <div className={styles.pageHeader}>
          <Breadcrumb items={breadcrumbItems} />
          <h1 className={styles.title}>Kiến thức Thuế cá nhân & Bán hàng online</h1>
          <p className={styles.subtitle}>
            Tổng hợp bài viết hướng dẫn chi tiết, trích dẫn văn bản pháp luật chính thức giúp bạn hiểu rõ nghĩa vụ thuế và tối ưu hoạt động kinh doanh.
          </p>
        </div>

        <div className={styles.articlesGrid}>
          {knowledgeArticles.map((article) => (
            <ArticleCard
              key={article.href}
              href={article.href}
              icon={<FileTextIcon />}
              title={article.title}
              description={article.description}
              date={article.date}
              showCalendarIcon
            />
          ))}
        </div>
      </main>
    </>
  );
}
