export const VITE_ERROR_ENDPOINT = "/__imagicma/vite-error/latest";

type ViteWsPayload = {
  type?: unknown;
  err?: unknown;
};

export function createViteErrorState() {
  let latestError: unknown = null;

  return {
    acceptWsPayload(payload: unknown) {
      if (!payload || typeof payload !== "object") return;

      const typed = payload as ViteWsPayload;
      if (typed.type === "error") {
        latestError = "err" in typed ? typed.err : typed;
        return;
      }

      if (typed.type === "update" || typed.type === "full-reload" || typed.type === "prune") {
        latestError = null;
      }
    },

    getLatestError() {
      return latestError;
    },
  };
}

export function toViteErrorJson(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({
      message: "Vite 编译失败",
    });
  }
}
