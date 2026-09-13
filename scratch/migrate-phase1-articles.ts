import { db, contentPage } from '@tinhchuan/database';
import { eq } from 'drizzle-orm';

const articles = [
  {
    slug: 'nguong-doanh-thu-chiu-thue-ban-hang-online-2026',
    title: 'Ngưỡng doanh thu chịu thuế bán hàng online 2026 là bao nhiêu?',
    metaDescription: 'Từ ngày 01/01/2026, ngưỡng doanh thu không chịu thuế đối với hộ, cá nhân kinh doanh bán hàng online được điều chỉnh từ 500 triệu đồng lên 1 tỷ đồng doanh thu/năm.',
    pageType: 'knowledge' as const,
    status: 'published' as const,
    publishedAt: new Date('2026-08-18T00:00:00.000Z'),
    content: `Từ ngày 01/01/2026, ngưỡng doanh thu không chịu thuế đối với hộ, cá nhân kinh doanh bán hàng online được điều chỉnh từ 500 triệu đồng lên 1 tỷ đồng doanh thu/năm.

Quy định mới giúp mở rộng phạm vi hỗ trợ cho người kinh doanh nhỏ lẻ, giảm bớt nghĩa vụ thuế cho những ai có doanh thu thấp, đồng thời phù hợp hơn với thực tế phát triển của thương mại điện tử.

Dưới đây là bảng so sánh ngưỡng doanh thu trước và sau khi thay đổi theo Nghị định 141/2026/NĐ-CP:

## So sánh ngưỡng doanh thu không chịu thuế

| Thời điểm áp dụng | Ngưỡng doanh thu không chịu thuế |
|---|---|
| Trước 01/01/2026 | 500.000.000 VNĐ |
| Từ 01/01/2026 | 1.000.000.000 VNĐ |

> **Lưu ý quan trọng:** Một số sàn TMĐT vẫn khấu trừ thuế ngay cả khi doanh thu cả năm dưới ngưỡng. Số tiền đã khấu trừ có thể được hoàn hoặc quyết toán khi bạn kê khai thuế. Xem chi tiết tại bài viết: [Cách tính thuế bán hàng trên Shopee, TikTok Shop](/kien-thuc/cach-tinh-thue-ban-hang-tren-shopee-tiktok).

## Đối tượng áp dụng

Quy định về ngưỡng doanh thu không chịu thuế áp dụng cho hộ kinh doanh, cá nhân kinh doanh có hoạt động bán hàng hóa, cung cấp dịch vụ trên các nền tảng thương mại điện tử, mạng xã hội, website hoặc các hình thức khác.

Nếu tổng doanh thu trong năm dương lịch không vượt quá 1.000.000.000 VNĐ thì không phải nộp thuế GTGT và thuế TNCN. Nếu vượt ngưỡng, bạn cần khai và nộp thuế theo quy định.

## Căn cứ pháp lý

- [Nghị quyết 198/2025/QH15 về một số cơ chế, chính sách đặc biệt phát triển kinh tế tư nhân](https://xaydungchinhsach.chinhphu.vn/nghi-quyet-198-2025-qh15-ve-mot-so-co-che-chinh-sach-dac-biet-phat-trien-kinh-te-tu-nhan-119250517191622422.htm)
- [Nghị định 68/2026/NĐ-CP quy định chính sách thuế và quản lý thuế đối với hộ kinh doanh, cá nhân kinh doanh](https://vanban.chinhphu.vn/?pageid=27160&docid=217111)
- [Nghị định 141/2026/NĐ-CP về sửa đổi, bổ sung chính sách thuế hộ kinh doanh, cá nhân kinh doanh](https://vanban.chinhphu.vn/?pageid=27160&docid=217960)`,
    faqItems: [
      {
        question: 'Doanh thu tính theo năm dương lịch hay năm tài chính?',
        answer: 'Doanh thu được tính theo năm dương lịch (từ ngày 01/01 đến ngày 31/12), không phải năm tài chính của doanh nghiệp.'
      },
      {
        question: 'Nếu bán trên nhiều kênh thì tính gộp doanh thu thế nào?',
        answer: 'Tổng doanh thu từ tất cả các kênh (sàn TMĐT, mạng xã hội, website, cửa hàng...) được cộng dồn để xét ngưỡng 1 tỷ đồng/năm.'
      },
      {
        question: 'Nếu sàn TMĐT đã khấu trừ thuế thì tôi có phải nộp thêm không?',
        answer: 'Nếu tổng doanh thu cả năm ≤ 1 tỷ đồng, bạn được hoàn lại số thuế đã bị khấu trừ. Nếu vượt ngưỡng, số thuế sàn đã nộp thay sẽ được trừ vào nghĩa vụ thuế thực tế.'
      }
    ]
  },
  {
    slug: 'cach-tinh-thue-ban-hang-tren-shopee-tiktok',
    title: 'Cách tính thuế bán hàng trên Shopee, TikTok Shop',
    metaDescription: 'Sàn TMĐT chính thức khấu trừ thuế từ 2026. Hướng dẫn cách tính thuế GTGT 1% + TNCN 0.5% và cách kê khai chuẩn.',
    pageType: 'knowledge' as const,
    status: 'published' as const,
    publishedAt: new Date('2026-08-16T00:00:00.000Z'),
    content: `Theo quy định tại Nghị định 117/2025/NĐ-CP, các sàn thương mại điện tử có chức năng thanh toán (Shopee, TikTok Shop, Lazada, Tiki, ...) có trách nhiệm khấu trừ, nộp thay thuế giá trị gia tăng (GTGT) và thuế thu nhập cá nhân (TNCN) cho hộ kinh doanh, cá nhân kinh doanh trên nền tảng.

Sàn sẽ tự động khấu trừ theo tỷ lệ % trên doanh thu trước khi thanh toán cho người bán. Người bán chỉ cần cung cấp đúng mã số thuế (MST) để sàn kê khai và nộp thuế thay.

Nếu doanh thu của bạn thuộc diện không phải nộp thuế (ví dụ: dưới ngưỡng 1 tỷ đồng/năm theo quy định), người bán vẫn có thể được hoàn hoặc quyết toán lại thuế vào cuối năm.

## Tỷ lệ khấu trừ thuế áp dụng trên các sàn TMĐT phổ biến

| Doanh thu (trước VAT) | Thuế GTGT | Thuế TNCN | Tổng tỷ lệ | Ví dụ 10.000.000đ bị khấu trừ |
|---|---|---|---|---|
| Dưới 100 triệu đồng/tháng | 1% | 0,5% | 1,5% | 150.000đ |
| Từ 100 đến 300 triệu đồng/tháng | 2% | 1% | 3% | 300.000đ |
| Trên 300 triệu đồng/tháng | 3% | 1,5% | 4,5% | 450.000đ |

> **Lưu ý quan trọng:** Một số sàn TMĐT vẫn khấu trừ thuế ngay cả khi doanh thu cả năm dưới ngưỡng phải nộp thuế. Việc khấu trừ này là tạm thời, không đồng nghĩa bạn phải nộp thuế nếu doanh thu cả năm nằm dưới ngưỡng. Bạn có thể được hoàn hoặc quyết toán lại thuế khi kê khai cuối năm.

## Cách tính số tiền thuế bị khấu trừ

Công thức tính số tiền thuế sàn TMĐT sẽ khấu trừ trên từng đơn hàng:

\`Số tiền thuế khấu trừ = Doanh thu tính thuế x Tổng tỷ lệ thuế (GTGT + TNCN)\`

Ví dụ: Bạn phát sinh đơn hàng có doanh thu tính thuế là 1.000.000 VNĐ trên Shopee. Nếu thuộc mức khấu trừ 1,5% (GTGT 1% + TNCN 0,5%), số tiền thuế Shopee sẽ tự động trích giữ là:

\`1.000.000 x 1,5% = 15.000 VNĐ\`

## Trách nhiệm của người bán hàng trên sàn

- Cung cấp chính xác Mã số thuế (MST) cá nhân hoặc hộ kinh doanh cho sàn TMĐT.
- Lưu giữ các chứng từ khấu trừ thuế do sàn cấp để làm căn cứ quyết toán hoặc hoàn thuế cuối năm.
- Trường hợp bán trên nhiều sàn hoặc có thêm cửa hàng trực tiếp, cần tự tổng hợp doanh thu đa kênh để xác định nghĩa vụ thuế tổng thể.

## Căn cứ pháp lý

- [Nghị định 117/2025/NĐ-CP quy định về quản lý thuế đối với hoạt động kinh doanh trên nền tảng số](https://vanban.chinhphu.vn/?pageid=27160&docid=217111)
- [Nghị định 141/2026/NĐ-CP về sửa đổi, bổ sung chính sách thuế hộ kinh doanh, cá nhân kinh doanh](https://vanban.chinhphu.vn/?pageid=27160&docid=217960)`,
    faqItems: [
      {
        question: 'Shopee / TikTok Shop tự trích thuế rồi thì tôi có phải khai thuế nữa không?',
        answer: 'Bạn không phải trực tiếp kê khai nộp thuế với các đơn hàng phát sinh trên sàn do sàn đã nộp thay. Tuy nhiên cuối năm bạn vẫn phải tổng hợp doanh thu để xác định có thuộc diện được hoàn thuế hay phải nộp thêm.'
      },
      {
        question: 'Chứng từ khấu trừ thuế lấy ở đâu?',
        answer: 'Các sàn TMĐT có trách nhiệm cấp chứng từ khấu trừ thuế điện tử cho người bán định kỳ hoặc khi có yêu cầu để làm căn cứ quyết toán thuế.'
      },
      {
        question: 'Tỷ lệ khấu trừ 1.5% có cố định cho tất cả ngành hàng không?',
        answer: 'Tỷ lệ GTGT 1% + TNCN 0.5% áp dụng cho hoạt động phân phối, cung cấp hàng hóa (bán hàng online). Các dịch vụ khác có thể có tỷ lệ riêng theo biểu thuế của cơ quan thuế.'
      },
      {
        question: 'Nếu bán lỗ thì có được giảm thuế không?',
        answer: 'Thuế đối với hộ/cá nhân kinh doanh tính trên doanh thu chứ không tính trên lợi nhuận (lãi/lỗ). Vì vậy dù bán lỗ vẫn bị trích giữ thuế theo tỷ lệ % trên doanh thu.'
      }
    ]
  },
  {
    slug: 'nghi-dinh-141-2026-thay-doi-gi',
    title: 'Nghị định 141/2026/NĐ-CP thay đổi gì về thuế bán hàng online?',
    metaDescription: 'Ngày 29/04/2026, Chính phủ ban hành Nghị định 141/2026/NĐ-CP sửa đổi, bổ sung một số điều của Nghị định 117/2025/NĐ-CP về quản lý thuế đối với hoạt động kinh doanh trên sàn thương mại điện tử và nền tảng số của hộ, cá nhân.',
    pageType: 'knowledge' as const,
    status: 'published' as const,
    publishedAt: new Date('2026-08-15T00:00:00.000Z'),
    content: `Ngày 29/04/2026, Chính phủ ban hành Nghị định 141/2026/NĐ-CP sửa đổi, bổ sung một số điều của Nghị định 117/2025/NĐ-CP về quản lý thuế đối với hoạt động kinh doanh trên sàn thương mại điện tử và nền tảng số của hộ, cá nhân.

> **Hiệu lực hồi tố:** Áp dụng cho cả giai đoạn từ ngày 01/01/2026 (trước thời điểm ban hành chính thức).

## Lộ trình áp dụng

1. **01/01/2026 — Ngày hiệu lực hồi tố:** Áp dụng cho các khoản thu đã phát sinh từ đầu năm 2026.
2. **05/03/2026 — Nghị định 68 ban hành:** Chính phủ ban hành Nghị định 68/2026/NĐ-CP quy định về quản lý thuế đối với kinh doanh trên sàn TMĐT.
3. **29/04/2026 — Nghị định 141 ban hành:** Sửa đổi, bổ sung Nghị định 68, điều chỉnh ngưỡng doanh thu không chịu thuế lên 1 tỷ đồng/năm.

## Những thay đổi chính

- **Nâng ngưỡng doanh thu không chịu thuế từ 500 triệu lên 1 tỷ đồng/năm:** Hộ, cá nhân có doanh thu từ hoạt động kinh doanh trên sàn TMĐT, nền tảng số không vượt quá 1 tỷ đồng/năm thì không phải nộp thuế GTGT và TNCN.
- **Áp dụng hồi tố từ 01/01/2026:** Mức ngưỡng mới được áp dụng từ đầu năm 2026, kể cả đối với các khoản thu đã phát sinh trước thời điểm Nghị định 141 có hiệu lực.
- **Cơ chế khấu trừ và nộp thay không thay đổi:** Các sàn TMĐT vẫn thực hiện khấu trừ và nộp thay thuế GTGT và TNCN theo tỷ lệ % trên doanh thu cho người bán.
- **Bổ sung quy định về hoàn thuế/điều chỉnh:** Trường hợp số thuế đã khấu trừ lớn hơn số thuế phải nộp (do doanh thu cả năm không vượt ngưỡng 1 tỷ), người bán có thể đề nghị hoàn hoặc bù trừ khi quyết toán.

## Căn cứ pháp lý

- [Nghị định 141/2026/NĐ-CP sửa đổi Nghị định 68/2026/NĐ-CP](https://vanban.chinhphu.vn/?pageid=27160&docid=217960)
- [Nghị định 117/2025/NĐ-CP về quản lý thuế trên nền tảng số](https://vanban.chinhphu.vn/?pageid=27160&docid=217111)`,
    faqItems: [
      {
        question: 'Nghị định 141/2026/NĐ-CP có điểm gì mới nổi bật nhất?',
        answer: 'Thay đổi quan trọng nhất là nâng ngưỡng doanh thu không chịu thuế GTGT và TNCN cho hộ, cá nhân kinh doanh trên sàn TMĐT từ 500 triệu đồng lên 1 tỷ đồng/năm.'
      },
      {
        question: 'Nghị định 141/2026 có hiệu lực hồi tố từ khi nào?',
        answer: 'Nghị định 141/2026/NĐ-CP được ban hành ngày 29/04/2026 nhưng áp dụng hiệu lực hồi tố từ ngày 01/01/2026 đối với các khoản thu phát sinh từ đầu năm.'
      },
      {
        question: 'Nếu đã bị sàn khấu trừ thuế trước ngày 29/04/2026 mà doanh thu cả năm ≤ 1 tỷ thì xử lý thế nào?',
        answer: 'Trường hợp số thuế đã bị khấu trừ nhưng cuối năm tổng doanh thu cả năm từ mọi kênh không quá 1 tỷ đồng, người bán được đề nghị cơ quan thuế hoàn lại hoặc bù trừ số thuế đã nộp thừa khi quyết toán.'
      },
      {
        question: 'Nghị định 141/2026 có thay đổi trách nhiệm khấu trừ của sàn TMĐT không?',
        answer: 'Cơ chế khấu trừ và nộp thay thuế của các sàn TMĐT (Shopee, TikTok Shop...) vẫn được giữ nguyên; các sàn vẫn thực hiện nộp thay theo tỷ lệ % quy định trên doanh thu từng đơn hàng.'
      }
    ]
  }
];

async function migrate() {
  console.log('🌱 Đang migrate 3 bài viết Phase 1 vào DB content_page...');
  for (const art of articles) {
    const existing = await db.query.contentPage.findFirst({
      where: eq(contentPage.slug, art.slug)
    });
    if (existing) {
      await db.update(contentPage).set(art).where(eq(contentPage.id, existing.id));
      console.log(`✅ Updated: ${art.slug} (ID: ${existing.id})`);
    } else {
      const [inserted] = await db.insert(contentPage).values(art).returning();
      console.log(`✅ Inserted: ${art.slug} (ID: ${inserted.id})`);
    }
  }
  console.log('🎉 Hoàn tất migrate 3 bài viết Phase 1 vào DB!');
}

migrate().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
