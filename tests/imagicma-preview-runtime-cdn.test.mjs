import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const VITE_CONFIG_PATH = new URL("../vite.config.ts", import.meta.url);
const CARTOGRAPHER_PLUGIN_PATH = new URL("../server/imagicma-cartographer-plugin.ts", import.meta.url);
const DIST_CARTOGRAPHER_PLUGIN_PATH = new URL("../dist/server/imagicma-cartographer-plugin.js", import.meta.url);
const LEGACY_PROJECT_RUNTIME_PATHS = [
  "../client/public/imagicma-preview-feedback.js",
  "../client/src/lib/imagicma-preview-picker.ts",
  "../client/src/lib/imagicma-preview-repair.ts",
  "../client/src/lib/imagicma-preview-bridge.ts",
  "../client/src/lib/imagicma-preview-nav-reporter.ts",
];

async function resolvePreviewRuntimeBuildPath() {
  const candidates = [
    new URL("../../preview-runtime/build.mjs", import.meta.url),
    new URL("../../../preview-runtime/build.mjs", import.meta.url),
  ];

  for (const candidate of candidates) {
    try {
      await readFile(candidate, "utf8");
      return candidate;
    } catch (error) {
      if (error && typeof error === "object" && error.code === "ENOENT") {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Cannot find shared preview-runtime/build.mjs");
}

test("Vite preview feedback injection loads the configured runtime URL with CDN as default", async () => {
  const source = await readFile(VITE_CONFIG_PATH, "utf8");

  assert.match(source, /DEFAULT_PREVIEW_RUNTIME_CDN_BASE_URL/);
  assert.match(source, /process\.env\.IMAGICMA_PREVIEW_RUNTIME_URL\?\.trim\(\)/);
  assert.match(source, /readRuntimeEnvValue\("IMAGICMA_PREVIEW_RUNTIME_URL"\)/);
  assert.match(source, /resolvePreviewRuntimeUrl/);
  assert.match(source, /`\$\{DEFAULT_PREVIEW_RUNTIME_CDN_BASE_URL\}\/runtime\.js`/);
  assert.match(source, /src:\s*previewRuntimeUrl/);
  assert.match(source, /onerror:\s*"window\.__IMAGICMA_SHOW_PREVIEW_RUNTIME_LOAD_ERROR__/);
  assert.match(source, /runtime\.js/);
  assert.doesNotMatch(source, /const previewRuntime = import/);
  assert.doesNotMatch(source, /feedbackRuntimeUrl/);
  assert.doesNotMatch(source, /navigationRuntimeUrl/);
  assert.doesNotMatch(source, /pickerRuntimeUrl/);
  assert.doesNotMatch(source, /import\s+["']\/imagicma-preview-feedback\.js["']/);
  assert.doesNotMatch(source, /IMAGICMA_PREVIEW_RUNTIME_MODE/);
  assert.doesNotMatch(source, /IMAGICMA_PREVIEW_RUNTIME_BASE_URL/);
  assert.doesNotMatch(source, /__imagicma-preview-runtime/);
  assert.doesNotMatch(source, /LOCAL_PREVIEW_RUNTIME_BASE_URL/);
  assert.doesNotMatch(source, /resolvePreviewRuntimeBaseUrl/);
  assert.doesNotMatch(source, /joinPreviewRuntimeUrl/);
  assert.doesNotMatch(source, /imagicmaPreviewRuntimeLocalServerPlugin/);
  assert.doesNotMatch(source, /transformWithEsbuild/);
});

test("cartographer only injects JSX metadata and does not inject preview runtime scripts", async () => {
  const source = await readFile(CARTOGRAPHER_PLUGIN_PATH, "utf8");

  assert.match(source, /apply:\s*"serve"/);
  assert.doesNotMatch(source, /pickerRuntimeUrl/);
  assert.doesNotMatch(source, /IMAGICMA_PREVIEW_RUNTIME_BASE_URL/);
  assert.doesNotMatch(source, /transformIndexHtml\(\)/);
  assert.doesNotMatch(source, /readFile\(beaconClientFile/);
  assert.doesNotMatch(source, /transformWithEsbuild\(source/);
});

test("cartographer metadata attributes use the imagicma namespace in source and dist", async () => {
  const sources = [
    await readFile(CARTOGRAPHER_PLUGIN_PATH, "utf8"),
    await readFile(DIST_CARTOGRAPHER_PLUGIN_PATH, "utf8"),
  ];

  for (const source of sources) {
    assert.match(source, /data-imagicma-metadata/);
    assert.doesNotMatch(source, /data-replit-meta/);
  }
});

test("preview runtime build exposes one bundled JS entry", async () => {
  const source = await readFile(await resolvePreviewRuntimeBuildPath(), "utf8");

  assert.match(source, /runtime\.js/);
  assert.match(source, /sha256/);
  assert.match(source, /--release/);
  assert.doesNotMatch(source, /path\.join\(outDir,\s*"feedback\.js"/);
  assert.doesNotMatch(source, /path\.join\(outDir,\s*"picker\.js"/);
  assert.doesNotMatch(source, /path\.join\(outDir,\s*"navigation\.js"/);
});

test("legacy preview runtime files are not copied into the app source tree", async () => {
  for (const relativePath of LEGACY_PROJECT_RUNTIME_PATHS) {
    await assert.rejects(
      () => access(new URL(relativePath, import.meta.url)),
      { code: "ENOENT" },
      `${relativePath} should be served from preview-runtime/CDN instead`,
    );
  }
});
