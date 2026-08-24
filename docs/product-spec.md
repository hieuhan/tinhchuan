# TinhChuan.vn - Mô tả sản phẩm

> Đây là tài liệu KIẾN THỨC (Knowledge) - mô tả sản phẩm LÀ GÌ. Quy tắc bắt
> buộc khi code (Instruction) nằm ở `AGENTS.md` và các `CONTEXT.md` colocated
> - KHÔNG lặp lại ở đây. Nếu thấy 1 quy tắc vừa có ở đây vừa có ở AGENTS.md,
> đó là lỗi trùng lặp cần báo lại để xóa bớt.
>
> Cập nhật khi nào: xem `docs/CONTEXT.md`.

---

## 1. Tổng quan sản phẩm

**Tên miền**: tinhchuan.vn

**Định vị**: Nền tảng tri thức + công cụ cho lĩnh vực Thuế cá nhân tại Việt
Nam. Không phải blog, không phải AI Chat - là nền tảng dữ liệu có cấu trúc,
công cụ tính toán, và nội dung giải thích đi kèm.

**Vertical đầu tiên**: Thuế cá nhân (thay thế hướng Payroll & HR ban đầu -
đã pivot sau khi validate thị trường: nhu cầu tìm kiếm cao, quy định đang
thay đổi nhanh 2025-2026, chưa có công cụ tương tác mạnh).

**Slogan**: "Hỏi là ra, tính là chuẩn" (phương án dẫn đầu, chưa chốt chính
thức 100%).

**Giá trị cốt lõi**: Nhanh - Chính xác - Dễ hiểu - Có căn cứ (mọi số liệu
đều trích dẫn nguồn pháp luật gốc).

**Mô hình tăng trưởng**: SEO organic (không sales, không outreach) →
Ads/Affiliate → Premium → API B2B (self-serve).

**Điểm khác biệt / lý do khó bị copy**:
- Không nằm ở code hay nội dung tĩnh (dễ bị AI đối thủ sao chép)
- Nằm ở: độ chính xác được duy trì liên tục theo thời gian (crawler + AI
  Agent + human review chạy hàng ngày), first-mover SEO, và độ sâu nội
  dung liên kết (Tool + Giải thích + FAQ + Timeline + Căn cứ + Related
  trong cùng một trang)

---

## 2. Đối tượng người dùng

| Tầng | Đối tượng | Vai trò |
|---|---|---|
| 1 | Người bán hàng online, freelancer, người chuyển nhượng BĐS/xe | Traffic chính, vào từ Google |
| 2 | Kế toán dịch vụ, chủ hộ kinh doanh | Người dùng thường xuyên, tính toán lặp lại |
| 3 | Công ty dịch vụ kế toán (giai đoạn sau) | Khách hàng trả phí, dùng API |

---

## 3. Danh sách 5 Tool MVP (thứ tự ưu tiên build)

> **Phase 1 CHỈ build Tool số 1.** Tool 2-5 thuộc Phase 3, chưa code ở giai
> đoạn hiện tại. Quy tắc UI bắt buộc cho MỌI Tool (Form → Kết quả → Cách
> tính → Căn cứ pháp lý → FAQ → Related) xem `AGENTS.md` mục 6 - không nhắc
> lại ở đây.

1. **Kiểm tra & tính thuế bán hàng online** — Phase 1, build đầu tiên,
   traffic cao nhất, đúng lúc quy định 2026 đang gây hoang mang (ngưỡng
   chịu thuế **1 tỷ đồng/năm** từ 1/1/2026 theo Nghị định 141/2026/NĐ-CP,
   chấm dứt thuế khoán)
2. **Phân biệt Hộ kinh doanh cá thể vs Kê khai theo doanh thu thực tế** -
   dạng wizard hỏi đáp, không phải máy tính thuần túy
3. **Kiểm tra ngưỡng miễn thuế theo doanh thu đa kênh** - cộng dồn doanh
   thu nhiều sàn (Shopee, TikTok, Facebook)
4. **Thuế chuyển nhượng bất động sản** - nhu cầu ổn định quanh năm
5. **Quyết toán thuế TNCN cuối năm** - phức tạp nhất, tổng hợp nhiều nguồn
   thu nhập, giữ chân người dùng quay lại hàng năm

### 3.1 Logic tính thuế Tool 1

> Nội dung này SẼ chuyển thành comment trong
> `apps/frontend/lib/formula-engine/tinh-thue-ban-hang-online.ts` khi Tool 1
> được code (Checklist Phase 1 - Tuần 2). Giữ tạm ở đây cho tới lúc đó vì
> code chưa tồn tại.

**Căn cứ pháp lý**: Nghị quyết 198/2025/QH15 → Luật Thuế TNCN 2025 (Luật
109/2025/QH15) + Luật Thuế GTGT 2024 (Luật 48/2024/QH15) → Nghị định
68/2026/NĐ-CP (5/3/2026) → **Nghị định 141/2026/NĐ-CP (29/4/2026, hiệu lực
hồi tố từ 1/1/2026)** sửa ngưỡng 500 triệu → 1 tỷ.

```
Ngưỡng miễn thuế = 1.000.000.000 VND/năm
Nhóm ngành (Tool 1 = phân phối/cung cấp hàng hóa): GTGT 1%, TNCN 0,5%

Nếu doanh_thu ≤ 1.000.000.000:
    → Miễn thuế hoàn toàn, chỉ cần thông báo doanh thu

Nếu doanh_thu > 1.000.000.000 (đến 3 tỷ, trường hợp không xác định chi phí đầu vào):
    Thuế_GTGT = doanh_thu × 1%                          // KHÔNG trừ ngưỡng
    Thuế_TNCN = (doanh_thu - 1.000.000.000) × 0,5%      // CÓ trừ ngưỡng
    Tổng thuế = Thuế_GTGT + Thuế_TNCN
```

**Lưu ý quan trọng khi code Formula Engine**: GTGT và TNCN có cách trừ
ngưỡng KHÁC NHAU — đây là lỗi dễ mắc nhất. Ví dụ kiểm chứng: doanh thu 1,8
tỷ → GTGT = 1.800.000.000 × 1% = 18.000.000đ; TNCN = 800.000.000 × 0,5% =
4.000.000đ.

**Case CHƯA cần code ở Phase 1** (để dành Phase sau): doanh thu 3-50 tỷ
(thuế suất 17%), trên 50 tỷ (20%), và nhánh "xác định được chi phí đầu
vào" (TNCN = 15% trên lợi nhuận).

**Trước khi set `status = 'approved'`**: đối chiếu số liệu này với văn bản
gốc hoặc kế toán trước khi đưa dữ liệu này lên production, theo đúng
nguyên tắc human review bắt buộc (xem `AGENTS.md` mục 5).

### 3.2 Cụm nội dung Phase 1 (content cluster)

Vì chỉ có 1 Tool, chiến lược SEO không dựa vào số lượng trang lớn mà dựa
vào **độ sâu nội dung xoay quanh đúng 1 chủ đề đang "hot"** (luật vừa đổi
tháng 4/2026, search demand cao, đối thủ chưa kịp cập nhật). Build tối
thiểu 4 trang liên kết chặt với nhau:

| URL | Vai trò | Từ khóa mục tiêu | `design-source/<slug>/` |
|---|---|---|---|
| `/tool/thue-ban-hang-online` | Trang chính (Tool) | "tính thuế bán hàng online" | `thue-ban-hang-online/` |
| `/kien-thuc/nguong-doanh-thu-chiu-thue-ban-hang-online-2026` | Giải thích ngưỡng 1 tỷ, link về Tool | "ngưỡng thuế hộ kinh doanh 1 tỷ" | `nguong-doanh-thu-chiu-thue-ban-hang-online-2026/` |
| `/kien-thuc/cach-tinh-thue-ban-hang-tren-shopee-tiktok` | Case cụ thể theo sàn TMĐT, link về Tool | "thuế bán hàng shopee tiktok shop" | `cach-tinh-thue-ban-hang-tren-shopee-tiktok/` |
| `/kien-thuc/nghi-dinh-141-2026-thay-doi-gi` | Tin tức cập nhật quy định | "nghị định 141/2026" | `nghi-dinh-141-2026-thay-doi-gi/` |

> Slug `design-source/` PHẢI khớp chính xác đoạn cuối route (không thêm
> tiền tố `tool-`/`kien-thuc-`) - xem quy tắc đầy đủ ở
> `apps/frontend/CONTEXT.md` mục "Quy trình convert HTML/CSS thô".
> Trang chủ (`/`) là ngoại lệ - dùng `design-source/home/` vì route gốc
> không có đoạn slug để khớp.

### 3.3 Chiến lược SEO Phase 1

**On-page**:
- Title tag + meta description riêng biệt, unique cho mỗi trang trong cụm
- H1 khớp target keyword, không trùng lặp giữa các trang
- Schema.org markup: `FAQPage`, `SoftwareApplication`, `BreadcrumbList`
- Internal link chặt giữa 4 trang trong cụm

**Technical**:
- SSR/ISR (Next.js) đảm bảo Google crawl được nội dung ngay
- `sitemap.xml` (4 URL), `robots.txt`
- Core Web Vitals: font self-host, tối ưu ảnh, tránh layout shift
- Mobile-first — đa số tra cứu thuế thực hiện từ điện thoại

**Off-page** (SEO organic, không sales, không ads):
- Chia sẻ ở cộng đồng người bán hàng online để có traffic + backlink tự
  nhiên ban đầu
- Theo dõi Google Search Console sau launch, viết thêm FAQ dựa trên query
  thực tế người dùng tìm

---

## 4. Thiết kế thương hiệu

**Bảng màu UI (light/dark, đã kiểm WCAG AA)**: nguồn thật là
`apps/frontend/app/globals.css` (CSS Custom Properties) - KHÔNG chép lại
giá trị hex ra tài liệu, dễ lệch khỏi code theo thời gian.

**Font**: Be Vietnam Pro, self-host qua `next/font/google` (chi tiết cách
dùng xem `apps/frontend/CONTEXT.md`).

**Logo**: Icon hình vuông bo góc (primary color nền) + dấu tích đơn giản.
File vector: `tinhchuan-icon.svg` (light) / `tinhchuan-icon-dark.svg`
(dark). Wordmark "tinhchuan.vn" là text CSS (Be Vietnam Pro 800), không
phải ảnh - phần "tinhchuan" màu chữ chính, phần ".vn" màu primary. Icon
chính thức đang thiết kế riêng (Claude Design), dùng bản dấu tích làm
placeholder, không chặn tiến độ.

> Bảng màu logo/thương hiệu (`#2563EB`, `#22C55E` dùng trong demo) là hệ
> riêng cho nhận diện thương hiệu, CHƯA thống nhất với bảng màu UI sản
> phẩm ở `globals.css` - cần đối chiếu lại khi chốt logo chính thức.

---

## 5. Flow xử lý hệ thống

**Flow nội dung** (chạy nền qua launchd, không real-time - chi tiết lý do
xem `packages/content-pipeline/CONTEXT.md`):
Job định kỳ hàng ngày → Crawler quét nguồn luật chính thống, ghi
`legal_source` mới → nếu phát hiện nhiều nguồn khác giá trị nhau, ghi vào
`source_conflict` → AI Agent đọc dữ liệu đã chuẩn hóa, sinh
`tax_rule_version` + `content_page` ở trạng thái `pending_review` → Admin
vào `/admin/review` đối chiếu với `source_url`, duyệt hoặc từ chối → khi
duyệt, status chuyển `approved`/`published`, trigger revalidate ISR.

**Flow người dùng** (real-time):
Người dùng mở trang Tool (SSR/ISR, đã có nội dung SEO sẵn) → nhập dữ liệu
→ Server Action gọi Formula Engine → Formula Engine tra cứu
`tax_rule_version` với `status='approved'` đúng khoảng hiệu lực → trả kết
quả kèm trích dẫn `legal_source`.

2 flow tách biệt hoàn toàn qua cột `status` - người dùng không bao giờ
thấy dữ liệu chưa duyệt (quy tắc bắt buộc, xem `AGENTS.md` mục 5).

---

## 6. Roadmap tóm tắt (tham khảo, không bắt buộc theo tuần tự)

| Phase | Nội dung | Ước tính (part-time ~15h/tuần) |
|---|---|---|
| 0 | Setup Next.js, DB, deploy Mac Mini + Cloudflare Tunnel | 1-2 tuần |
| 1 | Tool 1 + cụm 3 trang Knowledge, dữ liệu nhập tay, launch sớm | 2-3 tuần |
| 2 | AI Content Pipeline + Admin review dashboard | 2-3 tuần |
| 3 | 4 Tool còn lại + SEO mở rộng | 3-4 tuần |
| 4 | Launch chính thức, Search Console, đo lường | 1-2 tuần |
| 5 (sau MVP) | Premium, DiaChiChuan API, LuatVN Semantic Search | Mở rộng dài hạn |