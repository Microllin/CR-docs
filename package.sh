#!/usr/bin/env bash
# =============================================================================
# CR Docs 交付打包脚本
# -----------------------------------------------------------------------------
# 在项目根目录执行，生成一个干净的源码交付包（不含依赖/构建产物/本机密钥/图片）：
#   ./package.sh            -> ../cr-docs-deploy-YYYYMMDD.tar.gz
#   ./package.sh /tmp/out   -> 输出到指定目录
#
# 交付同事拿到 tar.gz 后：解压 -> 进目录 -> ./deploy.sh 即可。
# =============================================================================
set -euo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

OUT_DIR="${1:-..}"
STAMP="$(date +%Y%m%d)"
NAME="cr-docs-deploy-${STAMP}"
TARBALL="$(cd "$OUT_DIR" && pwd)/${NAME}.tar.gz"

echo "[package] 打包 CR Docs 源码交付包 -> ${TARBALL}"

# 说明：
#  - .env 不打包（含本机密钥，交付方现场由 deploy.sh 生成）；.env.example 保留
#  - media/ 下的实际图片不打包（空站交付），仅保留目录占位
#  - node_modules/.next/.git/*.tar.gz/dump 等构建产物与体积大件全部排除
tar czf "$TARBALL" \
  --exclude='./.git' \
  --exclude='./node_modules' \
  --exclude='./.next' \
  --exclude='./.env' \
  --exclude='./tsconfig.tsbuildinfo' \
  --exclude='./media/*' \
  --exclude='./*.tar.gz' \
  --exclude='./dump.sql.gz' \
  --exclude='./test-results' \
  --exclude='./playwright-report' \
  --transform "s,^\.,${NAME}," \
  .

echo "[package] 完成：$(du -h "$TARBALL" | cut -f1)  ${TARBALL}"
echo "[package] 交付说明：对方解压后 cd ${NAME} && ./deploy.sh"
