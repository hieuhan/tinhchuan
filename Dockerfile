ARG APP_NAME
FROM node:24-alpine AS base
WORKDIR /app

FROM base AS dependencies
ARG APP_NAME
# Không cần build tool (python3/make/g++): bcryptjs và "pg" (driver Postgres
# của Drizzle) đều là package thuần JS, không có native binary nào cần
# compile - tránh lỗi mismatch kiến trúc khi build trên Mac Mini ARM64.
COPY package.json package-lock.json* ./
COPY packages/database/package.json ./packages/database/
COPY apps/${APP_NAME}/package.json ./apps/${APP_NAME}/
RUN npm ci

FROM base AS builder
ARG APP_NAME
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json* ./
COPY --from=dependencies /app/node_modules ./node_modules
COPY packages/ ./packages/
COPY apps/ ./apps/
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
# Không copy thêm gì từ packages/database: "transpilePackages" trong
# next.config.ts đã khiến Next.js tự bundle code đó thẳng vào
# .next/standalone lúc build, kể cả dependency runtime (drizzle-orm, pg).

USER app_user
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1:3000/api/health || exit 1

CMD node apps/${APP_NAME}/server.js
