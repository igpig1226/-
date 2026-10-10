# 网络改造问卷调查

问卷页面由 GitHub Pages 托管。答卷通过 Cloudflare Worker 保存到 D1 数据库，因此不同设备提交的数据可以在同一个管理员页面查看和导出。

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

部署后，填写并提交一份标记为测试的问卷；在另一个浏览器或设备打开 `admin.html`，输入新密码，确认能看见该记录并能导出 JSON。最后从管理员页删除测试记录。

## 旧版数据

旧版答案存储在每位答卷人自己的浏览器 IndexedDB 中，不会自动迁移到 D1。部署新版前，先在**保存过旧答案的同一浏览器和同一网站地址**打开旧版 `admin.html`，导出 JSON。仅在其他浏览器打开管理员页无法取得那些旧答案。

## 本地预览

```sh
python3 -m http.server 8765
```

然后访问 `http://127.0.0.1:8765/`。本地预览会写入同一个云端 D1 数据库，测试后请删除测试记录。
