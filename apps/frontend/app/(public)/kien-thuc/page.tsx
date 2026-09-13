import React from 'react';
import type { Metadata } from 'next';
import { db, contentPage } from '@tinhchuan/database';
import { eq, desc } from 'drizzle-orm';
import { FileTextIcon, CartIcon, ScaleIcon } from '@/components/icons';
import { Breadcrumb } from '@/components/ui/Breadcrumb/Breadcrumb';
import { ArticleCard } from '@/components/ui/ArticleCard/ArticleCard';
import { generateBreadcrumbSchema } from '@/lib/seo/schema';
import styles from './kien-thuc.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Thư viện kiến thức Thuế cá nhân & Bán hàng online - TinhChuan.vn',
  description:
    'Tổng hợp bài viết hướng dẫn, phân tích quy định pháp luật và giải đáp thắc mắc thuế cá nhân, bán hàng online cho người Việt Nam.',
};

const breadcrumbItems = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Kiến thức' },
];

function getArticleIcon(slug: string) {
  if (slug.includes('shopee') || slug.includes('tiktok') || slug.includes('doanh-thu')) {
    return <CartIcon />;
  }
  if (slug.includes('nghi-dinh') || slug.includes('nghi-quyet') || slug.includes('luat')) {
    return <ScaleIcon />;
  }
  return <FileTextIcon />;
}

export default async function KnowledgePage() {
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  let articles: Array<{
    slug: string;
    title: string;
    metaDescription: string;
    publishedAt: Date | null;
  }> = [];

  try {
    articles = await db
      .select({
        slug: contentPage.slug,
        title: contentPage.title,
        metaDescription: contentPage.metaDescription,
        publishedAt: contentPage.publishedAt,
      })
      .from(contentPage)
      .where(eq(contentPage.status, 'published'))
      .orderBy(desc(contentPage.publishedAt));
  } catch (err) {
    console.error('[KnowledgePage] Lỗi truy vấn bài viết từ DB:', err);
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <Breadcrumb items={breadcrumbItems} />
          <h1 className={styles.title}>Kiến thức Thuế cá nhân & Bán hàng online</h1>
          <p className={styles.subtitle}>
            Tổng hợp bài viết hướng dẫn chi tiết, trích dẫn văn bản pháp luật chính thức giúp bạn hiểu rõ nghĩa vụ thuế và tối ưu hoạt động kinh doanh.
          </p>
        </div>

        <div className={styles.articlesGrid}>
          {articles.map((article) => {
            const dateStr = article.publishedAt
              ? new Date(article.publishedAt).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
              : 'Hiệu lực từ 01/01/2026';

            return (
              <ArticleCard
                key={article.slug}
                href={`/kien-thuc/${article.slug}`}
                icon={getArticleIcon(article.slug)}
                title={article.title}
                description={article.metaDescription}
                date={dateStr}
                showCalendarIcon
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
