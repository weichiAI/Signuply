import type { EventSettings } from "@/hooks/use-event-settings";

type PartnersSectionProps = {
  data: EventSettings["partners"];
  title?: string;
  subtitle?: string;
};

export function PartnersSection({ data, title = "合作伙伴", subtitle = "感谢以下品牌的支持" }: PartnersSectionProps) {
  return (
    <section id="partners" className="px-5 py-14 bg-[#F8FAFC]">
      <div className="mb-8 text-center">
        <h2 className="text-xl font-bold text-[#0B1121]">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {data.map((p) => (
          <div key={p} className="flex items-center justify-center rounded-xl bg-white border border-gray-100 h-16 px-3">
            <span className="text-xs font-semibold text-gray-400">{p}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
