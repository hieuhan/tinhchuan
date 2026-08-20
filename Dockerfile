ARG APP_NAME
FROM node:24-alpine AS base
WORKDIR /app

FROM base AS dependencies
ARG APP_NAME
# Không cần build tool (python3/make/g++) nữa: bcryptjs là pure JS và Prisma 7
# là rust-free client, không còn package nào cần compile native binary.
COPY package.json package-lock.json* ./
COPY packages/database/package.json ./packages/database/
COPY apps/${APP_NAME}/package.json ./apps/${APP_NAME}/
RUN npm ci

FROM base AS builder
ARG APP_NAME
ENV NEXT_TELEMETRY_DISABLED=1
# KHÔNG cần khai báo DATABASE_URL giả ở đây. "prisma generate" không kết nối
# DB thật, chỉ đọc schema.prisma để sinh code - lý do trước đây phải bịa giá
# trị giả là vì packages/database/prisma.config.ts dùng helper env('DATABASE_URL')
# của Prisma, helper này ép buộc biến PHẢI tồn tại (throw PrismaConfigEnvError
# nếu thiếu). Đã đổi sang process.env.DATABASE_URL (xem prisma.config.ts) -
# trả về undefined thay vì throw, và từ Prisma 7.2.0 trở lên (dự án dùng 7.9.1)
# "prisma generate" chấp nhận url undefined. Giá trị DATABASE_URL thật chỉ
# thật sự bắt buộc khi chạy "prisma migrate deploy" lúc runtime, lấy từ
# "environment:" trong docker-compose.yml, không liên quan bước build này.
COPY package.json package-lock.json* ./
COPY --from=dependencies /app/node_modules ./node_modules
COPY packages/ ./packages/
COPY apps/ ./apps/

WORKDIR /app/packages/database
RUN npx prisma generate

WORKDIR /app
RUN npm run build --workspace=apps/${APP_NAME}

FROM base AS runner
ARG APP_NAME
ENV APP_NAME=${APP_NAME}
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME="0.0.0.0"

RUN addgroup -g 1001 -S nodejs && adduser -S app_user -u 1001 -G nodejs

COPY --from=builder --chown=app_user:nodejs /app/apps/${APP_NAME}/.next/standalone /app
COPY --from=builder --chown=app_user:nodejs /app/apps/${APP_NAME}/.next/static /app/apps/${APP_NAME}/.next/static
COPY --from=builder --chown=app_user:nodejs /app/apps/${APP_NAME}/public /app/apps/${APP_NAME}/public
# Prisma 7 sinh client vào packages/database/generated/client (đường dẫn tự
# khai báo qua "output" trong schema.prisma), KHÔNG còn ở node_modules/.prisma
# như Prisma 6 nữa - "next build" standalone đôi khi trace thiếu file này nên
# copy tay để chắc chắn container runtime luôn có sẵn.
COPY --from=builder --chown=app_user:nodejs /app/packages/database/generated /app/packages/database/generated

USER app_user
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1:3000/api/health || exit 1

CMD node apps/${APP_NAME}/server.js
