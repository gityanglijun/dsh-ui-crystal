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
		var state = { mode: "whale", opacity: 1, img: null, fit: "corner" };
		try {
			var saved = JSON.parse(localStorage.getItem(KEY) || "null");
			if (saved && typeof saved === "object" && saved.mode) state = saved;
		} catch (e) {}
		function persist() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
		function applyState() {
			layer.dataset.mode = state.mode;
			layer.dataset.fit = state.fit || "corner";
			layer.style.opacity = String(state.opacity);
			if (state.img) layer.style.setProperty("--ds-wall-img", 'url("' + state.img + '")');
			else layer.style.removeProperty("--ds-wall-img");
			var thumbs = document.querySelectorAll(".ds-crystal-thumb");
			for (var i = 0; i < thumbs.length; i++) thumbs[i].classList.toggle("active", thumbs[i].dataset.key === state.img);
			var slider = document.querySelector(".ds-crystal-opacity input");
			if (slider) slider.value = state.opacity;
			var val = document.querySelector(".ds-crystal-op-val");
			if (val) val.textContent = Math.round(state.opacity * 100) + "%";
			var isBuiltIn = state.img && state.img.indexOf("/ds-crystal/assets/") === 0;
			var fitBtns = document.querySelectorAll(".ds-crystal-fit button");
			for (var f = 0; f < fitBtns.length; f++) {
				var b = fitBtns[f];
				b.classList.toggle("active", b.dataset.fit === (state.fit || "corner"));
				b.disabled = isBuiltIn && b.dataset.fit === "cover";
			}
		}
		function setWallpaper(img, fit) {
			state.mode = "wallpaper";
			state.img = img;
			if (fit) state.fit = fit;
			persist();
			applyState();
		}
		var ui = document.createElement("div");
		ui.className = "ds-crystal-ui";
		var btn = document.createElement("button");
		btn.className = "ds-crystal-btn";
		btn.textContent = "🎨";
		btn.title = "切换背景（按住可拖动）";
		var panel = document.createElement("div");
		panel.className = "ds-crystal-panel";
		// draggable: pointer events (mouse + touch), position persisted
		var dragMoved = false;
		btn.addEventListener("pointerdown", function (e) {
			var r = ui.getBoundingClientRect();
			btn._dx = e.clientX - r.left;
			btn._dy = e.clientY - r.top;
			btn._sx = e.clientX;
			btn._sy = e.clientY;
			try { btn.setPointerCapture(e.pointerId); } catch (e4) {}
		});
		btn.addEventListener("pointermove", function (e) {
			if (btn._sx === undefined) return;
			var nx = e.clientX - btn._dx;
			var ny = e.clientY - btn._dy;
			nx = Math.max(4, Math.min(nx, window.innerWidth - 44));
			ny = Math.max(4, Math.min(ny, window.innerHeight - 44));
			ui.style.left = nx + "px";
			ui.style.top = ny + "px";
			ui.style.bottom = "auto";
		});
		btn.addEventListener("pointerup", function (e) {
			if (btn._sx !== undefined && Math.abs(e.clientX - btn._sx) + Math.abs(e.clientY - btn._sy) > 5) dragMoved = true;
			btn._sx = undefined;
			try { localStorage.setItem("ds-crystal-pos", JSON.stringify({ x: parseFloat(ui.style.left), y: parseFloat(ui.style.top) })); } catch (e5) {}
		});
		btn.addEventListener("click", function () {
			if (dragMoved) { dragMoved = false; return; }
			panel.classList.toggle("open");
			if (panel.classList.contains("open")) panel.classList.toggle("down", ui.getBoundingClientRect().top < 260);
		});
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
					t.addEventListener("click", function () { setWallpaper(url, "corner"); });
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
		var fitRow = document.createElement("div");
		fitRow.className = "ds-crystal-row ds-crystal-fit";
		var cornerBtn = document.createElement("button");
		cornerBtn.dataset.fit = "corner";
		cornerBtn.textContent = "🖼 角落";
		cornerBtn.addEventListener("click", function () { state.fit = "corner"; persist(); applyState(); });
		var coverBtn = document.createElement("button");
		coverBtn.dataset.fit = "cover";
		coverBtn.textContent = "🖥 全屏";
		coverBtn.title = "内置图片固定右下角，仅本地上传图可全屏";
		coverBtn.addEventListener("click", function () { state.fit = "cover"; persist(); applyState(); });
		fitRow.appendChild(cornerBtn);
		fitRow.appendChild(coverBtn);
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
		// ---- whale desktop pet (state machine + animated WebP sprites) ----
		var PET_STATES = ["idle", "walk", "dance", "eat", "wave", "kick", "punish", "sleep"];
		var petState = { enabled: true, anim: "idle", dir: "l", x: null, y: null };
		try {
			var savedPet = JSON.parse(localStorage.getItem("ds-crystal-pet") || "null");
			if (savedPet && typeof savedPet === "object") petState = savedPet;
			if (PET_STATES.indexOf(petState.anim) < 0 || petState.anim === "walk") petState.anim = "idle";
		} catch (e8) {}
		var pet = document.createElement("div");
		pet.className = "ds-pet";
		pet.title = "鲸鱼桌宠：点击打开面板，按住可拖动";
		document.body.appendChild(pet);
		var petTimers = [];
		var walkTimer = null;
		function persistPet() { try { localStorage.setItem("ds-crystal-pet", JSON.stringify(petState)); } catch (e9) {} }
		function clearPetTimers() {
			for (var t = 0; t < petTimers.length; t++) clearTimeout(petTimers[t]);
			petTimers = [];
			if (walkTimer) { clearInterval(walkTimer); walkTimer = null; }
		}
		function rand(a, b) { return a + Math.random() * (b - a); }
		function petDefaultX() { return Math.max(4, window.innerWidth - 404); }
		function petDefaultY() { return Math.max(4, window.innerHeight - 250); }
		function applyPet() {
			var tog = document.querySelector(".ds-crystal-pettoggle");
			if (tog) tog.textContent = petState.enabled ? "✅ 桌宠开" : "⛔ 桌宠关";
			// 桌宠开启时它本身就是入口：隐藏 🎨 按钮，避免双控件占屏
			var bbtn = document.querySelector(".ds-crystal-btn");
			if (bbtn) bbtn.style.display = petState.enabled ? "none" : "";
			pet.style.display = petState.enabled ? "block" : "none";
			if (!petState.enabled) return;
			var anim = PET_STATES.indexOf(petState.anim) >= 0 ? petState.anim : "idle";
			var url = "/ds-crystal/pet/pet-" + anim + ".webp";
			if (pet.dataset.src !== url) {
				pet.dataset.src = url;
				pet.style.backgroundImage = 'url("' + url + '")';
			}
			// 走路朝右时镜像（源动画朝左）
			pet.style.transform = anim === "walk" && petState.dir === "r" ? "scaleX(-1)" : "";
			if (petState.x === null || petState.y === null) {
				petState.x = petDefaultX();
				petState.y = petDefaultY();
			}
			pet.style.left = petState.x + "px";
			pet.style.top = petState.y + "px";
			var pbs = document.querySelectorAll(".ds-crystal-petbtn");
			for (var pi = 0; pi < pbs.length; pi++) pbs[pi].classList.toggle("active", pbs[pi].dataset.anim === petState.anim);
		}
		// ---- 状态机：idle -> 随机散步 -> idle -> 久置入睡 ----
		function petGotoIdle() {
			clearPetTimers();
			setPetAnim("idle");
			petTimers.push(setTimeout(petMaybeWalk, rand(6000, 14000)));
			petTimers.push(setTimeout(petGoSleep, 60000));
		}
		function setPetAnim(anim) {
			petState.anim = anim;
			applyPet();
			persistPet();
		}
		function petMaybeWalk() {
			if (!petState.enabled || petState.anim === "sleep") return;
			petState.dir = Math.random() < 0.5 ? "l" : "r";
			setPetAnim("walk");
			walkTimer = setInterval(petWalkStep, 66);
			petTimers.push(setTimeout(petStopWalk, rand(2500, 6000)));
		}
		function petWalkStep() {
			if (!petState.enabled || petState.anim !== "walk") { if (walkTimer) { clearInterval(walkTimer); walkTimer = null; } return; }
			if (petState.x === null) petState.x = petDefaultX();
			var speed = 2.2;
			var nx = petState.x + (petState.dir === "r" ? speed : -speed);
			var maxX = Math.max(4, window.innerWidth - 384);
			if (nx <= 4) { nx = 4; petState.dir = "r"; applyPet(); }
			else if (nx >= maxX) { nx = maxX; petState.dir = "l"; applyPet(); }
			petState.x = nx;
			pet.style.left = nx + "px";
			persistPet();
		}
		function petStopWalk() { if (petState.anim === "walk") petGotoIdle(); }
		function petGoSleep() {
			if (!petState.enabled || petState.anim !== "idle") return;
			clearPetTimers();
			setPetAnim("sleep");
		}
		function petWake() { if (petState.anim === "sleep") petGotoIdle(); }
		function petPlayOnce(anim) {
			clearPetTimers();
			petState.anim = anim;
			applyPet();
			persistPet();
			petTimers.push(setTimeout(petGotoIdle, anim === "dance" || anim === "punish" ? 5000 : 4000));
		}
		// drag（点击醒睡 + 开面板）
		var petDrag = false;
		pet.addEventListener("pointerdown", function (e) {
			petWake();
			var r = pet.getBoundingClientRect();
			pet._dx = e.clientX - r.left;
			pet._dy = e.clientY - r.top;
			pet._sx = e.clientX;
			pet._sy = e.clientY;
			try { pet.setPointerCapture(e.pointerId); } catch (e10) {}
		});
		pet.addEventListener("pointermove", function (e) {
			if (pet._sx === undefined) return;
			var nx = e.clientX - pet._dx;
			var ny = e.clientY - pet._dy;
			nx = Math.max(4, Math.min(nx, window.innerWidth - 384));
			ny = Math.max(4, Math.min(ny, window.innerHeight - 244));
			pet.style.left = nx + "px";
			pet.style.top = ny + "px";
		});
		pet.addEventListener("pointerup", function (e) {
			if (pet._sx !== undefined && Math.abs(e.clientX - pet._sx) + Math.abs(e.clientY - pet._sy) > 5) petDrag = true;
			pet._sx = undefined;
			petState.x = parseFloat(pet.style.left);
			petState.y = parseFloat(pet.style.top);
			persistPet();
		});
		pet.addEventListener("click", function () {
			if (petDrag) { petDrag = false; return; }
			petWake();
			panel.classList.toggle("open");
		});
		// 面板桌宠控制
		var petTitle = document.createElement("div");
		petTitle.className = "ds-crystal-title";
		petTitle.textContent = "🐋 桌宠";
		var petRow = document.createElement("div");
		petRow.className = "ds-crystal-row ds-crystal-petrow";
		PET_STATES.forEach(function (s) {
			var b = document.createElement("button");
			b.className = "ds-crystal-petbtn";
			b.dataset.anim = s;
			b.textContent = s;
			b.addEventListener("click", function () {
				petState.enabled = true;
				if (s === "walk") petMaybeWalk();
				else if (s === "sleep") { clearPetTimers(); setPetAnim("sleep"); }
				else if (s === "idle") petGotoIdle();
				else petPlayOnce(s);
				applyPet();
			});
			petRow.appendChild(b);
		});
		var petToggle = document.createElement("button");
		petToggle.className = "ds-crystal-pettoggle";
		petToggle.addEventListener("click", function () {
			petState.enabled = !petState.enabled;
			clearPetTimers();
			if (petState.enabled) petGotoIdle();
			persistPet();
			applyPet();
		});
		var petToggleRow = document.createElement("div");
		petToggleRow.className = "ds-crystal-row";
		petToggleRow.appendChild(petToggle);
		panel.appendChild(petTitle);
		panel.appendChild(petRow);
		panel.appendChild(petToggleRow);
		var hint = document.createElement("div");
		hint.className = "ds-crystal-hint";
		hint.textContent = "💡 更多背景：把图片放进插件目录 assets/backgrounds/ 即自动出现在列表；或点“本地图片”直接选择。";
		panel.appendChild(title);
		panel.appendChild(thumbs);
		panel.appendChild(row);
		panel.appendChild(fitRow);
		panel.appendChild(opRow);
		panel.appendChild(hint);
		ui.appendChild(btn);
		ui.appendChild(panel);
		document.body.appendChild(ui);
		// pet 初始化：等 ui 挂载后再跑，确保 🎨 按钮/面板控件可被查到
		applyPet();
		if (petState.enabled) petGotoIdle();
		// restore saved position
		try {
			var pos = JSON.parse(localStorage.getItem("ds-crystal-pos") || "null");
			if (pos && typeof pos.x === "number" && typeof pos.y === "number") {
				ui.style.left = pos.x + "px";
				ui.style.top = pos.y + "px";
				ui.style.bottom = "auto";
			}
		} catch (e6) {}
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
