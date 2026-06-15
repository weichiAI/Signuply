import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("clears cached Vite compile errors after a successful update payload", () => {
  const tempDir = mkdtempSync(path.join(tmpdir(), "imagicma-vite-error-state-"));
  const output = path.join(tempDir, "vite-error-state.js");
  const result = spawnSync(
    "pnpm",
    [
      "exec",
      "tsc",
      "server/vite-error-state.ts",
      "--target",
      "ES2020",
      "--module",
      "CommonJS",
      "--moduleResolution",
      "Node",
      "--esModuleInterop",
      "--skipLibCheck",
      "--outDir",
      tempDir,
    ],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const module = readFileSync(output, "utf8");
  const runner = path.join(tempDir, "runner.cjs");
  writeFileSync(
    runner,
    [
      module,
      "const state = createViteErrorState();",
      "state.acceptWsPayload({ type: 'error', err: { message: 'broken', plugin: 'vite:import-analysis' } });",
      "if (!state.getLatestError()) throw new Error('expected cached error');",
      "state.acceptWsPayload({ type: 'update', updates: [] });",
      "if (state.getLatestError() !== null) throw new Error('expected update to clear cached error');",
      "state.acceptWsPayload({ type: 'error', err: { message: 'broken again' } });",
      "state.acceptWsPayload({ type: 'full-reload', path: '/' });",
      "if (state.getLatestError() !== null) throw new Error('expected full reload to clear cached error');",
    ].join("\n"),
  );

  const run = spawnSync(process.execPath, [runner], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr || run.stdout);
});
