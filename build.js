// Build script: src/styles.css + assets/*.webp -> client.js
//
// The DeepSeek Harness web shell materializes the `./client` export of this
// package, so client.js MUST be a committed artifact. Run this after editing
// src/styles.css, the runtime UI (RUNTIME below), or swapping the whale art:
//
//   node build.js
//
// It injects the whale WebP assets (base64) into the __WHALE_LIGHT__ /
// __WHALE_DARK__ placeholders and wraps the stylesheet + background-switcher
// runtime into the client module loader bundle the shell expects.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const readB64 = (rel) => fs.readFileSync(path.join(ROOT, rel)).toString("base64");

const css = read("src/styles.css")
  .replaceAll("__WHALE_LIGHT__", readB64("assets/whale-light.webp"))
  .replaceAll("__WHALE_DARK__", readB64("assets/whale-dark.webp"));

if (css.includes("__WHALE_")) {
  console.error("ERROR: placeholders left unresolved in styles.css");
  process.exit(1);
}

// Runtime: builds the fixed background layer + the switcher UI (built-in
// thumbnails from /ds-crystal/backgrounds, local-image upload, opacity
// slider). Persists to localStorage. Keep this free of backticks and ${}.
const RUNTIME = `		// ---- background layer + background switcher ----
		var layer = document.querySelector(".ds-bg-layer");
		if (!layer) {
			layer = document.createElement("div");
			layer.className = "ds-bg-layer";
			document.body.appendChild(layer);
		}
		var KEY = "ds-crystal-bg";
		var state = { mode: "whale", opacity: 1, img: null };
		try {
			var saved = JSON.parse(localStorage.getItem(KEY) || "null");
			if (saved && typeof saved === "object" && saved.mode) state = saved;
		} catch (e) {}
		function persist() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
		function applyState() {
			layer.dataset.mode = state.mode;
			layer.style.opacity = String(state.opacity);
			if (state.img) layer.style.setProperty("--ds-wall-img", 'url("' + state.img + '")');
			else layer.style.removeProperty("--ds-wall-img");
			var thumbs = document.querySelectorAll(".ds-crystal-thumb");
			for (var i = 0; i < thumbs.length; i++) thumbs[i].classList.toggle("active", thumbs[i].dataset.key === state.img);
			var slider = document.querySelector(".ds-crystal-opacity input");
			if (slider) slider.value = state.opacity;
			var val = document.querySelector(".ds-crystal-op-val");
			if (val) val.textContent = Math.round(state.opacity * 100) + "%";
		}
		function setWallpaper(img) {
			state.mode = "wallpaper";
			state.img = img;
			persist();
			applyState();
		}
		var ui = document.createElement("div");
		ui.className = "ds-crystal-ui";
		var btn = document.createElement("button");
		btn.className = "ds-crystal-btn";
		btn.textContent = "🎨";
		btn.title = "切换背景";
		var panel = document.createElement("div");
		panel.className = "ds-crystal-panel";
		btn.addEventListener("click", function () { panel.classList.toggle("open"); });
		var title = document.createElement("div");
		title.className = "ds-crystal-title";
		title.textContent = "内置背景";
		var thumbs = document.createElement("div");
		thumbs.className = "ds-crystal-thumbs";
		fetch("/ds-crystal/backgrounds")
			.then(function (r) { return r.json(); })
			.then(function (data) {
				(data.files || []).forEach(function (f) {
					var url = "/ds-crystal/assets/" + encodeURIComponent(f);
					var t = document.createElement("div");
					t.className = "ds-crystal-thumb";
					t.dataset.key = url;
					t.style.backgroundImage = 'url("' + url + '")';
					t.title = f;
					t.addEventListener("click", function () { setWallpaper(url); });
					thumbs.appendChild(t);
				});
				applyState();
			})
			.catch(function () {});
		var row = document.createElement("div");
		row.className = "ds-crystal-row";
		var wBtn = document.createElement("button");
		wBtn.textContent = "🐋 鲸鱼娘";
		wBtn.addEventListener("click", function () { state.mode = "whale"; state.img = null; persist(); applyState(); });
		var uBtn = document.createElement("button");
		uBtn.textContent = "📁 本地图片";
		var fileInput = document.createElement("input");
		fileInput.type = "file";
		fileInput.accept = "image/*";
		fileInput.style.display = "none";
		uBtn.addEventListener("click", function () { fileInput.click(); });
		fileInput.addEventListener("change", function () {
			var file = fileInput.files && fileInput.files[0];
			if (!file) return;
			var reader = new FileReader();
			reader.onload = function () {
				var img = new Image();
				img.onload = function () {
					var MAX = 1920;
					var scale = Math.min(1, MAX / Math.max(img.width, img.height));
					var w = Math.round(img.width * scale);
					var h = Math.round(img.height * scale);
					var c = document.createElement("canvas");
					c.width = w; c.height = h;
					c.getContext("2d").drawImage(img, 0, 0, w, h);
					var dataUrl = c.toDataURL("image/webp", 0.82);
					if (dataUrl.length > 2500000) dataUrl = c.toDataURL("image/jpeg", 0.8);
					setWallpaper(dataUrl);
				};
				img.src = reader.result;
			};
			reader.readAsDataURL(file);
		});
		var nBtn = document.createElement("button");
		nBtn.textContent = "无背景";
		nBtn.addEventListener("click", function () { state.mode = "none"; state.img = null; persist(); applyState(); });
		row.appendChild(wBtn);
		row.appendChild(uBtn);
		row.appendChild(nBtn);
		var opRow = document.createElement("div");
		opRow.className = "ds-crystal-opacity";
		var opLabel = document.createElement("span");
		opLabel.textContent = "透明度";
		var slider = document.createElement("input");
		slider.type = "range";
		slider.min = "0.05";
		slider.max = "1";
		slider.step = "0.05";
		var opVal = document.createElement("span");
		opVal.className = "ds-crystal-op-val";
		slider.addEventListener("input", function () {
			state.opacity = parseFloat(slider.value);
			persist();
			applyState();
		});
		opRow.appendChild(opLabel);
		opRow.appendChild(slider);
		opRow.appendChild(opVal);
		var hint = document.createElement("div");
		hint.className = "ds-crystal-hint";
		hint.textContent = "💡 更多背景：把图片放进插件目录 assets/backgrounds/ 即自动出现在列表；或点“本地图片”直接选择。";
		panel.appendChild(title);
		panel.appendChild(thumbs);
		panel.appendChild(row);
		panel.appendChild(opRow);
		panel.appendChild(hint);
		ui.appendChild(btn);
		ui.appendChild(panel);
		document.body.appendChild(ui);
		applyState();`;

const bundle = `/* ============================================================
   dsh-ui-crystal — Crystal UI theme for DeepSeek Harness
   Pure-CSS client plugin + background switcher. The bundle registers a
   factory on the client module loader; materializing it injects one
   <style> tag (overriding the --dsw-* design tokens and a few stable
   attribute-hooked surfaces) and builds the background layer + switcher
   UI (built-in wallpapers, local-image upload, opacity slider).
   GENERATED BY build.js — edit src/styles.css / build.js, not this file.
   ============================================================ */
window.__ModuleLoader__.load({
	id: "dsh-ui-crystal",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		const css = \`${css}\`;
		const tagId = "dsh-ui-crystal/theme.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-ui-crystal";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
${RUNTIME}
		// Cordis plugin shape: the loader applies the entry's exports, so even a
		// pure-CSS client plugin must expose apply. Injection already happened
		// at materialization above; apply itself is a no-op.
		var apply = function() {};
		exports.apply = apply;
		return module.exports;
	}
});
`;

fs.writeFileSync(path.join(ROOT, "client.js"), bundle);
console.log("built client.js:", bundle.length, "bytes");
