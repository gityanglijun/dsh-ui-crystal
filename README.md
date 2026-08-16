# dsh-ui-crystal 🐋💎

> Crystal — a polished blue-violet UI theme for the **DeepSeek Harness** web shell, featuring the DeepSeek **鲸鱼娘 (whale-girl)** as a seamless background companion.
>
> 为 DeepSeek Harness 网页端打造的水晶主题：深蓝紫配色 + 鲸鱼娘立绘背景，纯 CSS 客户端插件，无需构建、零依赖、即插即用。

![Light](assets/screenshots/light.png)
![Dark](assets/screenshots/dark.png)

## Features / 特性

| Area | Effect |
|---|---|
| Dark palette | Deep blue-violet scale replaces the stock gray-blue; vivid DeepSeek-blue accent |
| Light palette | Airy blue-tinted white, refined shadows |
| Brand / buttons | Blue → violet gradient primary fill, matching hover states |
| Composer | Glassy translucent input card with backdrop blur and a focus glow |
| Conversation | Soft ambient glow behind the chat column |
| Scrollbars | Blue-violet floating pill thumb (WebKit) + tinted Firefox thumb |
| Background | 鲸鱼娘 transparent PNG embedded as WebP (40% alpha light / 60% dark), zero-scrim, seamless |
| **Background switcher** | 🎨 左下角切换按钮：27 张内置壁纸 + **本地图片上传**（canvas 压缩后持久化）+ **透明度滑块** + localStorage 记忆 |
| Typography | Nicer UI / code font stacks (full CJK fallbacks) |

### Background switcher / 背景切换

- 点击左下角 **🎨** 按钮打开面板：内置背景缩略图、🐋 鲸鱼娘、无背景、📁 本地图片、透明度滑块
- **展示方式**：内置图片固定右下角自然大小；**用户上传的图片可选"角落 / 全屏"**（全屏 = cover 拉伸）
- **添加自己的背景**：把图片（png/jpg/webp/gif）丢进插件目录 `assets/backgrounds/`，刷新后自动出现在列表（由插件 Node 端伺服，无需重新构建）
- 本地图片上传会先压缩（最长边 1920px）再存入 localStorage；选择、展示方式与透明度刷新后保留

## How it works / 原理

A pure-CSS **client plugin** in the DSH sense: the package declares
`dsh.client` and exposes a `./client` bundle that the web shell materializes.
Materializing injects one `<style>` tag that overrides the harness's
`--dsw-*` design tokens plus a few stable attribute-hooked surfaces. No server
logic, no dependencies, no build step for consumers.

## Install / 安装（官方 bundle 格式，一行部署）

> 📖 完整部署文档见 **[DEPLOY.md](DEPLOY.md)**（一键脚本、一行命令、验证、故障排查、卸载）。

**一键部署（推荐）：**

```sh
cd dsh-ui-crystal
node deploy.js        # 官方 dsh plugin 流程 + bundle 自动激活 + 校验
dsh web               # 重启一次
```

**纯命令一行部署**（发布到 GitHub 后，或本地路径）：

```sh
dsh plugin --profile web add "github:<你的用户名>/dsh-ui-crystal#main"
dsh web
```

本包声明 `dsh.bundle.patch`（`cordis.patch.yml`），因此 `dsh plugin add` 会
**自动**把它加入 `dsh.profile.bundles`，启动时自动插入 loader 行——**无需手动
编辑任何 profile 文件**。之后编辑 `client.js` 经 client-hmr 热更新，无需重启。

### Uninstall / 卸载

```sh
dsh plugin --profile web remove dsh-ui-crystal
dsh web
```

## Develop / 开发

The theme's readable source lives in `src/styles.css`; the whale art in
`assets/`. `client.js` is a **generated artifact** — rebuild it after changes:

```sh
node build.js          # src/styles.css + assets/*.webp -> client.js
```

### Customize the whale / 自定义鲸鱼

| Want | Where |
|---|---|
| Bigger / smaller | `background-size: auto 92vh` in `src/styles.css` |
| Stronger / fainter | regenerate `assets/whale-light.webp` (40% alpha) / `assets/whale-dark.webp` (60%) |
| Different art | swap the WebP files (keep transparency), then `node build.js` |
| Reposition | `background-position: calc(100% - 6px) 100%` |

To regenerate the alpha variants from a source PNG with
[sharp](https://sharp.pixelplumbing.com/):

```js
// multiply the alpha channel, e.g. 0.4 for light / 0.6 for dark, then
// .webp({ quality: 82 }) and save into assets/
```

## License / 许可

- **Code** (CSS, build scripts, manifests): [MIT](LICENSE)
- **Artwork** (whale-girl images): **CC BY-NC-SA 4.0** — see [ASSET_LICENSE.md](ASSET_LICENSE.md)
  - Source: [fornarwhal/deepseek-whale-girl-icon](https://github.com/fornarwhal/deepseek-whale-girl-icon)
  - 角色「溟月」by 上善无形 · 二创 by ZipZipPipe · 修复 by QYQCAMIAO

## Credits / 致谢

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) — the host app this theme plugs into
- 鲸鱼娘素材仓库作者 for the artwork
