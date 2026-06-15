import type { EventSettings } from "@/hooks/use-event-settings";

type TimelineSectionProps = {
  data: EventSettings["timeline"];
  title?: string;
  subtitle?: string;
};

export function TimelineSection({ data, title = "详细议程", subtitle = "2026 年 7 月 18 日" }: TimelineSectionProps) {
  const highlightIndex = 2;

  return (
    <section id="timeline" className="px-5 py-14 bg-white">
      <div className="mb-8 text-center">
        <h2 className="text-xl font-bold text-[#0B1121]">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className="relative pl-8">
        <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-gray-200" />
        <div className="flex flex-col gap-6">
          {data.map((item, i) => (
            <div key={i} className="relative">
              <div className={`absolute -left-8 top-1 w-[22px] h-[22px] rounded-full border-[3px] bg-white flex items-center justify-center ${
                i === highlightIndex ? "border-orange-500 bg-orange-50" : "border-gray-300"
              }`}>
                {i === highlightIndex && <div className="w-2 h-2 rounded-full bg-orange-500" />}
              </div>
              <span className="text-xs font-bold text-orange-500">{item.time}</span>
              <h3 className="mt-1 text-sm font-bold text-[#0B1121]">{item.title}</h3>
              <p className="mt-0.5 text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
