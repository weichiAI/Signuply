import type { EventSettings } from "@/hooks/use-event-settings";

const COLORS = ["from-blue-500 to-cyan-500", "from-purple-500 to-pink-500", "from-orange-500 to-red-500", "from-green-500 to-teal-500"];

type GuestsSectionProps = {
  data: EventSettings["guests"];
  title?: string;
  subtitle?: string;
};

export function GuestsSection({ data, title = "嘉宾阵容", subtitle = "行业顶尖人物齐聚" }: GuestsSectionProps) {
  return (
    <section id="guests" className="py-14 bg-[#F8FAFC]">
      <div className="mb-8 text-center px-5">
        <h2 className="text-xl font-bold text-[#0B1121]">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-5 pb-4 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
        {data.map((g, i) => (
          <div key={g.name} className="flex-shrink-0 w-[220px] snap-center rounded-2xl bg-white shadow-sm border border-gray-100 p-5 flex flex-col items-center text-center gap-3">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${COLORS[i % COLORS.length]} flex items-center justify-center text-white text-2xl font-bold`}>
              {g.name[0]}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0B1121]">{g.name}</h3>
              <p className="text-xs font-medium text-orange-500 mt-0.5">{g.title}</p>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{g.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
