import React from "react";

type AppErrorBoundaryState = {
  error: Error | null;
  componentStack: string;
  copyStatus: "idle" | "copied" | "failed";
  delegatedToPreviewFeedback: boolean;
};

declare global {
  interface Window {
    __IMAGICMA_PREVIEW_FEEDBACK__?: {
      reportReactRenderError?: (error: Error, componentStack?: string) => boolean;
    };
  }
}

function canDelegateToPreviewFeedback() {
  return typeof window !== "undefined"
    && typeof window.__IMAGICMA_PREVIEW_FEEDBACK__?.reportReactRenderError === "function";
}

export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  AppErrorBoundaryState
> {
  private readonly hotUpdateHandler = () => {
    window.__IMAGICMA_RUNTIME_ERROR_ACTIVE__ = false;
    this.setState((currentState) => (
      currentState.error
        ? {
            ...currentState,
            error: null,
            componentStack: "",
            copyStatus: "idle",
            delegatedToPreviewFeedback: false,
          }
        : currentState
    ));
  };

  state: AppErrorBoundaryState = {
    error: null,
    componentStack: "",
    copyStatus: "idle",
    delegatedToPreviewFeedback: false,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      error,
      componentStack: "",
      copyStatus: "idle",
      delegatedToPreviewFeedback: canDelegateToPreviewFeedback(),
    };
  }

  componentDidMount() {
    import.meta.hot?.on("vite:afterUpdate", this.hotUpdateHandler);
  }

  componentWillUnmount() {
    import.meta.hot?.off("vite:afterUpdate", this.hotUpdateHandler);
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const componentStack = info.componentStack || "";
    const delegated = window.__IMAGICMA_PREVIEW_FEEDBACK__?.reportReactRenderError?.(
      error,
      componentStack,
    ) === true;
    if (!delegated) {
      console.error(error);
    }
    window.__IMAGICMA_RUNTIME_ERROR_ACTIVE__ = true;
    this.setState({
      componentStack,
      copyStatus: "idle",
      delegatedToPreviewFeedback: delegated,
    });
  }

  private buildErrorDetails() {
    const { error, componentStack } = this.state;
    if (!error) return "";

    return [
      `页面: ${window.location.href}`,
      `错误: ${error.name || "Error"}`,
      `信息: ${error.message || "发生未知错误"}`,
      error.stack ? `堆栈:\n${error.stack}` : "",
      componentStack ? `组件堆栈:\n${componentStack}` : "",
    ].filter(Boolean).join("\n\n");
  }

  private handleCopyDetails = async () => {
    try {
      const details = this.buildErrorDetails();
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(details);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = details;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }

      this.setState({ copyStatus: "copied" });
      window.setTimeout(() => this.setState({ copyStatus: "idle" }), 1600);
    } catch (error) {
      console.error(error);
      this.setState({ copyStatus: "failed" });
    }
  };

  render() {
    const { error, copyStatus, delegatedToPreviewFeedback } = this.state;
    if (!error) {
      window.__IMAGICMA_RUNTIME_ERROR_ACTIVE__ = false;
      return this.props.children;
    }

    if (delegatedToPreviewFeedback) {
      return <div className="min-h-screen" aria-hidden="true" />;
    }

    const errorDetails = [error.name?.trim(), error.message?.trim(), error.stack?.trim()]
      .filter(Boolean)
      .join("\n\n");
    return (
      <div
        className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-sky-600 px-6 py-16 text-white"
        role="alert"
      >
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_40%,rgba(255,255,255,0.20),transparent_60%)]" />
        <main className="relative w-full max-w-xl rounded-3xl border border-white/15 bg-white/10 p-10 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-semibold tracking-tight">预览暂时不可用</h1>
            <p className="mt-4 max-w-md text-base leading-7 text-white/80">
              检测到错误。预览反馈 runtime 未能接管时，可以先复制错误详情或刷新页面。
            </p>

            {errorDetails ? (
              <pre className="mt-6 w-full max-h-80 overflow-auto rounded-2xl border border-white/10 bg-black/25 p-4 text-left text-sm leading-6 text-white/85 shadow-inner">
                <code>{errorDetails}</code>
              </pre>
            ) : null}

            {copyStatus === "failed" ? (
              <p className="mt-4 max-w-md text-sm leading-6 text-white/80">复制失败，请手动选择错误详情。</p>
            ) : null}

            <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-white px-5 text-sm font-medium text-black transition-colors hover:bg-white/90 sm:w-auto"
                onClick={this.handleCopyDetails}
              >
                {copyStatus === "copied" ? "已复制" : "复制详情"}
              </button>
              <button
                type="button"
                className="inline-flex h-11 w-full items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 text-sm font-medium text-white transition-colors hover:bg-white/15 sm:w-auto"
                onClick={() => window.location.reload()}
              >
                刷新页面
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }
}
