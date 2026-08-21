export default function AdminLoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-lg shadow-sm w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6">Đăng nhập quản trị</h1>
        <form method="POST" action="/admin/login">
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium">Tên đăng nhập</label>
            <input name="username" type="text" required className="w-full p-2 border border-gray-300 rounded-md" />
          </div>
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium">Mật khẩu</label>
            <input name="password" type="password" required className="w-full p-2 border border-gray-300 rounded-md" />
          </div>
          <button type="submit" className="w-full p-3 bg-blue-600 text-white rounded-md font-medium">Đăng nhập</button>
        </form>
      </div>
    </main>
  );
}
