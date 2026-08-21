import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: 'https', hostname: 'cdn.tinhchuan.vn' }] },
  // Bắt buộc: @tinhchuan/database export thẳng source TypeScript (không build
  // sẵn), nếu thiếu dòng này Next.js sẽ không biết cách compile package đó.
  transpilePackages: ['@tinhchuan/database'],
};

export default nextConfig;
