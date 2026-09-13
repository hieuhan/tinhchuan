// Chưa import @tinhchuan/database ở đây: lúc scaffold ban đầu chưa định nghĩa
// bảng nào trong schema.ts nên chưa có gì để đọc. Thêm import khi bắt đầu
// implement dashboard đọc dữ liệu thật.
export const dynamic = 'force-dynamic';
export default async function AdminDashboardPage() {
  return (
    <main className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Dashboard quản trị</h1>
      <p className="text-gray-500">Chào mừng bạn đến với hệ thống quản trị.</p>
    </main>
  );
}
