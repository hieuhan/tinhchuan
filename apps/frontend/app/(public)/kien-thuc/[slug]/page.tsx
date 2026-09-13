import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import { db, contentPage } from '@tinhchuan/database';
import { eq, and, ne, desc } from 'drizzle-orm';
import {
  HouseIcon,
  CalendarIcon,
  CalculatorIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  CartIcon,
  ScaleIcon,
  FileTextIcon,
} from '@/components/icons';
import { Breadcrumb } from '@/components/ui/Breadcrumb/Breadcrumb';
import { FaqAccordion } from '@/components/ui/FaqAccordion/FaqAccordion';
import type { FaqItemData } from '@/components/ui/FaqAccordion/FaqAccordion';
import { ArticleCard } from '@/components/ui/ArticleCard/ArticleCard';
import { generateBreadcrumbSchema, generateFaqSchema } from '@/lib/seo/schema';
import styles from './article.module.css';

interface DynamicArticlePageProps {
  params: Promise<{ slug: string }>;
}

/** Trích xuất hoặc lấy danh mục icon phù hợp cho card bài viết liên quan */
function getArticleIcon(slug: string) {
  if (slug.includes('shopee') || slug.includes('tiktok') || slug.includes('doanh-thu')) {
    return <CartIcon />;
  }
  if (slug.includes('nghi-dinh') || slug.includes('nghi-quyet') || slug.includes('luat')) {
    return <ScaleIcon />;
  }
  return <FileTextIcon />;
}

export async function generateMetadata({ params }: DynamicArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const [article] = await db
    .select({
      title: contentPage.title,
      metaDescription: contentPage.metaDescription,
    })
    .from(contentPage)
    .where(and(eq(contentPage.slug, slug), eq(contentPage.status, 'published')))
    .limit(1);

  if (!article) {
    return {
      title: 'Không tìm thấy bài viết - TinhChuan.vn',
    };
  }

  return {
    title: `${article.title} - TinhChuan.vn`,
    description: article.metaDescription,
  };
}

export default async function DynamicArticlePage({ params }: DynamicArticlePageProps) {
  const { slug } = await params;

  const [article] = await db
    .select()
    .from(contentPage)
    .where(and(eq(contentPage.slug, slug), eq(contentPage.status, 'published')))
    .limit(1);

  if (!article) {
    notFound();
  }

  // Parse Markdown sang HTML
  const contentHtml = await marked.parse(article.content, { gfm: true });

  // Format FAQ items nếu có
  const rawFaqs = (article.faqItems as any[]) || [];
  const faqItems: FaqItemData[] = rawFaqs.map((item, idx) => ({
    id: item.id || idx + 1,
    question: item.question,
    answer: <p>{typeof item.answer === 'string' ? item.answer : item.answerPlainText}</p>,
    answerPlainText: typeof item.answer === 'string' ? item.answer : (item.answerPlainText || ''),
  }));

  // Schema SEO
  const breadcrumbItems = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Kiến thức', href: '/kien-thuc' },
    { label: article.title },
  ];
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);
  const faqSchema = faqItems.length > 0 ? generateFaqSchema(faqItems) : null;

  // Ngày đăng/cập nhật
  const formattedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

  // Lấy 2 bài viết liên quan khác
  const relatedArticles = await db
    .select({
      id: contentPage.id,
      slug: contentPage.slug,
      title: contentPage.title,
      publishedAt: contentPage.publishedAt,
    })
    .from(contentPage)
    .where(and(eq(contentPage.status, 'published'), ne(contentPage.id, article.id)))
    .orderBy(desc(contentPage.publishedAt))
    .limit(2);

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/', icon: <HouseIcon /> },
          { label: 'Kiến thức', href: '/kien-thuc' },
          { label: article.title },
        ]}
      />

      {/* Article Header */}
      <section className={styles.articleHeader}>
        <div className={styles.container}>
          <h1 className={styles.articleTitle}>{article.title}</h1>
          <p className={styles.articleMeta}>
            <span className={styles.metaIcon}>
              <CalendarIcon />
            </span>
            Cập nhật lần cuối: {formattedDate}
          </p>
        </div>
      </section>

      {/* Article Content */}
      <article className={styles.articleContentSection}>
        <div className={styles.container}>
          <div className={styles.articleBody}>
            {/* HTML nội dung bài viết từ Markdown */}
            <div dangerouslySetInnerHTML={{ __html: contentHtml }} />

            {/* Reusable CTA Box */}
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

            {/* FAQ Accordion nếu bài viết có FAQ */}
            {faqItems.length > 0 && (
              <>
                <h2 className={styles.sectionHeading}>Câu hỏi thường gặp</h2>
                <FaqAccordion items={faqItems} />
              </>
            )}

            {/* Bài viết liên quan */}
            {relatedArticles.length > 0 && (
              <>
                <h2 className={styles.sectionHeading}>Bài viết liên quan</h2>
                <div className={styles.relatedGrid}>
                  {relatedArticles.map((rel) => {
                    const relDate = rel.publishedAt
                      ? new Date(rel.publishedAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : '';
                    return (
                      <ArticleCard
                        key={rel.id}
                        href={`/kien-thuc/${rel.slug}`}
                        icon={getArticleIcon(rel.slug)}
                        title={rel.title}
                        date={relDate}
                        showCalendarIcon
                      />
                    );
                  })}
                </div>
              </>
            )}

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
