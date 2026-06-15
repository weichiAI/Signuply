import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import devServer, { defaultOptions } from "@hono/vite-dev-server";
import nodeAdapter from "@hono/vite-dev-server/node";
import { imagicmaCartographer } from "./server/imagicma-cartographer-plugin";
import { readPrototypeAsset } from "./server/prototype-preview";
import { createViteErrorState, toViteErrorJson, VITE_ERROR_ENDPOINT } from "./server/vite-error-state";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LAUNCH_TOKEN_FILE = path.resolve(
  __dirname,
  ".imagicma",
  "launch-token.json",
);
const RUNTIME_ENV_FILE = path.resolve(
  __dirname,
  ".imagicma",
  "runtime.env",
);
const CLIENT_DIR = path.resolve(__dirname, "client");
const CLIENT_PROTOTYPE_DIR = path.join(CLIENT_DIR, "prototype");
const DIST_CLIENT_PROTOTYPE_DIR = path.resolve(
  __dirname,
  "dist",
  "client",
  "prototype",
);
const DEFAULT_PREVIEW_RUNTIME_CDN_BASE_URL = "https://agentma.cn/preview-runtime/v1";
function isScriptLaunch(mode: "dev" | "start") {
  return (
    process.env.IMAGICMA_SCRIPT_LAUNCH === "1" &&
    process.env.IMAGICMA_LAUNCH_MODE === mode
  );
}

async function readRuntimeEnvValue(targetKey: string) {
  try {
    const raw = await fs.readFile(RUNTIME_ENV_FILE, "utf8");
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex <= 0) continue;
      const key = trimmed.slice(0, separatorIndex).trim();
      if (key !== targetKey) continue;
      return trimmed.slice(separatorIndex + 1).trim();
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }

  return null;
}

async function readRuntimeEnvPort() {
  return readRuntimeEnvValue("PORT");
}

async function resolvePreviewRuntimeUrl() {
  return (
    process.env.IMAGICMA_PREVIEW_RUNTIME_URL?.trim() ||
    (await readRuntimeEnvValue("IMAGICMA_PREVIEW_RUNTIME_URL")) ||
    `${DEFAULT_PREVIEW_RUNTIME_CDN_BASE_URL}/runtime.js`
  );
}

async function resolveRuntimePort(raw = process.env.PORT) {
  let candidate: string | undefined = raw;
  if (candidate === undefined || candidate === null || candidate === "") {
    candidate = (await readRuntimeEnvPort()) ?? undefined;
  }

  if (candidate === undefined || candidate === null || candidate === "") {
    throw new Error("[imagicma] 缺少端口配置：请通过 .imagicma/runtime.env 或 PORT 提供运行时端口");
  }

  const port = Number(candidate);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `[imagicma] 无效端口配置：PORT=${JSON.stringify(candidate)}（期望 1-65535 的整数）`,
    );
  }

  process.env.PORT = String(port);
  return port;
}

async function consumeLaunchToken(mode: "dev" | "start") {
  let raw: string;
  try {
    raw = await fs.readFile(LAUNCH_TOKEN_FILE, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "ENOENT") return false;
    }
    throw error;
  }

  try {
    const token = JSON.parse(raw);
    const valid =
      token?.mode === mode &&
      Number.isInteger(token?.expiresAt) &&
      token.expiresAt >= Date.now();

    await fs.rm(LAUNCH_TOKEN_FILE, { force: true });
    return valid;
  } catch {
    await fs.rm(LAUNCH_TOKEN_FILE, { force: true });
    return false;
  }
}

async function assertLaunchAuthorized(mode: "dev" | "start") {
  if (isScriptLaunch(mode)) return;
  if (await consumeLaunchToken(mode)) return;

  throw new Error(
    "[imagicma] 禁止直接使用 vite 启动。请使用 package.json scripts：pnpm dev",
  );
}

function prototypePreviewPlugin() {
  return {
    name: "imagicma-prototype-preview",
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const urlPath = new URL(req.url ?? "/", "http://localhost").pathname;

          if (urlPath.startsWith("/prototype/")) {
            const asset = await readPrototypeAsset(CLIENT_PROTOTYPE_DIR, urlPath);
            if (!asset) {
              next();
              return;
            }

            res.statusCode = 200;
            res.setHeader("Content-Type", asset.contentType);
            res.end(asset.data);
            return;
          }

          next();
        } catch (error) {
          next(error);
        }
      });
    },
    async closeBundle() {
      try {
        await fs.cp(CLIENT_PROTOTYPE_DIR, DIST_CLIENT_PROTOTYPE_DIR, {
          recursive: true,
          force: true,
        });
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
          return;
        }
        throw error;
      }
    },
  };
}

function imagicmaPreviewFeedbackPlugin(previewRuntimeUrl: string): Plugin {
  const viteErrorState = createViteErrorState();

  return {
    name: "imagicma-preview-feedback",
    apply: "serve",
    configureServer(server) {
      const originalSend = server.ws.send.bind(server.ws);
      server.ws.send = ((payload: unknown, ...args: unknown[]) => {
        viteErrorState.acceptWsPayload(payload);
        return originalSend(payload as never, ...(args as never[]));
      }) as typeof server.ws.send;

      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?")[0] !== VITE_ERROR_ENDPOINT) {
          next();
          return;
        }

        const latestViteError = viteErrorState.getLatestError();
        if (!latestViteError) {
          res.statusCode = 204;
          res.end();
          return;
        }

        res.statusCode = 200;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.setHeader("cache-control", "no-store");
        res.end(toViteErrorJson({ error: latestViteError }));
      });
    },
    transformIndexHtml() {
      return [
        {
          tag: "script",
          children: [
            "window.__IMAGICMA_SHOW_PREVIEW_RUNTIME_LOAD_ERROR__ = function showPreviewRuntimeLoadError(error) {",
            "  window.__IMAGICMA_RUNTIME_ERROR_ACTIVE__ = true;",
            "  console.error('[imagicma-preview-runtime] failed to load', error);",
            "  const message = error instanceof Error && error.message ? error.message : String(error || 'unknown error');",
            "  if (document.getElementById('imagicma-preview-runtime-load-error')) return;",
            "  const root = document.createElement('div');",
            "  root.id = 'imagicma-preview-runtime-load-error';",
            "  root.setAttribute('role', 'alert');",
            "  root.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483647;padding:14px 16px;border:1px solid #fecaca;border-radius:10px;background:#fff1f2;color:#7f1d1d;font:13px/1.5 system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;box-shadow:0 16px 40px rgba(127,29,29,.18)';",
            "  root.textContent = '预览反馈 runtime 加载失败：' + message;",
            "  if (document.body) {",
            "    document.body.appendChild(root);",
            "  } else {",
            "    window.addEventListener('DOMContentLoaded', () => document.body.appendChild(root), { once: true });",
            "  }",
            "};",
          ].join("\n"),
          injectTo: "head",
        },
        {
          tag: "script",
          attrs: {
            type: "module",
            src: previewRuntimeUrl,
            onerror: "window.__IMAGICMA_SHOW_PREVIEW_RUNTIME_LOAD_ERROR__?.(event)",
          },
          injectTo: "head",
        },
        {
          tag: "script",
          attrs: { type: "module" },
          children: [
            "function reportPreviewViteError(payload) {",
            "  const viteError = payload?.err ?? payload;",
            "  if (window.__IMAGICMA_PREVIEW_FEEDBACK__?.reportViteError) {",
            "    window.__IMAGICMA_PREVIEW_FEEDBACK__.reportViteError(viteError);",
            "    return;",
            "  }",
            "}",
            "if (import.meta.hot) {",
            '  import.meta.hot.on("vite:error", (payload) => {',
            "    reportPreviewViteError(payload);",
            "  });",
            '  import.meta.hot.on("vite:afterUpdate", () => {',
            "    window.__IMAGICMA_PREVIEW_FEEDBACK__?.clearRuntimeErrors?.();",
            "  });",
            "}",
          ].join("\n"),
          injectTo: "head",
        },
      ];
    },
  };
}

export default defineConfig(async ({ command }) => {
  const runtimePort = command === "serve" ? await resolveRuntimePort() : null;
  const previewRuntimeUrl = await resolvePreviewRuntimeUrl();

  if (command === "serve") {
    await assertLaunchAuthorized("dev");
  }

  return {
    root: path.resolve(__dirname, "client"),
    server:
      runtimePort === null
        ? undefined
        : {
            host: "0.0.0.0",
            port: runtimePort,
            allowedHosts: ["localhost", "127.0.0.1", ".imagicma.cn", ".agentma.cn", ".agentma.com"],
            strictPort: true,
            hmr: { overlay: false },
    },
    plugins: [
      imagicmaCartographer({ root: path.resolve(__dirname, "client") }),
      imagicmaPreviewFeedbackPlugin(previewRuntimeUrl),
      react(),
      prototypePreviewPlugin(),
      devServer({
        entry: path.resolve(__dirname, "server/dev-app.ts"),
        adapter: nodeAdapter,
        exclude: [/^\/(?!(?:api|__health)(?:\/|$)).*/, ...defaultOptions.exclude],
      }),
      {
        name: "imagicma-runtime-port",
        configResolved(resolvedConfig: import("vite").ResolvedConfig) {
          if (resolvedConfig.command !== "serve" || runtimePort === null) return;
          resolvedConfig.server.port = runtimePort;
          resolvedConfig.server.strictPort = true;
          resolvedConfig.server.host = "0.0.0.0";
        },
      },
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client/src"),
        "@shared": path.resolve(__dirname, "shared"),
      },
    },
    build: {
      outDir: path.resolve(__dirname, "dist/client"),
      emptyOutDir: true,
    },
  };
});
