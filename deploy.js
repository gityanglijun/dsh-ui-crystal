// deploy.js — one-click deployment of dsh-ui-crystal into a DeepSeek Harness
// `web` profile, using the OFFICIAL bundle-plugin flow (dsh.bundle.patch).
//
// Usage:
//   node deploy.js                 # deploy into the web profile (default)
//   node deploy.js --profile web   # explicit profile name
//   node deploy.js --skip-pnpm     # skip the dependency install, only verify
//
// Because package.json declares `dsh.bundle.patch`, `dsh plugin --profile web
// add <this-repo>`:
//   1. installs the dependency (pnpm),
//   2. AUTO-APPENDS "dsh-ui-crystal" to dsh.profile.bundles,
//   3. the bundle's cordis.patch.yml auto-inserts the loader row on next boot.
// So deployment is effectively one command + one restart — no manual
// cordis.patch.yml editing. This script is idempotent and re-runnable.
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
const manifestPath = path.join(profileDir, "package.json");

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

  // sanity: the reconcile must have registered us as a bundle
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const bundles = manifest.dsh?.profile?.bundles ?? [];
    log(bundles.includes(PKG_NAME)
      ? `profile bundles include ${PKG_NAME} ✓ (auto-activated via dsh.bundle)`
      : `WARNING: ${PKG_NAME} not in dsh.profile.bundles — reconcile may not have run`);
  }

  verify();

  console.log(`
──────────────────────────────────────────────────────────
 dsh-ui-crystal deployed to profile "${profile}".
──────────────────────────────────────────────────────────
 Next steps:
 1) RESTART the web service once (bundle layers compose at boot):
      dsh ${profile === "web" ? "web" : `--profile ${profile}`}
 2) Open the app and HARD-REFRESH (Ctrl+Shift+R).
 3) Confirm it loaded (browser console):
      document.querySelector('style[data-plugin-css="dsh-ui-crystal/theme.css"]')
    or check Settings → Plugins → entryId "ui-crystal" is active.

 One-line install from a git source (after publishing):
      dsh plugin --profile ${profile} add "github:<user>/dsh-ui-crystal#main"

 Uninstall:
      dsh plugin --profile ${profile} remove ${PKG_NAME}
    then restart.
──────────────────────────────────────────────────────────`);
}

try {
  main();
} catch (e) {
  console.error(`[deploy] ERROR: ${e.message}`);
  process.exit(1);
}
