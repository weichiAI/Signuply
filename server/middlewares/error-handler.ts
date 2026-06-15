import type { Hono } from "hono";

const MAX_ERROR_TEXT_LENGTH = 12_000;

function isDevPreviewMode() {
  const launchMode = process.env.IMAGICMA_LAUNCH_MODE;
  return launchMode === "dev" || (launchMode !== "start" && process.env.NODE_ENV !== "production");
}

function truncateText(value: string) {
  if (value.length <= MAX_ERROR_TEXT_LENGTH) return value;
  return `${value.slice(0, MAX_ERROR_TEXT_LENGTH)}\n...`;
}

function describeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name || "Error",
      message: error.message || "Internal Server Error",
      stack: error.stack ? truncateText(error.stack) : undefined,
    };
  }

  const message = String(error || "Internal Server Error");
  return {
    name: "Error",
    message,
    stack: undefined,
  };
}

export function registerErrorHandler(app: Hono) {
  app.onError((error, c) => {
    console.error("Unhandled request error:", error);

    if (!isDevPreviewMode()) {
      return c.json({ message: "Internal Server Error" }, 500);
    }

    const details = describeError(error);
    const requestUrl = new URL(c.req.url);

    return c.json({
      message: details.message,
      imagicmaServerError: {
        name: details.name,
        message: details.message,
        stack: details.stack,
        method: c.req.method,
        path: requestUrl.pathname,
        url: c.req.url,
        timestamp: Date.now(),
      },
    }, 500);
  });
}
