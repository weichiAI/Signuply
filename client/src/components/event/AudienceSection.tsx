import { Briefcase, Code, TrendingUp, Lightbulb } from "lucide-react";
import type { ComponentType } from "react";
import type { EventSettings } from "@/hooks/use-event-settings";

const ICONS: Record<string, ComponentType<{ size?: number }>> = {
  "企业管理者": Briefcase,
  "技术开发者": Code,
  "投资人": TrendingUp,
  "产品经理": Lightbulb,
};

type AudienceSectionProps = {
  data: EventSettings["audience"];
  title?: string;
  subtitle?: string;
};

export function AudienceSection({ data, title = "适合人群", subtitle = "如果你属于以下任何一类" }: AudienceSectionProps) {
  return (
    <section id="audience" className="px-5 py-14 bg-[#F8FAFC]">
      <div className="mb-8 text-center">
        <h2 className="text-xl font-bold text-[#0B1121]">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className="flex flex-col gap-3">
        {data.map((a) => {
          const Icon = ICONS[a.label] || Briefcase;
          return (
            <div key={a.label} className="flex items-center gap-4 rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1121] to-[#1E3A5F] text-white">
                <Icon size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0B1121]">{a.label}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
