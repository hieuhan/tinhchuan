#!/usr/bin/env bash
# =============================================================================
# bootstrap/init-projects.sh - Khởi tạo Source Code Next.js Fullstack
# =============================================================================
# CẤU TRÚC:
#   packages/database: Drizzle Schema dùng chung.
#   apps/frontend:      Next.js Web (Port nội bộ 3000) - khởi tạo bằng
#                        create-next-app, sau đó patch lại cho khớp monorepo.
#   apps/backend:        Next.js CMS (Port nội bộ 3001) - tương tự.
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

# create-next-app báo lỗi "path not writable" (thông báo gây hiểu lầm - bản
# chất là parent directory chưa tồn tại) nếu thư mục cha "apps/" chưa có sẵn.
# Phải mkdir thư mục cha RỖNG trước, không được tạo sẵn "apps/backend" hay
# "apps/frontend" (create-next-app báo lỗi conflict nếu thư mục đích đã có
# sẵn thư mục con bên trong).
mkdir -p apps

# Cờ dùng chung khi gọi create-next-app cho cả 2 app - ý nghĩa từng cờ xem ở
# lời gọi thật tại Bước 3/4.
readonly NEXT_APP_FLAGS=(
  --typescript --tailwind --eslint --app --no-src-dir
  --import-alias "@/*" --use-npm --skip-install --yes
  --disable-git --no-agents-md
)

# =============================================================================
# BƯỚC 1: Root Package.json
# =============================================================================
print_step "📦 [Bước 1/6] Đang tạo Root Package.json..."
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
    "db:push": "npm run db:push --workspace=packages/database",
    "db:migrate": "npm run db:migrate --workspace=packages/database",
    "db:studio": "npm run db:studio --workspace=packages/database"
  }
}
EOF
print_success "   ✅ Đã tạo Root Package.json."

# =============================================================================
# BƯỚC 2: Package Database (Drizzle ORM)
# =============================================================================
print_step "🗄️ [Bước 2/6] Đang tạo Package Database (Drizzle)..."
# Không tạo sẵn thư mục "drizzle/" (nơi chứa file migration SQL) - drizzle-kit
# tự tạo thư mục này khi chạy "db:generate" lần đầu, tạo trước là thừa.
mkdir -p packages/database/src

cat > packages/database/package.json << 'EOF'
{
  "name": "@tinhchuan/database",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:migrate": "tsx src/migrate.ts",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "drizzle-orm": "0.45.2",
    "pg": "8.23.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.10",
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

# npm workspace chạy lệnh với cwd = packages/database, nhưng file .env thật
# nằm ở ROOT monorepo (tạo từ .env.example) - phải trỏ đường dẫn tường minh
# để drizzle-kit đọc được DATABASE_URL.
cat > packages/database/drizzle.config.ts << 'EOF'
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

loadEnv({ path: path.resolve(process.cwd(), '../../.env') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL chưa được cấu hình trong file .env ở thư mục gốc dự án.');
}

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
EOF

# Schema để trống khung sườn, bạn sẽ tự định nghĩa bảng sau theo
# data_engine_schema.sql (Checklist_Phase1.md Tuần 2: legal_source,
# tax_rule_category, tax_rule_version).
cat > packages/database/src/schema.ts << 'EOF'
// TODO: Định nghĩa các bảng (pgTable) tại đây theo data_engine_schema.sql
// Ví dụ mẫu (xoá khi bắt đầu định nghĩa bảng thật):
//
// import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
//
// export const taxRuleVersion = pgTable('tax_rule_version', {
//   id: uuid('id').primaryKey().defaultRandom(),
//   effectiveFrom: timestamp('effective_from').notNull(),
//   createdAt: timestamp('created_at').notNull().defaultNow(),
// });

// Export rỗng bắt buộc để file được nhận diện là module hợp lệ khi chưa có
// bảng nào - xoá dòng dưới ngay khi thêm bảng thật đầu tiên ở trên.
export {};
EOF

cat > packages/database/src/client.ts << 'EOF'
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

// Dùng connection pool thay vì single client - phù hợp môi trường Next.js
// server-side có nhiều request đồng thời (Server Actions/Server Components).
const globalForDatabase = globalThis as unknown as { pgPool?: Pool };

const pool =
  globalForDatabase.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });

if (process.env.NODE_ENV !== 'production') globalForDatabase.pgPool = pool;

export const db = drizzle(pool, { schema });
EOF

cat > packages/database/src/index.ts << 'EOF'
export { db } from './client';
export * from './schema';
EOF

cat > packages/database/src/migrate.ts << 'EOF'
// Áp dụng migration đã generate sẵn trong thư mục drizzle/. Chạy bằng:
// npm run db:migrate --workspace=packages/database (thực thi trên HOST, dùng
// DATABASE_URL trỏ "localhost" đã forward cổng - xem ghi chú trong .env.example).
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
loadEnv({ path: path.resolve(process.cwd(), '../../.env') });

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: './drizzle' });
  await pool.end();
  console.log('✅ Đã áp dụng migration thành công.');
}

main().catch((error) => {
  console.error('❌ Migration thất bại:', error);
  process.exit(1);
});
EOF

cat > packages/database/src/seed.ts << 'EOF'
// Seed dữ liệu ban đầu - chạy bằng: npx tsx src/seed.ts (trong thư mục
// packages/database). Xem Checklist_Phase1.md Tuần 2: legal_source,
// tax_rule_category, tax_rule_version.
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
loadEnv({ path: path.resolve(process.cwd(), '../../.env') });

async function main() {
  // TODO: thêm dữ liệu seed cho tax_rule_version (ngưỡng 1 tỷ, hiệu lực 2026-01-01)
}

main();
EOF
print_success "   ✅ Đã tạo Package Database (Drizzle)."

# =============================================================================
# BƯỚC 3: App Backend (CMS) - khởi tạo bằng create-next-app
# =============================================================================
print_step "🔧 [Bước 3/6] Đang tạo App Backend (CMS) bằng create-next-app..."
npx --yes create-next-app@latest apps/backend "${NEXT_APP_FLAGS[@]}"

node -e "
const fs = require('fs');
const p = 'apps/backend/package.json';
const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
pkg.name = '@tinhchuan/backend';
pkg.scripts.dev = 'next dev -p 3001';
pkg.scripts.start = 'next start -p 3001';
pkg.dependencies['@tinhchuan/database'] = '*';
pkg.dependencies['zod'] = '4.4.3';
pkg.dependencies['bcryptjs'] = '^2.4.3';
pkg.dependencies['ioredis'] = '^5.4.1';
pkg.devDependencies['@types/bcryptjs'] = '^2.4.6';
fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n');
"

cat > apps/backend/next.config.ts << 'EOF'
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // Bắt buộc: @tinhchuan/database export thẳng source TypeScript (không build
  // sẵn), nếu thiếu dòng này Next.js sẽ không biết cách compile package đó.
  transpilePackages: ['@tinhchuan/database'],
};

export default nextConfig;
EOF

mkdir -p apps/backend/app/admin/login apps/backend/app/admin/dashboard apps/backend/app/api/health apps/backend/lib

# Font Be Vietnam Pro self-host qua next/font/google theo AGENTS.md mục 2 -
# ghi đè layout mặc định (font Geist) của create-next-app.
cat > apps/backend/app/layout.tsx << 'EOF'
import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';

const beVietnamPro = Be_Vietnam_Pro({
  variable: '--font-be-vietnam-pro',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = { title: 'TinhChuan CMS', description: 'Hệ thống quản trị' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
EOF

cat > apps/backend/app/page.tsx << 'EOF'
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
EOF

cat > apps/backend/app/admin/login/page.tsx << 'EOF'
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
EOF

cat > apps/backend/app/admin/dashboard/page.tsx << 'EOF'
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
EOF

cat > apps/backend/app/api/health/route.ts << 'EOF'
import { NextResponse } from 'next/server';
export async function GET() { return NextResponse.json({ status: 'healthy', service: 'tinhchuan-backend' }); }
EOF
print_success "   ✅ Đã tạo App Backend."

# =============================================================================
# BƯỚC 4: App Frontend (Web) - khởi tạo bằng create-next-app
# =============================================================================
print_step "🎨 [Bước 4/6] Đang tạo App Frontend (Web) bằng create-next-app..."
npx --yes create-next-app@latest apps/frontend "${NEXT_APP_FLAGS[@]}"

node -e "
const fs = require('fs');
const p = 'apps/frontend/package.json';
const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
pkg.name = '@tinhchuan/frontend';
pkg.scripts.dev = 'next dev -p 3000';
pkg.scripts.start = 'next start -p 3000';
pkg.dependencies['@tinhchuan/database'] = '*';
fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n');
"

cat > apps/frontend/next.config.ts << 'EOF'
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
EOF

mkdir -p apps/frontend/app/api/health apps/frontend/lib
# Route Tool 1 (/tool/thue-ban-hang-online), cụm trang /kien-thuc, và
# lib/formula-engine/ CHƯA scaffold ở đây - để làm riêng ở phiên sau theo
# đúng Checklist_Phase1.md Tuần 2.

cat > apps/frontend/app/layout.tsx << 'EOF'
import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';

const beVietnamPro = Be_Vietnam_Pro({
  variable: '--font-be-vietnam-pro',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = { title: 'TinhChuan.vn', description: 'Tính thuế cá nhân & Tra cứu pháp luật' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
EOF

cat > apps/frontend/app/page.tsx << 'EOF'
export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-gray-900">TinhChuan.vn</h1>
      <p className="text-gray-500 mt-4">Hệ thống tính thuế cá nhân & tra cứu pháp luật.</p>
      <div className="flex gap-4 mt-8">
        <a href="/admin/login" className="px-6 py-3 bg-blue-600 text-white rounded-md">Trang quản trị</a>
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
# BƯỚC 5: Dọn dẹp file thừa do create-next-app tự sinh
# =============================================================================
print_step "🧹 [Bước 5/6] Đang dọn dẹp file thừa từ create-next-app..."
rm -f apps/frontend/.gitignore apps/backend/.gitignore
rm -f apps/frontend/README.md apps/backend/README.md
print_success "   ✅ Đã dọn dẹp."

# =============================================================================
# BƯỚC 6: Cài dependencies
# =============================================================================
print_step "📥 [Bước 6/6] Đang cài dependencies..."
npm install --loglevel=warn
print_success "   ✅ Đã cài dependencies."

print_success "✅ HOÀN TẤT! Source code đã sẵn sàng."
echo ""
echo "💡 Bước tiếp theo:"
echo "   1. cp .env.example .env && điền mật khẩu thật"
echo "   2. Định nghĩa bảng trong packages/database/src/schema.ts"
echo "   3. npm run db:generate   (sinh file migration SQL từ schema.ts)"
echo "   4. make up"