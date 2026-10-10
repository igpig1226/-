# 网络改造问卷调查

问卷页面由 GitHub Pages 托管。答卷通过 Cloudflare Worker 保存到 D1 数据库，管理员可通过 Cloudflare 控制台或 Wrangler 查看和导出。

GitHub Pages 只能托管静态文件，不能直接把匿名访客的答案写入 GitHub 仓库。把 GitHub 写入令牌放在页面代码中会公开该令牌。

## 部署数据收集服务

Cloudflare Worker、D1 和管理员密码已在 Cloudflare 账户中配置。日后修改 Worker 时，在 `worker` 目录执行：

```sh
cd worker
npx wrangler deploy
```

首次重新建立数据库时，先创建 D1 数据库并更新 `wrangler.toml` 中的数据库 ID，再执行：

```sh
npx wrangler d1 execute survey-responses --remote --file=./schema.sql
npx wrangler secret put ADMIN_PASSWORD
```

当前管理员密码保存在本机 `/Users/igpig/.config/survey-collector/admin-password`，文件权限仅允许当前用户读取；云端副本保存在 Worker secret 中。旧版密码曾写在公开源码中，已停用。Worker URL 是公开接口地址，可以放在前端；管理员密码不能写进仓库。

部署后，可用以下命令检查答卷总数：

```sh
cd worker
npx wrangler d1 execute survey-responses --remote --command='SELECT COUNT(*) AS total FROM responses;'
```

答卷内容位于 `responses` 表的 `answers` JSON 列中。导出时可使用 `npx wrangler d1 export survey-responses --remote --output=survey-responses.sql`，并妥善保管导出文件。

## 旧版数据

旧版答案存储在每位答卷人自己的浏览器 IndexedDB 中，不会自动迁移到 D1。旧数据如尚未导出，需要从保存过答案的原浏览器中提取。

## 本地预览

```sh
python3 -m http.server 8765
```

然后访问 `http://127.0.0.1:8765/`。本地预览会写入同一个云端 D1 数据库，测试后请删除测试记录。
