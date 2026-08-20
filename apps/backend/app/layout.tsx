import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'TinhChuan CMS', description: 'Hệ thống quản trị' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="vi"><body style={{ margin: 0, fontFamily: 'system-ui' }}>{children}</body></html>);
}
