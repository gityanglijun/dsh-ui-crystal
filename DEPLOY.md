# 閮ㄧ讲鏂囨。 / Deployment Guide

濡備綍鎶?**dsh-ui-crystal** 閮ㄧ讲鍒?DeepSeek Harness 鐨?`web` profile 涓娿€?How to deploy **dsh-ui-crystal** into a DeepSeek Harness `web` profile.

---

## 1. 姒傝 / Overview

dsh-ui-crystal 鐜板湪鏄?*瀹樻柟 bundle 鏍煎紡鎻掍欢**锛氬寘鍐?`dsh.bundle.patch` 澹版槑
锛坄cordis.patch.yml`锛変細鍦ㄥ畨瑁呮椂**鑷姩婵€娲?*鈥斺€擿dsh plugin add` 浼氭妸瀹冭嚜鍔ㄥ姞杩?`dsh.profile.bundles`锛屼笅娆″惎鍔ㄦ椂 patch 灞傝嚜鍔ㄦ彃鍏?loader 琛屻€?*鏃犻渶鎵嬪姩缂栬緫浠讳綍
profile 鏂囦欢銆?*

| 椤?| 璇存槑 |
|---|---|
| 鎻掍欢绫诲瀷 | DSH **bundle 瀹㈡埛绔彃浠?*锛坄dsh.bundle.patch` + `dsh.client`锛屾祻瑙堝櫒绔函 CSS锛?|
| 閮ㄧ讲鐩爣 | `$DSH_HOME/profiles/web`锛堥粯璁?`~/.dsh/profiles/web`锛?|
| 瀹夎 | 涓€琛屽懡浠わ紙瑙佷笅锛夛紝鍐呴儴鏄畼鏂?`dsh plugin` 鈫?pnpm |
| 婵€娲?| 鑷姩锛坮econcile 鍔犲叆 `dsh.profile.bundles`锛夛紝**閲嶅惎涓€娆?*鍚庤繘鍏?boot 鍥?|
| 鐑洿鏂?| 閲嶅惎鍚庢敼 `client.js` 鐢?client-hmr 鑷姩鐑洿锛屾棤闇€鍐嶉噸鍚?|

---

## 2. 鍓嶇疆鏉′欢 / Requirements

- `dsh` 鍦?PATH 涓婏紙`dsh --version`锛?- `pnpm` 鍦?PATH 涓婏紙`npm i -g pnpm` 鎴?corepack锛?- `node` 鈮?18

---

## 3. 鏂瑰紡 A锛氫竴閿儴缃诧紙鎺ㄨ崘锛? One-click

```sh
# 鎷垮埌浠ｇ爜
git clone https://github.com/<浣犵殑鐢ㄦ埛鍚?/dsh-ui-crystal.git
cd dsh-ui-crystal

# 涓€閿儴缃诧紙瀹樻柟娴佺▼ + 鑷姩婵€娲?+ 鏍￠獙锛?node deploy.js

# 閲嶅惎涓€娆★紝瀹屾垚
dsh web
```

`deploy.js` 鍋氱殑浜嬶紙骞傜瓑锛夛細
1. 鍓嶇疆妫€鏌ワ紙`dsh` / `pnpm`锛?2. `dsh plugin --profile web add <浠撳簱璺緞>` 鈫?瀹夎渚濊禆 + **鑷姩鍔犲叆 bundles**
3. 鏍￠獙 `dsh --profile web --dump-config` 鍚?`ui-crystal`
4. 鎵撳嵃閲嶅惎鎸囧紩

鍙傛暟锛歚--profile <name>`锛堥粯璁?`web`锛夈€乣--skip-pnpm`锛堝彧鏍￠獙涓嶅畨瑁咃級銆?
---

## 4. 鏂瑰紡 B锛氱函鍛戒护涓€琛岄儴缃?/ One-liner

鍙戝竷鍒?GitHub 涔嬪悗锛堟垨鏈湴璺緞锛夛細

```sh
# 瀹樻柟涓€琛屽畨瑁咃紙git 婧?/ 鏈湴璺緞鍧囧彲锛岃嚜鍔ㄦ縺娲?bundle锛?dsh plugin --profile web add "github:<浣犵殑鐢ㄦ埛鍚?/dsh-ui-crystal#main"
# 鏈湴鏈彂甯冩椂锛歞sh plugin --profile web add /缁濆/璺緞/dsh-ui-crystal

dsh web        # 閲嶅惎涓€娆?```

**灏辫繖涓よ銆?* 涓嶉渶瑕佹敼浠讳綍閰嶇疆鈥斺€擿dsh.bundle.patch` 浼氬湪鍚姩鏃惰嚜鍔ㄦ彃鍏?`ui-crystal` 琛屻€?
鏇存柊锛歚dsh plugin --profile web update dsh-ui-crystal`锛堟崲 git ref 鏃跺悓鐞嗭級锛岄噸鍚敓鏁堛€?
---

## 5. 楠岃瘉 / Verification

| 妫€鏌ョ偣 | 鏂规硶 | 棰勬湡 |
|---|---|---|
| bundle 宸叉敞鍐?| `cat ~/.dsh/profiles/web/package.json` | `dsh.profile.bundles` 鍚?`dsh-ui-crystal` |
| loader 琛屽凡鐢熸晥 | `dsh --profile web --dump-config \| grep ui-crystal` | 杈撳嚭 `- id: ui-crystal`锛堟潵鑷?`# == dsh-ui-crystal` 灞傦級 |
| 椤甸潰宸插姞杞芥彃浠?| 娴忚鍣ㄦ帶鍒跺彴<br>`document.querySelector('style[data-plugin-css="dsh-ui-crystal/theme.css"]')` | 杩斿洖 `<style>` 鍏冪礌 |
| 鎻掍欢鐘舵€佹甯?| 璁剧疆 鈫?鎻掍欢鍒楄〃 | `entryId: ui-crystal` 鐘舵€?`active` |

---

## 6. 甯歌闂 / Troubleshooting

| 鐥囩姸 | 鍘熷洜 | 瑙ｅ喅 |
|---|---|---|
| `dsh: command not found` | dsh 涓嶅湪 PATH | 瀹夎 DeepSeek Harness 鎴栧姞鍏?PATH |
| `pnpm not found on PATH` | 鏈 pnpm | `npm i -g pnpm` 鎴?corepack |
| 椤甸潰鏃犲彉鍖?| 娌￠噸鍚?/ 娴忚鍣ㄧ紦瀛?| 閲嶅惎 `dsh web` + **Ctrl+Shift+R** |
| `ui-crystal` 鍦ㄦ彃浠跺垪琛ㄩ噷 failed | 鏃х増鏈己 host 鍏ュ彛 | 鎷夋渶鏂颁唬鐮?`node build.js` 閲嶆柊閮ㄧ讲锛堝綋鍓嶇増鏈湁 `index.js`锛?|
| 鏀逛簡 `client.js` 娌″弽搴?| HMR 鏈Е鍙戞垨椤甸潰鏃?| 绛?1 绉掓垨 F5 |
| 鏀逛簡 bundle patch 娌″弽搴?| 鍚姩鏃舵墠鍚堟垚 | 閲嶅惎 `dsh web` |
| 灏忓睆鐪嬩笉鍒伴哺楸?| 瑙嗗彛 < 720px | 妗岄潰绐楀彛鏌ョ湅 |

---

## 7. 鍗歌浇 / Uninstall

```sh
dsh plugin --profile web remove dsh-ui-crystal
dsh web        # 閲嶅惎
```

锛坆undle 琛岄殢渚濊禆绉婚櫎鑷姩娑堝け锛屾棤闇€鎵嬪姩娓呯悊 profile 鏂囦欢銆傦級

---

## 8. 鏃ュ父杩唬 / Iteration

- 鏀规牱寮忥細`src/styles.css` 鈫?`node build.js` 鈫?娴忚鍣ㄨ嚜鍔ㄧ儹鏇?- 鎹㈤哺楸煎浘锛氭浛鎹?`assets/whale-light.webp` / `assets/whale-dark.webp` 鈫?`node build.js`
- 鏈満宸查儴缃诧紙pnpm `link:` 鎸囧悜浠撳簱锛夛細`node build.js` 鍚庡嵆鐢熸晥锛屾棤闇€閲嶈
