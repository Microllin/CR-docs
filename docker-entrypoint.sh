#!/bin/sh
set -e

echo "[entrypoint] 等待数据库并执行迁移..."
# Payload 生产模式使用迁移文件建表（不 push）
node_modules/.bin/payload migrate

echo "[entrypoint] 启动 Next.js..."
exec node_modules/.bin/next start -H 0.0.0.0 -p 3000
