import { MapPin, Navigation, ArrowRight } from "lucide-react";
import type { EventSettings } from "@/hooks/use-event-settings";

type VenueSectionProps = {
  data: Pick<EventSettings, "location" | "address"> & { trafficInfo?: string; mapLink?: string };
  title?: string;
  subtitle?: string;
};

export function VenueSection({ data, title = "场地信息", subtitle = "城市地标，科技与未来的交汇点" }: VenueSectionProps) {
  return (
    <section id="venue" className="px-5 py-14 bg-white">
      <div className="mb-8 text-center">
        <h2 className="text-xl font-bold text-[#0B1121]">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-[#F1F5F9] overflow-hidden">
        <div className="h-40 bg-gradient-to-br from-[#1E3A5F] to-[#0B1121] flex items-center justify-center">
          <MapPin size={40} className="text-orange-400/60" />
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-[#0B1121]">{data.location}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{data.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Navigation size={18} className="text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-[#0B1121]">交通指引</h3>
              <p className="text-xs text-gray-500 mt-0.5">{data.trafficInfo || "暂无交通指引信息"}</p>
            </div>
          </div>
          <a href={data.mapLink || "#"} target={data.mapLink ? "_blank" : undefined} rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-orange-500 mt-2">
            查看地图导航 <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </section>
  );
}
