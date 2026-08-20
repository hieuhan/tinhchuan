export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#111827' }}>TinhChuan.vn</h1>
      <p style={{ color: '#6b7280', marginTop: '1rem' }}>Hệ thống tính thuế cá nhân & tra cứu pháp luật.</p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <a href="/admin/login" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#2563eb', color: 'white', borderRadius: '0.375rem', textDecoration: 'none' }}>Trang quản trị</a>
      </div>
    </main>
  );
}
