// Chưa import @tinhchuan/database ở đây: lúc scaffold ban đầu chưa định nghĩa
// model nào trong schema.prisma nên "prisma generate" cũng chưa chạy, import
// Prisma Client lúc này sẽ làm build lỗi ngay vì package chưa tồn tại. Thêm
// lại import khi bắt đầu implement dashboard đọc dữ liệu thật.
export const dynamic = 'force-dynamic';
export default async function AdminDashboardPage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '2rem' }}>Dashboard quản trị</h1>
      <p style={{ color: '#6b7280' }}>Chào mừng bạn đến với hệ thống quản trị.</p>
    </main>
  );
}
