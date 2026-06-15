import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

async function resolvePreviewRuntimeScriptPath() {
  const candidates = [
    new URL("../../preview-runtime/src/feedback.js", import.meta.url),
    new URL("../../../preview-runtime/src/feedback.js", import.meta.url),
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

  throw new Error("Cannot find shared preview-runtime/src/feedback.js");
}

const SCRIPT_PATH = await resolvePreviewRuntimeScriptPath();
const INDEX_HTML_PATH = new URL("../client/index.html", import.meta.url);

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.style = {};
    this.attributes = {};
    this.listeners = {};
    this._textContent = "";
    this.id = "";
    this.type = "";
    this.disabled = false;
    this.value = "";
  }

  get textContent() {
    return this._textContent + this.children.map((child) => child.textContent).join("");
  }

  set textContent(value) {
    this._textContent = String(value);
    this.children = [];
  }

  get childElementCount() {
    return this.children.length;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name === "id") this.id = String(value);
  }

  getAttribute(name) {
    if (name === "id") return this.id || null;
    return Object.prototype.hasOwnProperty.call(this.attributes, name)
      ? this.attributes[name]
      : null;
  }

  querySelector(selector) {
    if (selector.startsWith("#")) {
      const id = selector.slice(1);
      return findElement(this, (element) => element.id === id);
    }
    const scriptSrcMatch = selector.match(/^script\[type="module"\]\[src\*="([^"]+)"\]$/);
    if (scriptSrcMatch) {
      const [, srcPart] = scriptSrcMatch;
      return findElement(this, (element) => (
        element.tagName.toLowerCase() === "script" &&
        element.getAttribute("type") === "module" &&
        (element.getAttribute("src") || "").includes(srcPart)
      ));
    }
    const attrMatch = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
    if (attrMatch) {
      const [, name, value] = attrMatch;
      return findElement(this, (element) => {
        const attr = element.getAttribute(name);
        if (attr === null) return false;
        return value === undefined || attr === value;
      });
    }
    return findElement(this, (element) => element.tagName.toLowerCase() === selector.toLowerCase());
  }

  querySelectorAll(selector) {
    const results = [];
    function visit(element) {
      if (element.tagName.toLowerCase() === selector.toLowerCase()) {
        results.push(element);
      }
      element.children.forEach(visit);
    }
    visit(this);
    return results;
  }

  get firstElementChild() {
    return this.children[0] || null;
  }

  get lastElementChild() {
    return this.children[this.children.length - 1] || null;
  }

  get innerHTML() {
    return this.children.map((child) => child.textContent).join("");
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    this.children = this.children.filter((item) => item !== child);
    child.parentNode = null;
    return child;
  }

  contains(target) {
    if (target === this) return true;
    return this.children.some((child) => child.contains(target));
  }

  addEventListener(type, listener) {
    this.listeners[type] ||= [];
    this.listeners[type].push(listener);
  }

  dispatchEvent(event) {
    for (const listener of this.listeners[event.type] || []) {
      listener.call(this, event);
    }
  }

  click() {
    this.dispatchEvent({ type: "click", target: this });
  }

  select() {
    this.selected = true;
  }
}

function findElement(root, predicate) {
  if (predicate(root)) return root;
  for (const child of root.children) {
    const found = findElement(child, predicate);
    if (found) return found;
  }
  return null;
}

function createDocument(options = {}) {
  const documentElement = new FakeElement("html");
  const body = new FakeElement("body");
  const root = new FakeElement("div");
  root.id = "root";
  if (options.bootstrapped !== false) {
    root.appendChild(new FakeElement("main"));
  }
  documentElement.appendChild(body);
  body.appendChild(root);
  if (options.entryScriptSrc) {
    const entryScript = new FakeElement("script");
    entryScript.setAttribute("type", "module");
    entryScript.setAttribute("src", options.entryScriptSrc);
    body.appendChild(entryScript);
  }

  return {
    body,
    documentElement,
    readyState: "complete",
    referrer: options.referrer ?? "http://localhost:3000/projects/182/session/test",
    createElement: (tagName) => new FakeElement(tagName),
    createElementNS: (_namespace, tagName) => new FakeElement(tagName),
    execCommand(command) {
      return command === "copy";
    },
    addEventListener() {},
    getElementById: (id) => findElement(documentElement, (element) => element.id === id),
    querySelector(selector) {
      if (selector === "vite-error-overlay") return null;
      if (selector.startsWith("#")) {
        const id = selector.slice(1);
        return findElement(documentElement, (element) => element.id === id);
      }
      const scriptSrcMatch = selector.match(/^script\[type="module"\]\[src\*="([^"]+)"\]$/);
      if (scriptSrcMatch) {
        const [, srcPart] = scriptSrcMatch;
        return findElement(documentElement, (element) => (
          element.tagName.toLowerCase() === "script" &&
          element.getAttribute("type") === "module" &&
          (element.getAttribute("src") || "").includes(srcPart)
        ));
      }
      const attrMatch = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
      if (attrMatch) {
        const [, name, value] = attrMatch;
        return findElement(documentElement, (element) => {
          const attr = element.getAttribute(name);
          if (attr === null) return false;
          return value === undefined || attr === value;
        });
      }
      return null;
    },
  };
}

function createEventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, listener) {
      const current = listeners.get(type) || [];
      current.push(listener);
      listeners.set(type, current);
    },
    removeEventListener(type, listener) {
      const current = listeners.get(type) || [];
      listeners.set(type, current.filter((item) => item !== listener));
    },
    dispatchEvent(event) {
      for (const listener of listeners.get(event.type) || []) {
        listener.call(this, event);
      }
    },
  };
}

function createResponse({ status, body, jsonError }) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 500 ? "Server Error" : "OK",
    url: "/api/test",
    clone() {
      return createResponse({ status, body, jsonError });
    },
    async text() {
      return body;
    },
    async json() {
      if (jsonError) throw jsonError;
      return JSON.parse(body);
    },
  };
}

function createViteErrorHtml({
  message = "Failed to resolve import './Missing'",
  stack = "Error: Failed to resolve import './Missing'\n    at /src/main.tsx:4:1",
  frame = "3 | import { App } from './App'\n4 | import Missing from './Missing'\n  |                      ^",
  plugin = "vite:import-analysis",
  id = "/src/main.tsx",
} = {}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <script type="module">
          const error = ${JSON.stringify({ message, stack, frame, plugin, id })}
          try {
            const { ErrorOverlay } = await import("/@vite/client")
            document.body.appendChild(new ErrorOverlay(error))
          } catch {}
        </script>
      </head>
      <body></body>
    </html>
  `;
}

async function loadFeedbackScript(options = {}) {
  const source = await readFile(SCRIPT_PATH, "utf8");
  const document = createDocument(options);
  const windowTarget = createEventTarget();
  const timers = [];
  const mutationObservers = [];
  const parentMessages = [];
  const parent = {
    postMessage(message, origin) {
      parentMessages.push({ message, origin });
    },
  };
  const consoleCalls = [];
  const consoleImpl = {
    error(...args) {
      consoleCalls.push({ level: "error", args });
    },
  };

  const window = {
    ...windowTarget,
    parent,
    location: { href: "http://127.0.0.1:3685/", origin: "http://127.0.0.1:3685" },
    crypto: { randomUUID: () => "repair-test-id" },
    setTimeout: (callback, delay) => {
      if (options.deferTimers) {
        timers.push({ callback, delay });
        return timers.length;
      }
      callback();
      return timers.length + 1;
    },
    clearTimeout() {},
    performance: { getEntriesByType: () => options.performanceEntries || [] },
    fetch: options.fetch || (async () => createResponse({ status: 200, body: "{}" })),
  };

  const context = vm.createContext({
    URL,
    console: consoleImpl,
    document,
    window,
    MutationObserver: class {
      constructor(callback) {
        this.callback = callback;
        mutationObservers.push(this);
      }
      observe() {}
    },
    setTimeout: window.setTimeout,
    clearTimeout: window.clearTimeout,
  });

  vm.runInContext(source, context, { filename: "imagicma-preview-feedback.js" });

  return { context, document, window, parentMessages, consoleCalls, timers, mutationObservers };
}

function runtimeBadge(document) {
  return document.querySelector('[data-imagicma-runtime-feedback-badge="true"]');
}

function runtimeCount(document) {
  return document.querySelector('[data-imagicma-runtime-feedback-count="true"]');
}

function runtimeActions(document) {
  return document.querySelector('[data-imagicma-runtime-feedback-actions="true"]');
}

function runtimeBody(document) {
  return document.querySelector('[data-imagicma-runtime-feedback-body="true"]');
}

function runtimeList(document) {
  return document.querySelector('[data-imagicma-runtime-feedback-list="true"]');
}

test("index html keeps the standard Vite app entry", async () => {
  const html = await readFile(INDEX_HTML_PATH, "utf8");

  assert.match(html, /<script\s+type="module"\s+src="\/src\/main\.tsx"><\/script>/);
  assert.doesNotMatch(html, /import\(["']\/src\/main\.tsx["']\)/);
  assert.doesNotMatch(html, /reportModuleBootstrapError/);
});

test("reports Vite HMR errors through the runtime badge", async () => {
  const { document, window, parentMessages, timers } = await loadFeedbackScript({ deferTimers: true });

  const reported = window.__IMAGICMA_PREVIEW_FEEDBACK__.reportViteError({
    message: "Failed to resolve import './Missing'",
    stack: "Error: Failed to resolve import './Missing'\n    at /src/main.tsx:4:1",
    frame: "3 | import { App } from './App'\n4 | import Missing from './Missing'\n  |                      ^",
    plugin: "vite:import-analysis",
    id: "/src/main.tsx",
  });

  assert.equal(reported, true);
  assert.equal(document.querySelector("#imagicma-preview-feedback-root"), null);
  assert.ok(runtimeBadge(document), "Vite errors should render the runtime badge");
  assert.equal(runtimeCount(document).textContent, "错误 1");

  runtimeBadge(document).click();
  const panel = document.querySelector('[data-imagicma-runtime-feedback-panel="true"]');
  assert.ok(panel, "runtime panel should be rendered after clicking the badge");
  const summary = document.querySelector('[data-imagicma-runtime-feedback-summary="true"]');
  assert.equal(summary.textContent, "1 个问题，出现 1 次");
  assert.match(panel.textContent, /编译/);
  assert.match(panel.textContent, /Failed to resolve import '.\/Missing'/);
  assert.match(panel.textContent, /\/src\/main\.tsx/);
  assert.match(panel.textContent, /Failed to resolve import/);
  assert.match(panel.textContent, /vite:import-analysis/);
  const stack = document.querySelector('[data-imagicma-runtime-feedback-stack="true"]');
  assert.equal(stack.style.display, "none");
  assert.equal(panel.textContent.includes("查看完整堆栈"), true);

  const repairButton = document.querySelector('[data-imagicma-runtime-feedback-repair="true"]');
  const copyButton = document.querySelector('[data-imagicma-runtime-feedback-copy="true"]');
  assert.ok(repairButton, "repair button should be addressable");
  assert.ok(copyButton, "copy details button should be addressable");
  assert.equal(copyButton.textContent, "复制错误信息");
  assert.equal(copyButton.querySelector("path")?.getAttribute("d")?.startsWith("M8 7"), true);

  parentMessages.length = 0;
  copyButton.click();
  await Promise.resolve();
  assert.equal(parentMessages.length, 0);
  assert.equal(copyButton.textContent, "复制错误信息");
  assert.equal(copyButton.querySelector("path")?.getAttribute("d"), "M20 6 9 17l-5-5");

  const resetTimer = timers.pop();
  assert.equal(resetTimer?.delay, 1500);
  resetTimer?.callback();
  assert.equal(copyButton.textContent, "复制错误信息");
  assert.equal(copyButton.querySelector("path")?.getAttribute("d")?.startsWith("M8 7"), true);

  repairButton.click();

  const repairMessage = parentMessages.at(-1)?.message;
  assert.equal(repairMessage?.channel, "imagicma.preview-repair");
  assert.equal(repairMessage?.type, "IMAGICMA_PREVIEW_REPAIR_REQUEST");
  assert.equal(repairMessage?.payload?.errorName, "PreviewRuntimeErrors");
  assert.match(repairMessage?.payload?.errorStack || "", /vite:import-analysis/);
  assert.match(repairMessage?.payload?.errorStack || "", /src\/main\.tsx/);
});

test("keeps runtime action button DOM stable during unrelated mutation observer checks", async () => {
  const { document, window, mutationObservers, timers } = await loadFeedbackScript({ deferTimers: true });

  window.__IMAGICMA_PREVIEW_FEEDBACK__.reportViteError({
    message: "Failed to resolve import './Missing'",
    stack: "Error: Failed to resolve import './Missing'\n    at /src/main.tsx:4:1",
    frame: "3 | import { App } from './App'\n4 | import Missing from './Missing'\n  |                      ^",
    plugin: "vite:import-analysis",
    id: "/src/main.tsx",
  });

  runtimeBadge(document).click();
  const repairButton = document.querySelector('[data-imagicma-runtime-feedback-repair="true"]');
  const copyButton = document.querySelector('[data-imagicma-runtime-feedback-copy="true"]');
  assert.ok(repairButton, "repair button should exist");
  assert.ok(copyButton, "copy button should exist");
  const repairIcon = repairButton.firstElementChild;
  const repairText = repairButton.lastElementChild;
  const copyIcon = copyButton.firstElementChild;
  const copyText = copyButton.lastElementChild;

  mutationObservers[0]?.callback([{ target: document.body }]);
  while (timers.length > 0) timers.shift()?.callback();

  assert.equal(repairButton.firstElementChild, repairIcon);
  assert.equal(repairButton.lastElementChild, repairText);
  assert.equal(copyButton.firstElementChild, copyIcon);
  assert.equal(copyButton.lastElementChild, copyText);
});

test("ignores unrelated parent messages without rebuilding runtime action buttons", async () => {
  const { document, window } = await loadFeedbackScript({ deferTimers: true });

  window.__IMAGICMA_PREVIEW_FEEDBACK__.reportViteError({
    message: "Failed to resolve import './Missing'",
    stack: "Error: Failed to resolve import './Missing'\n    at /src/main.tsx:4:1",
    frame: "3 | import { App } from './App'\n4 | import Missing from './Missing'\n  |                      ^",
    plugin: "vite:import-analysis",
    id: "/src/main.tsx",
  });

  window.dispatchEvent({
    type: "message",
    source: window.parent,
    origin: "http://localhost:3000",
    data: {
      channel: "imagicma.preview-repair",
      version: 1,
      type: "IMAGICMA_PREVIEW_REPAIR_HELLO",
      requestId: "hello_1",
    },
  });

  runtimeBadge(document).click();
  const repairButton = document.querySelector('[data-imagicma-runtime-feedback-repair="true"]');
  const copyButton = document.querySelector('[data-imagicma-runtime-feedback-copy="true"]');
  assert.ok(repairButton, "repair button should exist");
  assert.ok(copyButton, "copy button should exist");
  const repairIcon = repairButton.firstElementChild;
  const repairText = repairButton.lastElementChild;
  const copyIcon = copyButton.firstElementChild;
  const copyText = copyButton.lastElementChild;

  window.dispatchEvent({
    type: "message",
    source: window.parent,
    origin: "http://localhost:3000",
    data: {
      channel: "imagicma.preview-session",
      type: "IMAGICMA_PREVIEW_PING",
    },
  });

  assert.equal(repairButton.firstElementChild, repairIcon);
  assert.equal(repairButton.lastElementChild, repairText);
  assert.equal(copyButton.firstElementChild, copyIcon);
  assert.equal(copyButton.lastElementChild, copyText);
});

test("detects initial Vite module load failures from the dev server error endpoint", async () => {
  const fetchedUrls = [];
  const { document } = await loadFeedbackScript({
    performanceEntries: [{ name: "http://127.0.0.1:3685/src/main.tsx?t=123" }],
    fetch: async (url) => {
      fetchedUrls.push(String(url));
      assert.match(String(url), /\/__imagicma\/vite-error\/latest$/);
      return createResponse({
        status: 200,
        body: JSON.stringify({
          error: {
            message: 'Failed to resolve import "./__preview_compile_failure__.css"',
            stack: 'Error: Failed to resolve import "./__preview_compile_failure__.css"\n    at /src/main.tsx:9:7',
            frame: '8 | import "./theme.css";\n9 | import "./__preview_compile_failure__.css";\n  |        ^',
            plugin: "vite:import-analysis",
            id: "/src/main.tsx",
          },
        }),
      });
    },
  });

  for (let index = 0; index < 8; index += 1) {
    await Promise.resolve();
  }

  assert.equal(fetchedUrls.length, 1, "the runtime should query only the dev server error endpoint");
  assert.equal(fetchedUrls.some((url) => url.includes("/src/main.tsx")), false);
  assert.equal(document.querySelector("#imagicma-preview-feedback-root"), null);
  assert.ok(runtimeBadge(document), "initial Vite module failures should render the runtime badge");
  assert.equal(runtimeCount(document).textContent, "错误 1");

  runtimeBadge(document).click();
  const panel = document.querySelector('[data-imagicma-runtime-feedback-panel="true"]');
  assert.ok(panel, "runtime panel should be rendered after clicking the badge");
  const summary = document.querySelector('[data-imagicma-runtime-feedback-summary="true"]');
  assert.equal(summary.textContent, "1 个问题，出现 1 次");
  assert.match(panel.textContent, /编译/);
  assert.match(panel.textContent, /Failed to resolve import "\.\/__preview_compile_failure__\.css"/);
  assert.match(panel.textContent, /\/src\/main\.tsx/);
  assert.match(panel.textContent, /__preview_compile_failure__\.css/);
  assert.match(panel.textContent, /vite:import-analysis/);
  const stack = document.querySelector('[data-imagicma-runtime-feedback-stack="true"]');
  assert.equal(stack.style.display, "none");
});

test("does not refetch source modules while checking startup Vite errors", async () => {
  const fetchedUrls = [];
  const { document, timers } = await loadFeedbackScript({
    deferTimers: true,
    performanceEntries: [{ name: "http://127.0.0.1:3685/src/main.tsx?t=123" }],
    fetch: async (url) => {
      fetchedUrls.push(String(url));
      return createResponse({ status: 204, body: "" });
    },
  });

  while (timers.length > 0) {
    timers.shift()?.callback();
    await Promise.resolve();
  }
  for (let index = 0; index < 8; index += 1) {
    await Promise.resolve();
  }

  assert.equal(fetchedUrls.some((url) => url.includes("/src/main.tsx")), false);
  assert.equal(fetchedUrls.every((url) => url.endsWith("/__imagicma/vite-error/latest")), true);
  assert.equal(runtimeBadge(document), null);
});

test("reports React render errors through the runtime badge", async () => {
  const { document, window } = await loadFeedbackScript();

  const reported = window.__IMAGICMA_PREVIEW_FEEDBACK__.reportReactRenderError(
    new Error("react render failed"),
    "\n    at Dashboard (/src/App.tsx:12:3)\n    at App",
  );

  assert.equal(reported, true);
  assert.equal(document.querySelector("#imagicma-preview-feedback-root"), null);
  assert.ok(runtimeBadge(document), "React render errors should render the runtime badge");
  assert.equal(runtimeCount(document).textContent, "错误 1");

  runtimeBadge(document).click();
  const panel = document.querySelector('[data-imagicma-runtime-feedback-panel="true"]');
  assert.ok(panel, "runtime panel should be rendered after clicking the badge");
  assert.match(panel.textContent, /组件/);
  assert.match(panel.textContent, /react render failed/);
  assert.match(panel.textContent, /组件堆栈/);
  assert.match(panel.textContent, /at Dashboard/);
});

test("reports window errors through the runtime badge before the app bootstraps", async () => {
  const { document, window } = await loadFeedbackScript({ bootstrapped: false });

  window.dispatchEvent({
    type: "error",
    error: new ReferenceError("asdf is not defined"),
    message: "asdf is not defined",
  });

  assert.ok(runtimeBadge(document), "startup window errors should render the runtime badge");
  assert.equal(runtimeCount(document).textContent, "错误 1");
  assert.equal(document.querySelector("#imagicma-preview-feedback-root"), null);

  runtimeBadge(document).click();
  const panel = document.querySelector('[data-imagicma-runtime-feedback-panel="true"]');
  assert.ok(panel, "runtime panel should be rendered after clicking the badge");
  assert.match(panel.textContent, /启动/);
  assert.match(panel.textContent, /asdf is not defined/);
});

test("records uncaught runtime errors after the app has bootstrapped", async () => {
  const { document, window } = await loadFeedbackScript();

  window.dispatchEvent({
    type: "error",
    error: new Error("runtime test"),
    message: "runtime test",
  });

  assert.ok(runtimeBadge(document), "runtime badge should be rendered");
  assert.equal(runtimeCount(document).textContent, "错误 1");
  assert.equal(runtimeBadge(document).getAttribute("title"), "检测到 1 个影响运行的错误，点击查看详情");
  assert.match(runtimeBadge(document).style.animation || "", /imagicmaRuntimeBadgePulse .* infinite/);
  runtimeBadge(document).click();
  assert.equal(runtimeBadge(document).style.animation, "none");
  assert.equal(document.querySelector("#imagicma-preview-feedback-root"), null);
});

test("clears runtime errors when the preview runtime is asked to reset after a successful update", async () => {
  const { document, window } = await loadFeedbackScript();

  window.dispatchEvent({
    type: "error",
    error: new Error("runtime clears after update"),
    message: "runtime clears after update",
  });
  runtimeBadge(document).click();

  assert.ok(runtimeBadge(document), "runtime badge should exist before clearing");
  assert.ok(document.querySelector('[data-imagicma-runtime-feedback-panel="true"]'), "runtime panel should exist before clearing");

  window.__IMAGICMA_PREVIEW_FEEDBACK__.clearRuntimeErrors();

  assert.equal(runtimeBadge(document), null);
  assert.equal(document.querySelector('[data-imagicma-runtime-feedback-panel="true"]'), null);
});

test("starts runtime badge counting from one after the previous badge is cleared", async () => {
  const { document, window } = await loadFeedbackScript();

  window.dispatchEvent({
    type: "error",
    error: new Error("previous runtime failure"),
    message: "previous runtime failure",
  });
  assert.equal(runtimeCount(document).textContent, "错误 1");

  window.__IMAGICMA_PREVIEW_FEEDBACK__.clearRuntimeErrors();
  assert.equal(runtimeBadge(document), null);

  window.dispatchEvent({
    type: "error",
    error: new Error("fresh runtime failure"),
    message: "fresh runtime failure",
  });

  assert.ok(runtimeBadge(document), "fresh runtime error should render a new badge");
  assert.equal(runtimeCount(document).textContent, "错误 1");
  runtimeBadge(document).click();
  const panel = document.querySelector('[data-imagicma-runtime-feedback-panel="true"]');
  assert.ok(panel, "fresh runtime panel should render");
  assert.match(panel.textContent, /fresh runtime failure/);
  assert.equal(panel.textContent.includes("previous runtime failure"), false);
});

test("keeps the runtime badge visible after the user hides the panel", async () => {
  const { document, window } = await loadFeedbackScript();

  window.dispatchEvent({
    type: "error",
    error: new Error("hidden panel failure"),
    message: "hidden panel failure",
  });
  assert.equal(runtimeCount(document).textContent, "错误 1");
  runtimeBadge(document).click();

  const firstPanel = document.querySelector('[data-imagicma-runtime-feedback-panel="true"]');
  const hideButton = firstPanel?.querySelector("button");
  assert.ok(hideButton, "hide button should be rendered");
  hideButton.click();
  assert.equal(document.querySelector('[data-imagicma-runtime-feedback-panel="true"]'), null);
  assert.ok(runtimeBadge(document), "runtime badge should stay visible after hiding the panel");
  assert.equal(runtimeCount(document).textContent, "错误 1");
  runtimeBadge(document).click();
  const panel = document.querySelector('[data-imagicma-runtime-feedback-panel="true"]');
  assert.ok(panel, "panel should render again from the still-visible badge");
  assert.match(panel.textContent, /hidden panel failure/);
});

test("clears runtime state when the runtime badge disappears from the page", async () => {
  const { document, window } = await loadFeedbackScript();

  window.dispatchEvent({
    type: "error",
    error: new Error("detached badge old failure"),
    message: "detached badge old failure",
  });
  assert.equal(runtimeCount(document).textContent, "错误 1");
  const oldBadge = runtimeBadge(document);
  assert.ok(oldBadge, "old badge should exist");
  oldBadge.parentNode?.removeChild(oldBadge);
  assert.equal(runtimeBadge(document), null);

  window.dispatchEvent({
    type: "error",
    error: new Error("detached badge fresh failure"),
    message: "detached badge fresh failure",
  });

  assert.ok(runtimeBadge(document), "fresh badge should be recreated");
  assert.equal(runtimeCount(document).textContent, "错误 1");
  runtimeBadge(document).click();
  const panel = document.querySelector('[data-imagicma-runtime-feedback-panel="true"]');
  assert.ok(panel, "fresh panel should render");
  assert.match(panel.textContent, /detached badge fresh failure/);
  assert.equal(panel.textContent.includes("detached badge old failure"), false);
});

test("deduplicates repeated runtime errors while increasing their count", async () => {
  const { document, window } = await loadFeedbackScript();

  const runtimeError = new Error("same runtime failure");
  window.dispatchEvent({
    type: "error",
    error: runtimeError,
    message: "same runtime failure",
  });
  window.dispatchEvent({
    type: "error",
    error: runtimeError,
    message: "same runtime failure",
  });

  assert.ok(runtimeBadge(document), "runtime badge should be rendered");
  assert.equal(runtimeCount(document).textContent, "错误 1");

  runtimeBadge(document).click();
  const panel = document.querySelector('[data-imagicma-runtime-feedback-panel="true"]');
  assert.ok(panel, "runtime panel should be rendered");
  const summary = document.querySelector('[data-imagicma-runtime-feedback-summary="true"]');
  assert.equal(summary.textContent, "1 个问题，出现 2 次");
  assert.equal(panel.querySelectorAll("article").length, 1);
  assert.match(panel.textContent, /x2/);
});

test("records fetch 500 failures without replacing the response object", async () => {
  const response500 = createResponse({ status: 500, body: '{"message":"server exploded"}' });
  const { document, window } = await loadFeedbackScript({
    fetch: async () => response500,
  });

  const response = await window.fetch("/api/dashboard");

  assert.equal(response, response500);
  assert.ok(runtimeBadge(document), "runtime badge should be rendered for 500 API failures");
  assert.equal(runtimeCount(document).textContent, "错误 1");
});

test("promotes structured server 500 responses into repair payload stack details", async () => {
  const serverErrorBody = JSON.stringify({
    message: "服务端执行失败",
    imagicmaServerError: {
      name: "TypeError",
      message: "Cannot read properties of undefined",
      stack: "TypeError: Cannot read properties of undefined\n    at getDashboard (/server/controllers/hotel.controller.ts:42:7)",
      method: "GET",
      path: "/api/hotel/dashboard/summary",
      timestamp: 1711111111111,
    },
  });
  const response500 = createResponse({ status: 500, body: serverErrorBody });
  const { document, window, parentMessages } = await loadFeedbackScript({
    fetch: async () => response500,
    deferTimers: true,
  });

  await window.fetch("/api/hotel/dashboard/summary");
  await Promise.resolve();
  await Promise.resolve();

  runtimeBadge(document).click();
  const panel = document.querySelector('[data-imagicma-runtime-feedback-panel="true"]');
  assert.ok(panel, "runtime panel should be rendered");
  assert.match(panel.textContent, /服务端/);
  assert.match(panel.textContent, /Cannot read properties of undefined/);
  assert.match(panel.textContent, /hotel\.controller\.ts:42:7/);

  const repairButton = document.querySelector('[data-imagicma-runtime-feedback-repair="true"]');
  repairButton.click();

  const repairMessage = parentMessages.at(-1)?.message;
  assert.equal(repairMessage?.payload?.errorName, "PreviewRuntimeErrors");
  assert.match(repairMessage?.payload?.errorStack || "", /服务端错误/);
  assert.match(repairMessage?.payload?.errorStack || "", /hotel\.controller\.ts:42:7/);
});

test("does not record ordinary 4xx API responses", async () => {
  const response404 = createResponse({ status: 404, body: '{"message":"not found"}' });
  const { document, window } = await loadFeedbackScript({
    fetch: async () => response404,
  });

  const response = await window.fetch("/api/missing");

  assert.equal(response, response404);
  assert.equal(runtimeBadge(document), null);
});

test("records response JSON parse failures when app code consumes a bad response", async () => {
  const parseError = new SyntaxError("Unexpected token < in JSON");
  const { document, window } = await loadFeedbackScript({
    fetch: async () => createResponse({ status: 200, body: "<html>", jsonError: parseError }),
  });

  const response = await window.fetch("/api/dashboard");
  await assert.rejects(() => response.json(), /Unexpected token/);

  assert.ok(runtimeBadge(document), "runtime badge should be rendered for JSON parse failures");
  assert.equal(runtimeCount(document).textContent, "错误 1");
});

test("sends aggregated runtime errors through the existing preview repair protocol", async () => {
  const { document, window, parentMessages, timers } = await loadFeedbackScript({ deferTimers: true });

  window.dispatchEvent({
    type: "error",
    error: new Error("runtime repair test"),
    message: "runtime repair test",
  });

  runtimeBadge(document).click();
  const repairButton = document.querySelector('[data-imagicma-runtime-feedback-repair="true"]');
  const copyButton = document.querySelector('[data-imagicma-runtime-feedback-copy="true"]');
  const panel = document.querySelector('[data-imagicma-runtime-feedback-panel="true"]');
  assert.ok(repairButton, "repair button should be rendered");
  assert.ok(copyButton, "copy button should be rendered");
  assert.ok(panel, "runtime panel should be rendered");
  assert.equal(panel.style.display, "flex");
  assert.equal(panel.style.flexDirection, "column");
  assert.equal(runtimeBody(document)?.style.overflow, "auto");
  assert.equal(runtimeBody(document)?.style.flex, "1 1 auto");
  assert.equal(runtimeBody(document)?.children.length, 1);
  assert.equal(runtimeList(document)?.style.padding, "0 0 4px");
  assert.equal(runtimeActions(document)?.style.flex, "0 0 auto");
  assert.equal(runtimeActions(document)?.style.position, undefined);
  assert.equal(panel.textContent.includes("隐藏"), true);
  const hideButton = [...panel.children[0].children].find((child) => child.textContent === "隐藏");
  assert.equal(hideButton?.style.whiteSpace, "nowrap");
  assert.equal(panel.textContent.includes("复制错误信息"), true);
  assert.equal(panel.textContent.includes("修正错误"), true);
  assert.equal(
    panel.textContent.indexOf("修正错误") < panel.textContent.indexOf("复制错误信息"),
    true,
    "repair action should be shown before copy details",
  );
  assert.equal(copyButton.childElementCount > 0, true);
  assert.equal(copyButton.querySelector("path")?.getAttribute("d")?.startsWith("M8 7"), true);
  assert.equal(repairButton.style.background, "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)");
  assert.equal(repairButton.childElementCount > 0, true);
  assert.equal(panel.textContent.includes("清空"), false);

  parentMessages.length = 0;
  copyButton.click();
  await Promise.resolve();
  assert.equal(copyButton.textContent, "复制错误信息");
  assert.equal(copyButton.querySelector("path")?.getAttribute("d"), "M20 6 9 17l-5-5");
  assert.equal(parentMessages.length, 0);

  const resetTimer = timers.pop();
  assert.equal(resetTimer?.delay, 1500);
  resetTimer?.callback();
  assert.equal(copyButton.textContent, "复制错误信息");
  assert.equal(copyButton.querySelector("path")?.getAttribute("d")?.startsWith("M8 7"), true);

  repairButton.click();

  const repairMessage = parentMessages.at(-1)?.message;
  assert.equal(repairMessage?.channel, "imagicma.preview-repair");
  assert.equal(repairMessage?.type, "IMAGICMA_PREVIEW_REPAIR_REQUEST");
  assert.equal(repairMessage?.payload?.errorName, "PreviewRuntimeErrors");
  assert.match(repairMessage?.payload?.errorStack || "", /runtime repair test/);
});

test("enables repair inside iframe after parent hello when referrer is unavailable", async () => {
  const { document, window, parentMessages } = await loadFeedbackScript({
    referrer: "",
    deferTimers: true,
  });

  window.dispatchEvent({
    type: "error",
    error: new Error("iframe repair handshake test"),
    message: "iframe repair handshake test",
  });

  runtimeBadge(document).click();
  const repairButton = document.querySelector('[data-imagicma-runtime-feedback-repair="true"]');
  const copyButton = document.querySelector('[data-imagicma-runtime-feedback-copy="true"]');
  assert.ok(repairButton, "repair button should be rendered before handshake");
  assert.ok(copyButton, "copy button should be rendered before handshake");
  assert.equal(repairButton.style.display, "none");
  assert.equal(copyButton.style.display, "inline-flex");
  assert.equal(copyButton.textContent, "复制错误信息");
  assert.equal(copyButton.querySelector("path")?.getAttribute("d")?.startsWith("M8 7"), true);

  window.dispatchEvent({
    type: "message",
    source: window.parent,
    origin: "https://dev.imagicma.cn",
    data: {
      channel: "imagicma.preview-repair",
      version: 1,
      type: "IMAGICMA_PREVIEW_REPAIR_HELLO",
      requestId: "hello_1",
    },
  });

  assert.equal(repairButton.textContent, "修正错误");
  assert.equal(repairButton.style.display, "inline-flex");
  assert.equal(copyButton.style.display, "inline-flex");

  repairButton.click();
  const repairMessage = parentMessages.at(-1)?.message;
  assert.equal(repairMessage?.type, "IMAGICMA_PREVIEW_REPAIR_REQUEST");
  assert.match(repairMessage?.payload?.errorStack || "", /iframe repair handshake test/);
});

test("announces repair readiness repeatedly so parent listeners can attach late", async () => {
  const { window, parentMessages, timers } = await loadFeedbackScript({
    referrer: "",
    deferTimers: true,
  });

  assert.equal(parentMessages[0]?.message?.type, "IMAGICMA_PREVIEW_REPAIR_READY");
  assert.equal(parentMessages[0]?.origin, "*");

  timers.shift()?.callback();
  assert.equal(parentMessages[1]?.message?.type, "IMAGICMA_PREVIEW_REPAIR_READY");

  window.dispatchEvent({
    type: "message",
    source: window.parent,
    origin: "https://workbench.agentma.cn",
    data: {
      channel: "imagicma.preview-repair",
      version: 1,
      type: "IMAGICMA_PREVIEW_REPAIR_HELLO",
      requestId: "hello_late",
    },
  });

  const countAfterHello = parentMessages.length;
  timers.shift()?.callback();
  assert.equal(parentMessages.length, countAfterHello, "ready retry should stop after parent hello");
});

test("uses the dedicated copy action outside the main preview shell", async () => {
  const { document, window, parentMessages, timers } = await loadFeedbackScript({ deferTimers: true });

  window.parent = window;
  parentMessages.length = 0;
  window.dispatchEvent({
    type: "error",
    error: new Error("runtime copy test"),
    message: "runtime copy test",
  });

  runtimeBadge(document).click();
  const repairButton = document.querySelector('[data-imagicma-runtime-feedback-repair="true"]');
  const copyButton = document.querySelector('[data-imagicma-runtime-feedback-copy="true"]');
  const panel = document.querySelector('[data-imagicma-runtime-feedback-panel="true"]');
  assert.ok(repairButton, "repair button should be rendered");
  assert.ok(copyButton, "copy button should be rendered");
  assert.ok(panel, "runtime panel should be rendered");
  assert.equal(repairButton.style.display, "none");
  assert.equal(copyButton.style.display, "inline-flex");
  assert.equal(copyButton.textContent, "复制错误信息");
  assert.equal(copyButton.querySelector("path")?.getAttribute("d")?.startsWith("M8 7"), true);
  assert.equal(copyButton.style.background, "#fff");
  assert.equal(copyButton.style.color, "#172033");
  assert.equal(panel.textContent.includes("仅主界面可修复"), false);

  copyButton.click();
  await Promise.resolve();

  assert.equal(parentMessages.length, 0);
  assert.equal(panel.textContent.includes("错误详情已复制"), false);
  assert.equal(copyButton.textContent, "复制错误信息");
  assert.equal(copyButton.querySelector("path")?.getAttribute("d"), "M20 6 9 17l-5-5");
  assert.equal(copyButton.style.color, "#16a34a");

  timers.pop()?.callback();
  assert.equal(copyButton.textContent, "复制错误信息");
  assert.equal(copyButton.querySelector("path")?.getAttribute("d")?.startsWith("M8 7"), true);
});

test("renders runtime stack details in the expanded feedback panel", async () => {
  const { document, window } = await loadFeedbackScript();

  window.dispatchEvent({
    type: "error",
    error: {
      name: "Error",
      message: "runtime stack test",
      stack: "Error: runtime stack test\n    at Home (/client/src/pages/home.tsx:12:3)",
    },
    message: "runtime stack test",
  });

  runtimeBadge(document).click();

  const panel = document.querySelector('[data-imagicma-runtime-feedback-panel="true"]');
  assert.ok(panel, "runtime panel should be rendered");
  assert.match(panel.textContent, /runtime stack test/);
  assert.match(panel.textContent, /at Home/);
  assert.match(panel.textContent, /client\/src\/pages\/home\.tsx:12:3/);
});

test("records important console errors with stack details", async () => {
  const { context, document, consoleCalls } = await loadFeedbackScript();

  context.console.error(new Error("console stack test"));

  runtimeBadge(document).click();

  const panel = document.querySelector('[data-imagicma-runtime-feedback-panel="true"]');
  assert.ok(panel, "runtime panel should be rendered");
  assert.equal(consoleCalls.length, 1, "original console.error should still be called");
  assert.match(panel.textContent, /console stack test/);
  assert.match(panel.textContent, /Error: console stack test/);
});

test("does not treat Vite console output as a compile error source", async () => {
  const { context, document, consoleCalls } = await loadFeedbackScript();

  context.console.error("[vite] Internal Server Error\nFailed to resolve import './Broken'");

  assert.equal(document.querySelector("#imagicma-preview-feedback-root"), null);
  assert.equal(runtimeBadge(document), null);
  assert.equal(consoleCalls.length, 1, "original console.error should still be called");
});
