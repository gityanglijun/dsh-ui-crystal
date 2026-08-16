// deploy.js — one-click deployment of dsh-ui-crystal into a DeepSeek Harness
// `web` profile, using the OFFICIAL dsh plugin flow.
//
// Usage:
//   node deploy.js                 # deploy into the web profile (default)
//   node deploy.js --profile web   # explicit profile name
//   node deploy.js --skip-pnpm     # only patch cordis.patch.yml / verify
//
// What it does (idempotent — safe to re-run):
//   1. checks prerequisites (dsh CLI, pnpm)
//   2. installs this package into the profile: dsh plugin --profile <name> add <this-dir>
//   3. ensures the loader row exists in $DSH_HOME/profiles/<name>/cordis.patch.yml
//   4. verifies the composed tree via dsh --profile <name> --dump-config
//   5. prints restart + browser verification steps
//
// A restart of `dsh web` is required once for a NEW plugin row to enter the
// browser boot graph. After that, editing client.js hot-reloads via the
// client HMR chain — no restarts needed.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO_DIR = path.dirname(fileURLToPath(import.meta.url));
const PKG_NAME = "dsh-ui-crystal";
const ROW_ID = "ui-crystal";

const args = process.argv.slice(2);
const profile = args.includes("--profile")
  ? args[args.indexOf("--profile") + 1]
  : "web";
const skipPnpm = args.includes("--skip-pnpm");
const dshHome = process.env.DSH_HOME || path.join(os.homedir(), ".dsh");
const profileDir = path.join(dshHome, "profiles", profile);
const patchFile = path.join(profileDir, "cordis.patch.yml");

const log = (m) => console.log(`[deploy] ${m}`);
const warn = (m) => console.warn(`[deploy] ⚠ ${m}`);

function run(cmd, cmdArgs, opts = {}) {
  const res = spawnSync(cmd, cmdArgs, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...opts,
  });
  if (res.error) throw res.error;
  return res.status ?? 1;
}

function which(cmd) {
  const probe = spawnSync(
    process.platform === "win32" ? "where" : "which",
    [cmd],
    { encoding: "utf8", shell: process.platform === "win32" }
  );
  return probe.status === 0 && probe.stdout.trim().length > 0;
}

function ensurePatchRow() {
  if (!fs.existsSync(profileDir)) {
    throw new Error(
      `profile directory not found: ${profileDir}\n` +
        `Run "dsh plugin --profile ${profile}" once, or start "dsh ${profile === "web" ? "web" : "--profile " + profile}" to auto-initialize it.`
    );
  }
  const content = fs.existsSync(patchFile) ? fs.readFileSync(patchFile, "utf8") : "";
  if (new RegExp(`name:\\s*${PKG_NAME}`).test(content)) {
    log(`${patchFile} already contains the ${PKG_NAME} row — skipping`);
    return;
  }
  const block = `\n# dsh-ui-crystal: Crystal UI theme (client plugin, deployed by deploy.js)\n- insert:\n    - id: ${ROW_ID}\n      name: ${PKG_NAME}\n`;
  const emptyList = /^\s*\[\s*\]\s*$/m;
  let next;
  if (emptyList.test(content)) {
    next = content.replace(emptyList, block.trim());
  } else {
    next = content.replace(/\s*$/, "") + block;
  }
  fs.writeFileSync(patchFile, next, "utf8");
  log(`added loader row to ${patchFile}`);
}

function verify() {
  const out = spawnSync(
    "dsh",
    ["--profile", profile, "--dump-config"],
    { encoding: "utf8", shell: process.platform === "win32" }
  );
  if (out.status !== 0) {
    warn(`dsh --profile ${profile} --dump-config failed (exit ${out.status}) — verify manually`);
    return false;
  }
  const ok = new RegExp(`- id: ${ROW_ID}`).test(out.stdout);
  log(ok ? `composed tree contains ${ROW_ID} ✓` : `composed tree does NOT contain ${ROW_ID} ✗`);
  return ok;
}

function main() {
  log(`deploying ${PKG_NAME} -> profile "${profile}" (${profileDir})`);

  if (!skipPnpm) {
    if (!which("dsh")) {
      throw new Error(
        'dsh CLI not found on PATH. Install DeepSeek Harness first, or pass --skip-pnpm ' +
        'and install the dependency yourself (pnpm add file:<this-dir> in the profile).'
      );
    }
    if (!which("pnpm")) {
      warn("pnpm not found on PATH — dsh plugin forwards to pnpm. Install it (npm i -g pnpm or corepack).");
    }
    log(`running: dsh plugin --profile ${profile} add ${REPO_DIR}`);
    run("dsh", ["plugin", "--profile", profile, "add", REPO_DIR]);
  } else {
    log("--skip-pnpm: skipping dependency install");
  }

  ensurePatchRow();
  verify();

  console.log(`
──────────────────────────────────────────────────────────
 dsh-ui-crystal deployed to profile "${profile}".
──────────────────────────────────────────────────────────
 Next steps:
 1) RESTART the web service once (required for a new plugin row):
      dsh ${profile === "web" ? "web" : `--profile ${profile}`}
 2) Open the app and HARD-REFRESH (Ctrl+Shift+R).
 3) Confirm it loaded (browser console):
      document.querySelector('style[data-plugin-css="dsh-ui-crystal/theme.css"]')
    or check Settings → Plugins → entryId "ui-crystal" is active.

 Uninstall:
      dsh plugin --profile ${profile} remove ${PKG_NAME}
    then remove the "- insert: ui-crystal" block from ${patchFile}
    and restart.
──────────────────────────────────────────────────────────`);
}

try {
  main();
} catch (e) {
  console.error(`[deploy] ERROR: ${e.message}`);
  process.exit(1);
}
