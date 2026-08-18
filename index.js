/**
 * dsh-ui-crystal Node half.
 *
 * Host-side behavior for the browser-only theme plugin: serves the built-in
 * background images (assets/backgrounds/*) and a JSON listing over the web
 * server, so the client switcher can offer them without bloating the client
 * bundle with base64. Users can drop their own images into
 * assets/backgrounds/ and they appear in the switcher automatically.
 *
 * No other host-side logic — all theming happens in the ./client bundle.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const name = "dsh-ui-crystal";
export const inject = ["webServer"];

const PKG_DIR = dirname(fileURLToPath(import.meta.url));
const BG_DIR = join(PKG_DIR, "assets", "backgrounds");
const PET_DIR = join(PKG_DIR, "assets", "pet");

const ROUTE_PREFIX = "/ds-crystal";
const ASSETS_PATH = `${ROUTE_PREFIX}/assets`;
const LIST_PATH = `${ROUTE_PREFIX}/backgrounds`;
const PET_PATH = `${ROUTE_PREFIX}/pet`;

const MIME = {
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
};

const IMG_RE = /\.(png|jpe?g|webp|gif)$/i;

/** Extract a safe relative path under the assets prefix; null when invalid. */
/** Extract a safe relative path under a route prefix; null when invalid. */
function sanitizeRoutePath(pathname, prefix) {
  if (!pathname.startsWith(`${prefix}/`)) return null;
  const rel = pathname.slice(prefix.length + 1);
  if (rel === "" || rel.includes("\0")) return null;
  for (const seg of rel.split("/")) {
    if (seg === "" || seg === "." || seg === ".." || seg.includes("\\")) return null;
  }
  return rel;
}

function contentTypeFor(rel) {
  const dot = rel.lastIndexOf(".");
  const ext = dot === -1 ? "" : rel.slice(dot).toLowerCase();
  return MIME[ext] ?? "application/octet-stream";
}

function json(res, status, body, headers = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-cache",
    ...headers,
  });
  res.end(payload);
}

/** Serve one file from a directory, sanitized against path traversal. */
function serveFrom(dir, prefix) {
  return async (req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405);
      res.end();
      return;
    }
    const pathname = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
    const rel = sanitizeRoutePath(pathname, prefix);
    if (rel === null) {
      res.writeHead(404);
      res.end();
      return;
    }
    try {
      const body = readFileSync(join(dir, ...rel.split("/")));
      res.writeHead(200, {
        "content-type": contentTypeFor(rel),
        "cache-control": "no-cache",
      });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end();
    }
  };
}

/** Host loader entry: register the asset + listing routes when a web server exists. */
export function apply(ctx) {
  if (ctx.webServer === undefined) return;
  ctx.effect(() => {
    ctx.webServer.register({ kind: "prefix", path: ASSETS_PATH, handler: serveFrom(BG_DIR, ASSETS_PATH) });
    ctx.webServer.register({ kind: "prefix", path: PET_PATH, handler: serveFrom(PET_DIR, PET_PATH) });
    ctx.webServer.register({
      kind: "exact",
      path: LIST_PATH,
      handler: async (req, res) => {
        if (req.method !== "GET") {
          json(res, 405, { error: "method not allowed; use GET" }, { allow: "GET" });
          return;
        }
        let files = [];
        try {
          files = readdirSync(BG_DIR).filter((f) => IMG_RE.test(f)).sort();
        } catch {
          // directory missing — empty list
        }
        json(res, 200, { files, base: ASSETS_PATH });
      },
    });
  }, "dsh-ui-crystal: background assets");
}
