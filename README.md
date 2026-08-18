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
| **Background switcher** | 🎨 可拖动按钮：27 张内置透明壁纸 + **本地图片上传**（canvas 压缩后持久化）+ **透明度滑块** + **角落/全屏**展示方式 + localStorage 记忆 |
| **桌面宠物** | 🐋 7 个透明动画（idle/walk/dance/eat/wave/kick/punish，AE 渲染 PNG 序列→动画 WebP），**状态机**自动切换（闲逛→散步移动→久置入睡），走路带位移 + 镜像朝两个方向，可拖动，点击唤出面板 |
| Typography | Nicer UI / code font stacks (full CJK fallbacks) |

### Desktop pet / 桌宠

- 默认开启：右下角鲸鱼，**idle 呼吸 → 随机散步（带位移、左右镜像）→ 久置入睡**；点击/拖动即唤醒
- **桌宠开启时 🎨 按钮自动隐藏**（桌宠本身是入口，点击唤出面板），关闭桌宠后按钮恢复——避免双控件占屏
- 面板「🐋 桌宠」区：8 个状态按钮（idle/walk/dance/eat/wave/kick/punish/sleep）+ ✅/⛔ 开关
- 所有动画统一归一化（鲸鱼高 200px、380×240 画布），显示大小一致

### Background switcher / 背景切换

- 点击 🎨 按钮（**按住可拖动到任意位置**，位置自动记忆）打开面板：内置背景缩略图、🐋 鲸鱼娘、无背景、📁 本地图片、透明度滑块
- **展示方式**：内置图片固定右下角自然大小；**用户上传的图片可选“角落 / 全屏”**（全屏 = cover 拉伸）
- **添加自己的背景**：把图片（png/jpg/webp/gif）丢进插件目录 `assets/backgrounds/`，刷新后自动出现在列表（由插件 Node 端伺服，无需重新构建）。内置图片已做**白底转透明 + 水印清理**（`node make-transparent.mjs` 可对新增图片重复执行）
- 本地图片上传会先压缩（最长边 1920px）再存入 localStorage；选择、展示方式与透明度刷新后保留

## How it works / 原理

A pure-CSS **client plugin** in the DSH sense: the package declares
`dsh.client` and exposes a `./client` bundle that the web shell materializes.
Materializing injects one `<style>` tag that overrides the harness's
`--dsw-*` design tokens plus a few stable attribute-hooked surfaces, and
builds the background layer + switcher UI. No server logic, no dependencies,
no build step for consumers.

## Install / 安装（官方 bundle 格式，一行部署）

> 📖 完整部署文档见 **[DEPLOY.md](DEPLOY.md)**（一键脚本、一行命令、验证、故障排查、卸载）。

**一键部署（推荐）：**

```sh
git clone https://github.com/gityanglijun/dsh-ui-crystal.git
cd dsh-ui-crystal
node deploy.js        # 官方 dsh plugin 流程 + bundle 自动激活 + 校验
dsh web               # 重启一次
```

**纯命令一行部署**：

```sh
dsh plugin --profile web add "github:gityanglijun/dsh-ui-crystal#main"
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
