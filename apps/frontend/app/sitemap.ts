import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tinhchuan.vn';
  const currentDate = new Date();

  // TODO Phase 2: Khi có CMS thật, lastModified của các bài viết Kiến thức sẽ lấy từ content_page.contentReviewedAt
  return [
    {
      url: `${baseUrl}/`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/tool/thue-ban-hang-online`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/kien-thuc/nguong-doanh-thu-chiu-thue-ban-hang-online-2026`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/kien-thuc/cach-tinh-thue-ban-hang-tren-shopee-tiktok`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/kien-thuc/nghi-dinh-141-2026-thay-doi-gi`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
