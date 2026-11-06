# 闲置盲盒屋（二手泡泡马特展示站）

- `public/index.html`：店铺页；网址后加 `#admin` 是管理页
- `api/`：读取商品、登录校验、保存、传图（Vercel Functions）
- `lib/store.js`：数据读写、校验、版本升级（migrate）
- 商品数据和图片存在 Vercel Blob，**不在代码仓库里**，所以改代码、重新部署都不会动你的商品。

## 首次部署

1. 在 GitHub 新建仓库，把本文件夹的内容推上去。
2. Vercel → Add New → Project → 导入这个仓库（Framework 选 Other，其余默认）。
3. 项目里打开 Storage → Create → Blob，创建后点 Connect 到本项目（会自动添加 `BLOB_READ_WRITE_TOKEN`）。
4. Settings → Environment Variables 添加 `ADMIN_PASSWORD`（管理密码，建议 16 位以上），然后 Redeploy。
5. Settings → Domains 添加 `pop.suntianji.com`。
6. Cloudflare → suntianji.com → DNS，添加 CNAME：名称 `pop`，目标填 Vercel 页面上显示的值（通常是 `cname.vercel-dns.com`），代理状态选“仅 DNS”（灰色云）。
7. 打开 `https://pop.suntianji.com/#admin` 登录，添加商品。
8. 在 My Space 里把 Web 2 的链接指向 `https://pop.suntianji.com`。

## 以后怎么更新（多代迭代）

- 日常上新、改价、传图：直接在管理页操作，点“发布更新”，不用动代码。
- 改功能或样式：新建分支 → 改代码 → 推送。Vercel 会为每个分支生成预览网址，确认没问题再合并到 `main`，生产站自动更新。
- 每次改动在 `CHANGELOG.md` 记一条。
- 想让 Claude 帮你改：把改动想法和相关文件（或整个仓库的压缩包）发给它，改完把文件覆盖回仓库即可。
- 改数据字段：`lib/store.js` 的 `CURRENT` 加 1，并在 `migrate()` 里写升级代码，旧数据会自动升级。

## 备份与恢复

- 每次“发布更新”，Blob 里会自动多存一份 `backups/时间戳.json`。
- 管理页底部有“导出备份 / 导入备份”，建议每月导出一次存到自己电脑。

## 注意

- 预览部署和生产站共用同一个 Blob，在预览网址的管理页点“发布更新”会改动线上数据；测试时请不要点，或给 Preview 环境单独建一个 Blob。
- 商品数据和图片本身是公开的（买家要看），不要在备注里写私人信息。
- 管理密码没有登录次数限制。可以在 Vercel 的 Firewall 里给 `/api/auth` 加限流规则。
