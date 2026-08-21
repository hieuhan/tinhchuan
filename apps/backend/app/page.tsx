export default function BackendHome() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold">TinhChuan CMS</h1>
        <p className="text-gray-500 mt-4">Hệ thống quản trị nội dung.</p>
        <a href="/admin/login" className="text-blue-600 mt-4 inline-block">Đăng nhập quản trị</a>
      </div>
    </main>
  );
}
