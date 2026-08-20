export default function BackendHome() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>TinhChuan CMS</h1>
        <p style={{ color: '#6b7280', marginTop: '1rem' }}>Hệ thống quản trị nội dung.</p>
        <a href="/admin/login" style={{ color: '#2563eb', marginTop: '1rem', display: 'inline-block' }}>Đăng nhập quản trị</a>
      </div>
    </main>
  );
}
