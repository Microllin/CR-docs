# CR Docs 生产镜像
# 采用「完整依赖 + next start」而非 standalone：
# 让容器启动时能可靠执行 payload 数据库迁移（需要 payload CLI 与 TS 配置）。
FROM node:22.17.0-alpine AS base
RUN apk add --no-cache libc6-compat
# 使用国内镜像源，规避 registry.npmjs.org 拉取超时（同一 integrity，兼容 --frozen-lockfile）
ENV COREPACK_NPM_REGISTRY=https://registry.npmmirror.com
RUN npm config set registry https://registry.npmmirror.com \
 && corepack enable pnpm \
 && pnpm config set registry https://registry.npmmirror.com \
 && pnpm config set fetch-retries 5 \
 && pnpm config set fetch-retry-maxtimeout 120000
WORKDIR /app

# ---------- 依赖 ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# dangerouslyAllowAllBuilds：非交互式安装时放行 sharp/esbuild 的原生构建脚本
RUN pnpm install --frozen-lockfile --prod=false --config.dangerouslyAllowAllBuilds=true

# ---------- 构建 ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# 构建期无需真实数据库，占位即可（Payload 构建不连库）
ENV DATABASE_URL=postgres://build:build@localhost:5432/build
ENV PAYLOAD_SECRET=build-only-secret
RUN pnpm build

# ---------- 运行 ----------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
