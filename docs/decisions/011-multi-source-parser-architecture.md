## #011 - Kiến trúc Multi-Source Parser Registry cho Crawl Pipeline (Sử dụng vanban.chinhphu.vn)

**Ngày**: 2026-09-13
**Trạng thái**: Đang hiệu lực (Cập nhật ngày 13/09/2026: Đã thay thế nguồn `xaydungchinhsach` bằng `vanban.chinhphu.vn`)

**Quyết định**:
1. Thêm cột `parser_key` (text, NOT NULL, default `'congbao_chinhphu'`) vào bảng `crawl_watch_source` trong schema Drizzle ([`packages/database/src/schema/index.ts`](../../packages/database/src/schema/index.ts)) và sinh migration `0003_purple_zemo.sql`.
2. Tái cấu trúc `apps/backend/jobs/scan-watch-sources.ts` và `apps/backend/jobs/extract-detected-item-content.ts` thành kiến trúc **Parser Registry** (sử dụng registry map `listingParsers` và `detailPageParsers` tra cứu theo `parser_key`).
3. Tải và xử lý nguồn theo dõi thứ 2 từ Cổng Hệ thống văn bản Chính phủ: `Hệ thống văn bản Chính phủ (vanban.chinhphu.vn)` (`https://vanban.chinhphu.vn/he-thong-van-ban?classid=1&mode=1`) với `parser_key = 'vanban_chinhphu'`.
4. Loại bỏ hoàn toàn nguồn thử nghiệm cũ `xaydungchinhsach_chinhphu` khỏi database, seed và codebase.
5. Chuẩn hóa `detectUrl` trong `parseVanBanListing` theo định dạng cố định `https://vanban.chinhphu.vn/?pageid=27160&docid=<ID>` bằng cách trích xuất `docid` (bỏ mọi tham số phân trang/lọc `classid`, `orggroupid`).

**Bối cảnh & Lý do thay đổi nguồn**:
- Ban đầu dự án thử nghiệm bổ sung nguồn `xaydungchinhsach.chinhphu.vn`. Tuy nhiên, nguồn này chủ yếu đăng các bài viết tổng hợp tường thuật theo báo chí, file đính kèm là bản scan PDF ảnh không có text layer, và thiếu thông tin ngày ban hành chuẩn hóa.
- Dự án chuyển sang sử dụng chính thức Cổng thông tin Hệ thống văn bản Chính phủ (`vanban.chinhphu.vn`):
  1. Tất cả văn bản pháp luật đều có thông tin Ngày ban hành, Số ký hiệu, Trích yếu và Căn cứ pháp lý đầy đủ.
  2. Đính kèm trực tiếp file PDF chính thức có chữ ký số của Quốc hội/Chính phủ (`datafiles.chinhphu.vn`).
  3. Cung cấp văn phong pháp lý gốc (verbatim text) chuẩn xác thay vì văn phong báo chí.

**Chi tiết thiết kế**:
1. **Drizzle Schema & DB Migration**:
   - `crawl_watch_source.parser_key`: Định danh strategy parser dùng cho nguồn theo dõi.
   - Migration `0003_purple_zemo.sql` thêm cột với default `'congbao_chinhphu'`.
2. **Scanner Registry (`listingParsers`)**:
   - `congbao_chinhphu`: Dùng selector `.item--vb...`
   - `vanban_chinhphu`: Parser cho `vanban.chinhphu.vn` quét bảng `table[id*="grvDocument"]` lấy số ký hiệu, trích yếu, ngày ban hành và URL đính kèm. Chuẩn hóa `detectUrl` theo `docid`.
3. **Extractor Registry (`detailPageParsers`)**:
   - `congbao_chinhphu`: Tìm `.docx` và `.pdf` song song.
   - `vanban_chinhphu`: Tìm link `.pdf` (`datafiles.chinhphu.vn`) và trích xuất HTML body trang chi tiết (được làm sạch `<script>`, `<style>`). Tự động log ghi chú khi trang chi tiết chứa nhiều hơn 1 file đính kèm.

**Kết quả kiểm chứng & Giới hạn đã biết**:
- Đã xóa sạch các bản ghi sai phạm vi cũ và seed/update lại `listing_url = 'https://vanban.chinhphu.vn/he-thong-van-ban?classid=1&mode=1'`.
- Backfill thành công 50 văn bản mới nhất từ luồng tổng hợp (đa dạng loại văn bản Nghị định, Thông tư, Nghị quyết từ nhiều cơ quan).
- **Phục hồi thủ công Nghị quyết 43/2026/QH16**: Do nằm ở trang 2 (>50 văn bản gần nhất) nên không thể quét qua luồng tự động 50 bản ghi GET đơn giản. Văn bản đã được phục hồi thủ công với metadata chuẩn (`docid=219330`), `aiClassification = 'relevant'`, status `pending_review` và 9,788 ký tự text layer trích xuất trước đó kèm `adminNotes` ghi rõ nguồn gốc.
- **Giới hạn đã biết**:
  1. Tự động backfill chỉ phủ ~50 văn bản gần nhất (server `vanban.chinhphu.vn` trả mặc định 50 bản ghi/trang cho GET request và không tôn trọng `maxresults`).
  2. Các file PDF gốc dạng scan ảnh (chưa có text layer như NQ 43/2026 gốc) sẽ cần Vision OCR ở giai đoạn nâng cấp sau.
- Tổng bản ghi DB: `congbao` = 10, `vanban` = 51.
