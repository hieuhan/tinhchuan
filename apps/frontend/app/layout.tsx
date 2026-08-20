import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'TinhChuan.vn', description: 'Tính thuế cá nhân & Tra cứu pháp luật' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="vi"><body style={{ margin: 0, fontFamily: 'system-ui' }}>{children}</body></html>);
}
