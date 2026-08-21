## #004 - Môi trường dev: code và deploy trực tiếp trên Mac Mini, dùng chung mọi service

**Ngày**: 2026-08-21
**Trạng thái**: Đang hiệu lực

**Bối cảnh**: Solo dev, chỉ dùng đúng 1 máy (Mac Mini M1) để code, không
có laptop/máy thứ 2 tham gia phát triển.

**Quyết định**: Không tách môi trường dev/production. Code trực tiếp
trong `~/tinhchuan`, dùng chung Postgres/Redis/MinIO với production.
KHÔNG dựng `docker-compose.dev.yml`, KHÔNG SSH tunnel, KHÔNG thư mục
clone riêng cho dev.

**Lý do**: Chỉ 1 máy duy nhất, Phase 1 chưa có dữ liệu người dùng thật,
chưa có traffic - chi phí tách biệt (thêm compose file, thêm port,
thêm bước đồng bộ schema/seed 2 nơi) lớn hơn rủi ro thực tế hiện tại.

**Rủi ro còn lại cần tự kỷ luật (không phải hạ tầng)**: `scripts/deploy.sh`
chạy `git reset --hard` khi deploy - LUÔN commit hoặc `git stash` trước
khi push lên `main` hoặc chạy deploy thủ công, tránh mất việc đang code
dở dang.

**Đã cân nhắc và loại**:
- SSH tunnel (autossh) trỏ dev về Postgres/Redis Mac Mini từ máy khác -
  loại vì chỉ có 1 máy, không có "máy khác" nào cần tunnel tới.
- Tách thư mục `~/tinhchuan-dev` + `docker-compose.dev.yml` port riêng
  trên cùng Mac Mini - loại vì thêm phức tạp không cần thiết khi chưa có
  dữ liệu thật để bảo vệ.

**Mốc cần xem lại quyết định này**: khi có `tax_rule_version` ở trạng
thái `approved` phục vụ traffic thật, HOẶC khi có người thứ 2 tham gia
code/vận hành, HOẶC khi có máy thứ 2 tham gia phát triển - lúc đó tách
dev/production và cân nhắc lại #005 (GitHub Actions deploy có giá trị
thật trở lại khi máy code khác máy production).
