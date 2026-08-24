import type { BreadcrumbItem } from '@/components/ui/Breadcrumb/Breadcrumb';
import type { FaqItemData } from '@/components/ui/FaqAccordion/FaqAccordion';

export interface SoftwareAppSchemaOptions {
  name: string;
  description: string;
  url: string;
  applicationCategory?: string;
  operatingSystem?: string;
}

/**
 * Sinh JSON-LD Schema cho FAQPage từ mảng FAQ item đang hiển thị trên UI.
 * Tự động lấy answerPlainText nếu answer chứa JSX, hoặc lấy answer nếu là string.
 */
export function generateFaqSchema(items: FaqItemData[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => {
      let answerText = item.answerPlainText;
      if (!answerText && typeof item.answer === 'string') {
        answerText = item.answer;
      }

      if (!answerText || answerText.trim() === '') {
        throw new Error(
          `FAQ item "${item.question}" thiếu answerPlainText cho JSON-LD Schema. Vui lòng bổ sung answerPlainText trong mảng faqItems.`
        );
      }

      return {
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answerText,
        },
      };
    }),
  };
}

/**
 * Sinh JSON-LD Schema cho SoftwareApplication (Công cụ tính toán trên web).
 */
export function generateSoftwareAppSchema(options: SoftwareAppSchemaOptions) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: options.name,
    description: options.description,
    url: options.url,
    applicationCategory: options.applicationCategory || 'FinanceApplication',
    operatingSystem: options.operatingSystem || 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'VND',
    },
  };
}

/**
 * Sinh JSON-LD Schema cho BreadcrumbList từ mảng BreadcrumbItem đang dùng cho UI component Breadcrumb.
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tinhchuan.vn';

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      const listItem: Record<string, unknown> = {
        '@type': 'ListItem',
        position: index + 1,
        name: item.label,
      };

      if (item.href) {
        const itemUrl = item.href.startsWith('http')
          ? item.href
          : item.href === '/'
            ? `${baseUrl}/`
            : `${baseUrl}${item.href}`;
        listItem.item = itemUrl;
      }

      return listItem;
    }),
  };
}
