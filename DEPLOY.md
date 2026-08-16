# 部署文档 / Deployment Guide

如何把 **dsh-ui-crystal** 部署到 DeepSeek Harness 的 `web` profile 上。
How to deploy **dsh-ui-crystal** into a DeepSeek Harness `web` profile.

---

## 1. 概览 / Overview

dsh-ui-crystal 现在是**官方 bundle 格式插件**：包内 `dsh.bundle.patch` 声明
（`cordis.patch.yml`）会在安装时**自动激活**——`dsh plugin add` 会把它自动加进
`dsh.profile.bundles`，下次启动时 patch 层自动插入 loader 行。**无需手动编辑任何
profile 文件。**

| 项 | 说明 |
|---|---|
| 插件类型 | DSH **bundle 客户端插件**（`dsh.bundle.patch` + `dsh.client`，浏览器端纯 CSS） |
| 部署目标 | `$DSH_HOME/profiles/web`（默认 `~/.dsh/profiles/web`） |
| 安装 | 一行命令（见下），内部是官方 `dsh plugin` → pnpm |
| 激活 | 自动（reconcile 加入 `dsh.profile.bundles`），**重启一次**后进入 boot 图 |
| 热更新 | 重启后改 `client.js` 由 client-hmr 自动热更，无需再重启 |

---

## 2. 前置条件 / Requirements

- `dsh` 在 PATH 上（`dsh --version`）
- `pnpm` 在 PATH 上（`npm i -g pnpm` 或 corepack）
- `node` ≥ 18

---

## 3. 方式 A：一键部署（推荐）/ One-click

```sh
# 拿到代码
git clone https://github.com/<你的用户名>/dsh-ui-crystal.git
cd dsh-ui-crystal

# 一键部署（官方流程 + 自动激活 + 校验）
node deploy.js

# 重启一次，完成
dsh web
```

`deploy.js` 做的事（幂等）：
1. 前置检查（`dsh` / `pnpm`）
2. `dsh plugin --profile web add <仓库路径>` → 安装依赖 + **自动加入 bundles**
3. 校验 `dsh --profile web --dump-config` 含 `ui-crystal`
4. 打印重启指引

参数：`--profile <name>`（默认 `web`）、`--skip-pnpm`（只校验不安装）。

---

## 4. 方式 B：纯命令一行部署 / One-liner

发布到 GitHub 之后（或本地路径）：

```sh
# 官方一行安装（git 源 / 本地路径均可，自动激活 bundle）
dsh plugin --profile web add "github:<你的用户名>/dsh-ui-crystal#main"
# 本地未发布时：dsh plugin --profile web add /绝对/路径/dsh-ui-crystal

dsh web        # 重启一次
```

**就这两行。** 不需要改任何配置——`dsh.bundle.patch` 会在启动时自动插入
`ui-crystal` 行。

更新：`dsh plugin --profile web update dsh-ui-crystal`（换 git ref 时同理），重启生效。

---

## 5. 验证 / Verification

| 检查点 | 方法 | 预期 |
|---|---|---|
| bundle 已注册 | `cat ~/.dsh/profiles/web/package.json` | `dsh.profile.bundles` 含 `dsh-ui-crystal` |
| loader 行已生效 | `dsh --profile web --dump-config \| grep ui-crystal` | 输出 `- id: ui-crystal`（来自 `# == dsh-ui-crystal` 层） |
| 页面已加载插件 | 浏览器控制台<br>`document.querySelector('style[data-plugin-css="dsh-ui-crystal/theme.css"]')` | 返回 `<style>` 元素 |
| 插件状态正常 | 设置 → 插件列表 | `entryId: ui-crystal` 状态 `active` |

---

## 6. 常见问题 / Troubleshooting

| 症状 | 原因 | 解决 |
|---|---|---|
| `dsh: command not found` | dsh 不在 PATH | 安装 DeepSeek Harness 或加入 PATH |
| `pnpm not found on PATH` | 未装 pnpm | `npm i -g pnpm` 或 corepack |
| 页面无变化 | 没重启 / 浏览器缓存 | 重启 `dsh web` + **Ctrl+Shift+R** |
| `ui-crystal` 在插件列表里 failed | 旧版本缺 host 入口 | 拉最新代码 `node build.js` 重新部署（当前版本有 `index.js`） |
| 改了 `client.js` 没反应 | HMR 未触发或页面旧 | 等 1 秒或 F5 |
| 改了 bundle patch 没反应 | 启动时才合成 | 重启 `dsh web` |
| 小屏看不到鲸鱼 | 视口 < 720px | 桌面窗口查看 |

---

## 7. 卸载 / Uninstall

```sh
dsh plugin --profile web remove dsh-ui-crystal
dsh web        # 重启
```

（bundle 行随依赖移除自动消失，无需手动清理 profile 文件。）

---

## 8. 日常迭代 / Iteration

- 改样式：`src/styles.css` → `node build.js` → 浏览器自动热更
- 换鲸鱼图：替换 `assets/whale-light.webp` / `assets/whale-dark.webp` → `node build.js`
- 本机已部署（pnpm `link:` 指向仓库）：`node build.js` 后即生效，无需重装
