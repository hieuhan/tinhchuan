/** @type {import('next').NextConfig} */
module.exports = {
  output: 'standalone',
  reactStrictMode: true,
  // Bắt buộc: @tinhchuan/database export thẳng source TypeScript (không build
  // sẵn), nếu thiếu dòng này Next.js sẽ không biết cách compile package đó.
  transpilePackages: ['@tinhchuan/database'],
};
