# GroupClaw

QQ 群场景下的 **GroupClaw（群龙虾）** 交互演示前端（Vite + React + TypeScript）。

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
npm run preview
```

与 **GitHub Pages** 一致的子路径构建（可选，用于本地核对线上资源路径）：

```bash
VITE_BASE_PATH=/groupclaw/ npm run build
npm run preview
# 浏览器打开 http://localhost:4173/groupclaw/
```

## GitHub Pages

仓库已配置 **GitHub Actions** 部署（`.github/workflows/deploy-pages.yml`）。在 GitHub 打开 **Settings → Pages**，将 **Build and deployment** 的 **Source** 设为 **GitHub Actions**，推送 `main` 后会自动构建并发布。

线上地址：<https://zhihe-pan.github.io/groupclaw/>

若将来仓库改名，请同步修改工作流里的 `VITE_BASE_PATH` 与 `vite.config.ts` 中的说明。

仓库：<https://github.com/zhihe-pan/groupclaw>
