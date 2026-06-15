import { Sparkles, Users, Monitor, Gift } from "lucide-react";
import type { ReactNode } from "react";
import type { EventSettings } from "@/hooks/use-event-settings";

const ICONS: Record<string, ReactNode> = {
  "新品首发": <Sparkles size={24} />,
  "大咖对话": <Users size={24} />,
  "沉浸体验": <Monitor size={24} />,
  "限量伴手礼": <Gift size={24} />,
};

type HighlightsSectionProps = {
  data: EventSettings["highlights"];
  title?: string;
  subtitle?: string;
};

export function HighlightsSection({ data, title = "活动亮点", subtitle = "不可错过的四大理由" }: HighlightsSectionProps) {
  return (
    <section id="highlights" className="px-5 py-14 bg-white">
      <div className="mb-8 text-center">
        <h2 className="text-xl font-bold text-[#0B1121]">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {data.map((h) => (
          <div key={h.title} className="flex flex-col items-center gap-3 rounded-2xl bg-[#F1F5F9] p-5 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1121] to-[#1E3A5F] text-white">
              {ICONS[h.title] || <Sparkles size={24} />}
            </div>
            <h3 className="text-sm font-bold text-[#0B1121]">{h.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{h.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
