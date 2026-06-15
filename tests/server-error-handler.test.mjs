import assert from "node:assert/strict";
import test from "node:test";
import { Hono } from "hono";
import { registerErrorHandler } from "../server/middlewares/error-handler.ts";

function createFailingApp() {
  const app = new Hono();
  registerErrorHandler(app);
  app.get("/api/fail", () => {
    throw new TypeError("server route failed");
  });
  return app;
}

async function withConsoleErrorSilenced(callback) {
  const originalError = console.error;
  console.error = () => {};
  try {
    return await callback();
  } finally {
    console.error = originalError;
  }
}

test("dev preview server errors include structured stack details", async () => {
  const previousLaunchMode = process.env.IMAGICMA_LAUNCH_MODE;
  process.env.IMAGICMA_LAUNCH_MODE = "dev";
  const app = createFailingApp();

  try {
    const response = await withConsoleErrorSilenced(() => app.request("http://localhost/api/fail"));
    const body = await response.json();

    assert.equal(response.status, 500);
    assert.equal(body.message, "server route failed");
    assert.equal(body.imagicmaServerError.name, "TypeError");
    assert.equal(body.imagicmaServerError.message, "server route failed");
    assert.equal(body.imagicmaServerError.method, "GET");
    assert.equal(body.imagicmaServerError.path, "/api/fail");
    assert.match(body.imagicmaServerError.stack, /server route failed/);
  } finally {
    if (previousLaunchMode === undefined) {
      delete process.env.IMAGICMA_LAUNCH_MODE;
    } else {
      process.env.IMAGICMA_LAUNCH_MODE = previousLaunchMode;
    }
  }
});

test("start mode server errors keep production-safe generic payload", async () => {
  const previousLaunchMode = process.env.IMAGICMA_LAUNCH_MODE;
  process.env.IMAGICMA_LAUNCH_MODE = "start";
  const app = createFailingApp();

  try {
    const response = await withConsoleErrorSilenced(() => app.request("http://localhost/api/fail"));
    const body = await response.json();

    assert.equal(response.status, 500);
    assert.equal(body.message, "Internal Server Error");
    assert.equal(body.imagicmaServerError, undefined);
  } finally {
    if (previousLaunchMode === undefined) {
      delete process.env.IMAGICMA_LAUNCH_MODE;
    } else {
      process.env.IMAGICMA_LAUNCH_MODE = previousLaunchMode;
    }
  }
});
