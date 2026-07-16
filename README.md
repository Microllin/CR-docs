# CR Docs — 基于 Payload CMS 的 VitePress 风格动态文档站

用 **Payload CMS v3**（后台 + 数据）驱动一个 **VitePress 观感** 的文档前台：
三栏布局、左导航树、右侧目录滚动高亮、Shiki 代码高亮、深浅色、`Ctrl/⌘+K` 搜索、上/下翻页。

内容存 **PostgreSQL**，用 **Markdown** 编写，在 `/admin` 可视化后台在线编辑，即改即生效。

## 技术栈

| 层 | 选型 |
|---|---|
| 后台 + API | Payload CMS 3（Next.js 原生，自带 React admin） |
| 前端 | Next.js 16 App Router（同一应用内自研三栏文档 UI） |
| 数据库 | PostgreSQL 16（`@payloadcms/db-postgres`） |
| Markdown | `unified` + `remark-gfm` + `rehype-slug`/`autolink-headings` |
| 代码高亮 | Shiki（`rehype-pretty-code`，双主题 github-light/dark） |
| 搜索 | `cmdk` + `minisearch`（VitePress 本地搜索同款引擎） |
| 深浅色 | `next-themes` |

## 目录结构

```
src/
  collections/Docs.ts        # Markdown 文档集合（drafts + i18n）
  globals/Navigation.ts      # 侧边栏导航树（对应 VitePress sidebar）
  globals/Settings.ts        # 站点设置（站点名/Logo/描述，后台可改）
  migrations/                # Payload/Drizzle 迁移（生产建表）
  app/(payload)/             # Payload 后台 /admin 与 API /api（脚手架自带）
  app/(frontend)/            # VitePress 风格前台
    docs/[[...slug]]/page.tsx  # 三栏文档页（核心）
    search-index/route.ts      # 搜索索引接口
    _components/               # TopNav / Sidebar / TocAside / Pager / SearchDialog / ThemeToggle
    _lib/                      # locale.ts（纯常量）/ nav.ts（Payload 数据）/ markdown.ts（渲染）
    _styles/vitepress.css      # 复刻 VitePress 主题
scripts/seed.ts              # 种子数据（管理员 + 示例文档 + 导航）
scripts/set-nav.ts           # 按 slug 前缀批量配置侧边栏分组
scripts/fix-links.ts         # 把 Markdown 里 .md 相对链接重写为站点 URL
```

## 本地开发

```bash
# 1. 起一个本地 Postgres（或用你自己的）
docker run -d --name crdocs-pg -e POSTGRES_USER=payload -e POSTGRES_PASSWORD=payload \
  -e POSTGRES_DB=crdocs -p 5432:5432 postgres:16-alpine

# 2. 配置环境变量
cp .env.example .env      # 必改 PAYLOAD_SECRET（openssl rand -hex 32）

# 3. 安装依赖并灌入示例数据
pnpm install
pnpm tsx scripts/seed.ts  # 创建管理员 + 3 篇示例文档（账号密码见下方“种子账号”）

# 4. 启动
pnpm dev
```

- 前台：http://localhost:3000/docs/zh
- 后台：http://localhost:3000/admin

### 种子账号

`scripts/seed.ts` 创建的管理员账号**从环境变量读取**，默认值仅供首次登录：

| 变量 | 默认值 |
|---|---|
| `SEED_ADMIN_EMAIL` | `admin@example.com` |
| `SEED_ADMIN_PASSWORD` | `changeme123` |

> ⚠️ 登录后**务必立刻在后台改密码**，或部署前用上述环境变量设置成你自己的强密码。切勿在生产使用默认值。

## 编辑内容

1. 登录 `/admin`。
2. 在「文档」里新建/编辑：`title`、`slug`（如 `guide/install`）、`content`（Markdown）。
3. 在「侧边栏导航」里把文档拖进分组，决定左栏结构与上/下页顺序。
4. 在「站点设置」里改站点名称 / Logo / 描述。

## 生产部署（Docker Compose 自托管）

```bash
cp .env.example .env
# 必改：PAYLOAD_SECRET=<openssl rand -hex 32>；按需改 POSTGRES_* / WEB_PORT
# 建议：SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD 设成你自己的

docker compose up -d --build
```

- 启动时容器自动执行 `payload migrate` 建表。
- 前台：`http://<服务器>:${WEB_PORT}/docs/zh`
- 后台：`http://<服务器>:${WEB_PORT}/admin`
- 数据持久化在 `pgdata` 数据卷；上传的图片持久化在宿主 `./media`。

首次部署后进 `/admin` 注册第一个管理员，或在容器内跑种子脚本：

```bash
docker compose exec web node_modules/.bin/tsx scripts/seed.ts
```

## ⚠️ 本仓库不含的内容（部署前须知）

为避免体积与隐私问题，以下内容**没有提交到仓库**，全新部署时需自行准备：

1. **文档内容不在代码里** —— 所有文档存 PostgreSQL 数据库。全新 `docker compose up` 后是**空站**，需要：
   - 跑 `scripts/seed.ts` 灌示例，或
   - 从已有环境用 `pg_dump` 迁移数据，或
   - 直接在后台 `/admin` 手动录入。
2. **图片（media）不在仓库里** —— 上传的图片存宿主 `./media` 目录（`.gitignore` 已排除）。迁移站点时需把 `./media` 目录一并拷贝到新机器的同名目录下（compose 已把它挂载进容器）。

### 迁移已有站点到新机器

```bash
# 源机器：导出数据库 + 打包图片
docker compose exec -T db pg_dump -U payload -d crdocs --clean --if-exists | gzip > dump.sql.gz
tar czf media.tgz media

# 目标机器：clone 仓库、放好 .env，先起 db，恢复数据 + 图片，再起 web
docker compose up -d db
gunzip -c dump.sql.gz | docker compose exec -T db psql -U payload -d crdocs -q
tar xzf media.tgz
docker compose up -d web
```

## 数据库迁移

改了 collection/global 的字段后，生成新迁移：

```bash
pnpm payload migrate:create <name>   # 生成 src/migrations/*
# 提交到仓库；下次 docker compose up 时 entrypoint 会自动 apply
```
