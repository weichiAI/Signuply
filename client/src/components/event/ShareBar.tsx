import { Share2 } from "lucide-react";

export function ShareBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3 bg-white/90 backdrop-blur-lg border-t border-gray-100">
      <div className="flex items-center justify-center max-w-[430px] mx-auto">
        <button
          className="flex items-center gap-2 text-xs font-semibold text-gray-600 min-h-[44px] px-5 rounded-xl border border-gray-200 bg-gray-50 active:bg-gray-100"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: "智界 · 2026 科技新品发布会",
                text: "邀你参加智界 · 2026 科技新品发布会，AI 定义下一个十年！",
                url: window.location.href,
              }).catch(() => {});
            }
          }}
        >
          <Share2 size={16} />
          分享给朋友
        </button>
      </div>
    </div>
  );
}
