# 部署文档 / Deployment Guide

如何把 **dsh-ui-crystal** 部署到 DeepSeek Harness 的 `web` profile 上。
How to deploy **dsh-ui-crystal** into a DeepSeek Harness `web` profile.

---

## 1. 概览 / Overview

| 项 | 说明 |
|---|---|
| 插件类型 | DSH **客户端插件**（`dsh.client` 声明，浏览器端纯 CSS，无服务端逻辑） |
| 部署目标 | `$DSH_HOME/profiles/web`（默认 `~/.dsh/profiles/web`，Windows 为 `%USERPROFILE%\.dsh\profiles\web`） |
| 安装机制 | 官方 `dsh plugin --profile web add <路径>`（内部转发 pnpm），把包登记为 profile 的真实依赖 |
| 激活方式 | 在 `cordis.patch.yml` 加一行 loader 条目，**重启一次 `dsh web`** 后进入浏览器 boot 图 |
| 热更新 | 重启之后，改 `client.js` 由内置 client-hmr 自动热更，**无需再重启** |

部署后你会得到三处状态：
1. `web/package.json` 里多一条依赖（如 `"dsh-ui-crystal": "link:<仓库路径>"`）
2. `web/cordis.patch.yml` 里多一个 loader 行
3. 重启后的页面右下角出现鲸鱼娘立绘 + 整套水晶配色

---

## 2. 前置条件 / Requirements

- 已安装 DeepSeek Harness，`dsh` 命令在 PATH 上（`dsh --version` 可执行）
- `pnpm` 在 PATH 上（`dsh plugin` 内部调用 pnpm；`npm i -g pnpm` 或 corepack 均可）
- `node` ≥ 18（DSH 本身需要）

> 不满足也不慌：`deploy.js` 会先做前置检查并给出提示；`--skip-pnpm` 可跳过依赖安装步骤。

---

## 3. 方式 A：一键部署（推荐）/ One-click

```sh
# 拿到代码（二选一）
git clone https://github.com/<你的用户名>/dsh-ui-crystal.git
# 或直接使用本地已有的 dsh-ui-crystal 目录

cd dsh-ui-crystal
node deploy.js
```

脚本输出示例：

```
[deploy] deploying dsh-ui-crystal -> profile "web" (...)
[deploy] running: dsh plugin --profile web add <仓库路径>
Already up to date
[deploy] composed tree contains ui-crystal ✓
```

**然后重启一次：**

```sh
dsh web        # 停掉旧实例后重新启动（新插件行只在启动时进入 boot 图）
```

浏览器打开页面并 **Ctrl+Shift+R 强刷**，右下角即可看到鲸鱼娘。

### deploy.js 参数

| 参数 | 作用 |
|---|---|
| `--profile <name>` | 部署到指定 profile（默认 `web`） |
| `--skip-pnpm` | 跳过 `dsh plugin add`，只补 patch 行 + 校验（适合已手动装过依赖的场景） |

### deploy.js 做了什么（幂等，可重复执行）

1. 前置检查：`dsh`、`pnpm` 是否可用
2. 官方安装：`dsh plugin --profile web add <仓库绝对路径>`（已安装则 pnpm 显示 `Already up to date`）
3. 幂等补行：若 `cordis.patch.yml` 还没有 `ui-crystal` 条目则追加
   ```yaml
   - insert:
       - id: ui-crystal
         name: dsh-ui-crystal
   ```
4. 校验：`dsh --profile web --dump-config` 确认树中包含 `ui-crystal`
5. 打印重启与验证指引

---

## 4. 方式 B：手动官方步骤 / Manual

等价于 deploy.js 做的三件事：

```sh
# 1) 安装依赖（官方 dsh plugin 流程，内部就是 pnpm add）
dsh plugin --profile web add /绝对/路径/dsh-ui-crystal
#    或用 pnpm 直接装（等价）：
#    cd ~/.dsh/profiles/web && pnpm add file:/绝对/路径/dsh-ui-crystal

# 2) 在 ~/.dsh/profiles/web/cordis.patch.yml 末尾追加（幂等，重复执行无害）：
#    - insert:
#        - id: ui-crystal
#          name: dsh-ui-crystal

# 3) 重启
dsh web
```

> `dsh plugin` 会对非 bundle 依赖打印
> `dsh-ui-crystal declares no dsh.bundle — installed as a plain dependency`，
> 这是**预期行为**：客户端插件就是普通依赖 + loader 行，不影响功能。

---

## 5. 验证 / Verification

| 检查点 | 方法 | 预期 |
|---|---|---|
| 依赖已登记 | `cat ~/.dsh/profiles/web/package.json` | `dependencies` 里有 `dsh-ui-crystal` |
| loader 行已生效 | `dsh --profile web --dump-config \| grep ui-crystal` | 输出 `- id: ui-crystal` |
| 页面已加载插件 | 浏览器控制台执行<br>`document.querySelector('style[data-plugin-css="dsh-ui-crystal/theme.css"]')` | 返回 `<style>` 元素（非 null） |
| 插件状态正常 | 设置 → 插件列表 | `entryId: ui-crystal` 状态 `active`（不是 failed） |
| boot 图包含插件 | 浏览器查看源码中 `window.__DSH_BOOT__` | 含 `{"id":"dsh-ui-crystal",...}` |

---

## 6. 常见问题 / Troubleshooting

| 症状 | 原因 | 解决 |
|---|---|---|
| `dsh: command not found` | dsh 不在 PATH | 把 dsh 所在目录加入 PATH；或确认已安装 DeepSeek Harness |
| `pnpm not found on PATH`（警告） | 未装 pnpm | `npm i -g pnpm` 或用 corepack 启用 |
| 页面看不到任何主题变化 | 部署后没重启 / 浏览器缓存旧页面 | 重启 `dsh web` + **Ctrl+Shift+R 强刷** |
| 设置→插件里 `ui-crystal` 是 failed | 旧版本 bundle 曾因缺 host 入口失败 | 拉取最新代码重新 `node build.js` 再部署（当前版本已有 `index.js` host 入口） |
| 改了 `client.js` 没反应 | 页面未连接 HMR 或未刷新 | 保存后等 1 秒，或 F5 刷新 |
| 改了 `cordis.patch.yml` 没反应 | loader 行变更只在启动时生效 | 需要重启 `dsh web` |
| 右下角没有鲸鱼但主题颜色正常 | 视口 < 720px（移动端布局） | 桌面窗口/全屏查看；鲸鱼在小屏被缩小 |
| 卸载后仍有样式残留 | 浏览器缓存 | 强刷或重启后确认插件列表已无 `ui-crystal` |

---

## 7. 卸载 / Uninstall

```sh
dsh plugin --profile web remove dsh-ui-crystal
```

然后从 `~/.dsh/profiles/web/cordis.patch.yml` 删除下面这段，并重启：

```yaml
- insert:
    - id: ui-crystal
      name: dsh-ui-crystal
```

---

## 8. 日常迭代 / Iteration

- 改样式：编辑 `src/styles.css` → `node build.js` → 保存后浏览器自动热更（client-hmr）
- 换鲸鱼图：替换 `assets/whale-light.webp` / `assets/whale-dark.webp` → `node build.js`
- 只改已部署机器：`node build.js` 后无需重装（pnpm `link:` 依赖指向仓库目录，产物实时生效）
