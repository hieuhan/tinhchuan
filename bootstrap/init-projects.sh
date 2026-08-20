#!/usr/bin/env bash
# =============================================================================
# bootstrap/init-projects.sh - Khởi tạo Source Code Next.js Fullstack
# =============================================================================
# CẤU TRÚC:
#   packages/database: Prisma Schema dùng chung.
#   apps/frontend:     Next.js Web (Port nội bộ 3000).
#   apps/backend:      Next.js CMS (Port nội bộ 3000).
# =============================================================================
set -euo pipefail

COLOR_GREEN='\033[0;32m'
COLOR_CYAN='\033[0;36m'
COLOR_RESET='\033[0m'

print_success() { echo -e "${COLOR_GREEN}$1${COLOR_RESET}"; }
print_step()    { echo -e "\n${COLOR_CYAN}$1${COLOR_RESET}"; }

SCRIPT_DIRECTORY="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIRECTORY}/.." && pwd)"
cd "${PROJECT_ROOT}"

# =============================================================================
# BƯỚC 1: Root Package.json
# =============================================================================
print_step "📦 [Bước 1/5] Đang tạo Root Package.json..."
cat > package.json << 'EOF'
{
  "name": "tinhchuan",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["packages/*", "apps/*"],
  "scripts": {
    "dev:frontend": "npm run dev --workspace=apps/frontend",
    "dev:backend": "npm run dev --workspace=apps/backend",
    "db:generate": "npm run db:generate --workspace=packages/database",
    "db:push": "npm run db:push --workspace=packages/database"
  }
}
EOF
print_success "   ✅ Đã tạo Root Package.json."

# =============================================================================
# BƯỚC 2: Package Database
# =============================================================================
print_step "🗄️ [Bước 2/5] Đang tạo Package Database..."
mkdir -p packages/database/prisma packages/database/src

cat > packages/database/package.json << 'EOF'
{
  "name": "@tinhchuan/database",
  "version": "1.0.0",
  "main": "src/index.ts",
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@prisma/client": "7.9.1",
    "@prisma/adapter-pg": "7.9.1",
    "pg": "^8.13.0"
  },
  "devDependencies": {
    "prisma": "7.9.1",
    "typescript": "^5.7.0",
    "tsx": "^4.19.0",
    "@types/pg": "^8.11.0",
    "dotenv": "^16.4.0"
  }
}
EOF

cat > packages/database/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020", "module": "CommonJS", "strict": true,
    "esModuleInterop": true, "skipLibCheck": true, "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
EOF

# Prisma 7 bắt buộc phải có file cấu hình riêng (connection URL không còn nằm
# trong schema.prisma nữa) - xem https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7
cat > packages/database/prisma.config.ts << 'EOF'
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// npm workspace chạy lệnh với cwd = packages/database, nhưng file .env thật
// nằm ở ROOT monorepo (tạo từ .env.example) - "dotenv/config" mặc định chỉ
// tìm .env trong cwd hiện tại nên sẽ KHÔNG thấy, phải trỏ đường dẫn tường minh.
loadEnv({ path: path.resolve(process.cwd(), '../../.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
EOF

# Schema để trống khung sườn, bạn sẽ tự định nghĩa bảng sau.
# Lưu ý Prisma 7:
#  - provider = "prisma-client" (thay cho "prisma-client-js" cũ, đây là client
#    Rust-free, nhẹ hơn và không cần binary engine riêng cho từng platform -
#    tránh được lỗi engine không khớp arch khi build trên Mac Mini ARM64)
#  - moduleFormat = "cjs" vì package này build ra CommonJS (khớp tsconfig.json
#    ở trên), nếu để mặc định ESM sẽ lỗi khi Next.js require package này
#  - output bắt buộc phải khai báo tường minh từ Prisma 7 trở đi
cat > packages/database/prisma/schema.prisma << 'EOF'
generator client {
  provider     = "prisma-client"
  output       = "../generated/client"
  moduleFormat = "cjs"
}

datasource db {
  provider = "postgresql"
}

// TODO: Định nghĩa các model (bảng) và enum tại đây theo data_engine_schema.sql
EOF

cat > packages/database/src/index.ts << 'EOF'
import { PrismaClient } from '../generated/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma 7 bắt buộc dùng driver adapter thay vì để Prisma tự quản lý connection pool
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export * from '../generated/client';
EOF

cat > packages/database/prisma/seed.ts << 'EOF'
// Seed script - chạy bằng: npm run db:migrate --workspace=packages/database
// (Checklist_Phase1.md Tuần 2: legal_source, tax_rule_category, tax_rule_version)
async function main() {
  // TODO: thêm dữ liệu seed cho tax_rule_version (ngưỡng 1 tỷ, hiệu lực 2026-01-01)
}
main();
EOF
print_success "   ✅ Đã tạo Package Database (Prisma 7)."

# =============================================================================
# BƯỚC 3: App Backend (CMS)
# =============================================================================
print_step "🔧 [Bước 3/5] Đang tạo App Backend (CMS)..."
mkdir -p apps/backend/app/admin/login apps/backend/app/admin/dashboard \
         apps/backend/app/api/health apps/backend/lib

cat > apps/backend/package.json << 'EOF'
{
  "name": "@tinhchuan/backend",
  "version": "1.0.0",
  "private": true,
  "scripts": { "dev": "next dev -p 3001", "build": "next build", "start": "next start -p 3001" },
  "dependencies": {
    "@tinhchuan/database": "*", "next": "16.3.0", "react": "19.2.0", "react-dom": "19.2.0", "zod": "4.4.3",
    "bcryptjs": "^2.4.3", "ioredis": "^5.4.1"
  },
  "devDependencies": {
    "@types/node": "^24.0.0", "@types/react": "^19.0.0", "@types/bcryptjs": "^2.4.6",
    "typescript": "^5.7.0"
  }
}
EOF

cat > apps/backend/next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
module.exports = {
  output: 'standalone',
  reactStrictMode: true,
  // Bắt buộc: @tinhchuan/database export thẳng source TypeScript (không build
  // sẵn), nếu thiếu dòng này Next.js sẽ không biết cách compile package đó.
  transpilePackages: ['@tinhchuan/database'],
};
EOF

cat > apps/backend/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2017", "lib": ["dom", "dom.iterable", "esnext"], "allowJs": true,
    "skipLibCheck": true, "strict": true, "noEmit": true, "esModuleInterop": true,
    "module": "esnext", "moduleResolution": "bundler", "resolveJsonModule": true,
    "isolatedModules": true, "jsx": "preserve", "incremental": true,
    "plugins": [{ "name": "next" }], "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"], "exclude": ["node_modules"]
}
EOF

cat > apps/backend/app/layout.tsx << 'EOF'
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'TinhChuan CMS', description: 'Hệ thống quản trị' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="vi"><body style={{ margin: 0, fontFamily: 'system-ui' }}>{children}</body></html>);
}
EOF

cat > apps/backend/app/page.tsx << 'EOF'
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
EOF

cat > apps/backend/app/admin/login/page.tsx << 'EOF'
export default function AdminLoginPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Đăng nhập quản trị</h1>
        <form method="POST" action="/admin/login">
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Tên đăng nhập</label>
            <input name="username" type="text" required style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Mật khẩu</label>
            <input name="password" type="password" required style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
          </div>
          <button type="submit" style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '0.375rem', fontWeight: 500, cursor: 'pointer' }}>Đăng nhập</button>
        </form>
      </div>
    </main>
  );
}
EOF

cat > apps/backend/app/admin/dashboard/page.tsx << 'EOF'
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
EOF

cat > apps/backend/app/api/health/route.ts << 'EOF'
import { NextResponse } from 'next/server';
export async function GET() { return NextResponse.json({ status: 'healthy', service: 'tinhchuan-backend' }); }
EOF
print_success "   ✅ Đã tạo App Backend."

# =============================================================================
# BƯỚC 4: App Frontend (Web)
# =============================================================================
print_step "🎨 [Bước 4/5] Đang tạo App Frontend (Web)..."
mkdir -p apps/frontend/app/api/health apps/frontend/lib
# Route Tool 1 (/tool/thue-ban-hang-online), cụm trang /kien-thuc, và
# lib/formula-engine/ CHƯA scaffold ở đây - để làm riêng ở phiên sau
# theo đúng Checklist_Phase1.md Tuần 2.

cat > apps/frontend/package.json << 'EOF'
{
  "name": "@tinhchuan/frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": { "dev": "next dev -p 3000", "build": "next build", "start": "next start -p 3000" },
  "dependencies": { "@tinhchuan/database": "*", "next": "16.3.0", "react": "19.2.0", "react-dom": "19.2.0" },
  "devDependencies": { "@types/node": "^24.0.0", "@types/react": "^19.0.0", "typescript": "^5.7.0" }
}
EOF

cat > apps/frontend/next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
module.exports = {
  output: 'standalone',
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: 'https', hostname: 'cdn.tinhchuan.vn' }] },
  // Bắt buộc: @tinhchuan/database export thẳng source TypeScript (không build
  // sẵn), nếu thiếu dòng này Next.js sẽ không biết cách compile package đó.
  transpilePackages: ['@tinhchuan/database'],
};
EOF

cp apps/backend/tsconfig.json apps/frontend/tsconfig.json

cat > apps/frontend/app/layout.tsx << 'EOF'
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'TinhChuan.vn', description: 'Tính thuế cá nhân & Tra cứu pháp luật' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="vi"><body style={{ margin: 0, fontFamily: 'system-ui' }}>{children}</body></html>);
}
EOF

cat > apps/frontend/app/page.tsx << 'EOF'
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
EOF

cat > apps/frontend/app/api/health/route.ts << 'EOF'
import { NextResponse } from 'next/server';
export async function GET() { return NextResponse.json({ status: 'healthy', service: 'tinhchuan-frontend' }); }
EOF

print_success "   ✅ Đã tạo App Frontend."

# =============================================================================
# BƯỚC 5: Cài dependencies
# =============================================================================
print_step "📥 [Bước 5/5] Đang cài dependencies..."
npm install --loglevel=warn
# Không tự chạy "prisma generate" ở đây: bước này cần DATABASE_URL từ .env,
# mà .env thường được tạo SAU init-projects.sh (xem "Bước tiếp theo" bên dưới).
# "make up" đã tự chạy prisma generate bên trong lúc build Docker image rồi -
# chỉ cần tự chạy tay "npm run db:generate --workspace=packages/database" nếu
# bạn muốn "npm run dev:frontend"/"dev:backend" trực tiếp NGOÀI Docker.

print_success "✅ HOÀN TẤT! Source code đã sẵn sàng."
echo ""
echo "💡 Bước tiếp theo:"
echo "   1. cp .env.example .env && điền mật khẩu thật"
echo "   2. make up"
echo "      (hoặc nếu muốn chạy dev server ngoài Docker: npm run db:generate"
echo "      --workspace=packages/database rồi npm run dev:frontend)"