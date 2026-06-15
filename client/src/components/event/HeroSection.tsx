import { Calendar, MapPin, Clock } from "lucide-react";
import { Countdown } from "./Countdown";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
import type { EventSettings } from "@/hooks/use-event-settings";

const TARGET_DATE = new Date("2026-07-18T09:00:00+08:00");

type HeroSectionProps = {
  data: EventSettings;
  onRegister: () => void;
  attendeeCount?: number;
  heroBgColor?: string;
  heroBgImage?: string;
};

export function HeroSection({ data, onRegister, attendeeCount, heroBgColor = "#0B1121", heroBgImage }: HeroSectionProps) {
  const bgStyle = heroBgImage
    ? { backgroundImage: `url(${heroBgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: `linear-gradient(to bottom, ${heroBgColor}, ${heroBgColor}cc, #1E3A5F)` };

  return (
    <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden text-white" style={bgStyle}>
      <div className="nebula-orb nebula-orb-a" />
      <div className="nebula-orb nebula-orb-b" />
      <div className="nebula-orb nebula-orb-c" />
      <div className="nebula-grain" />

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-orange-400 backdrop-blur-sm">
          限量席位 · 邀您共鉴
        </span>

        <div className="flex flex-col gap-2">
          <h1 className="text-[28px] font-bold leading-tight tracking-tight">{data.title}</h1>
          <p className="text-xl font-semibold text-white/90">{data.subtitle}</p>
        </div>

        <div className="flex flex-col gap-3">
          <InfoRow icon={<Calendar size={16} />}>{data.date}</InfoRow>
          <InfoRow icon={<Clock size={16} />}>{data.time}</InfoRow>
          <InfoRow icon={<MapPin size={16} />}>{data.location}</InfoRow>
        </div>

        <div className="py-2">
          <p className="mb-2 text-xs font-medium text-white/50">距活动开始</p>
          <Countdown targetDate={TARGET_DATE} />
        </div>

        {attendeeCount !== undefined && (
          <p className="text-xs text-white/60">
            已有 <span className="font-bold text-orange-400">{attendeeCount}</span> 人报名
          </p>
        )}

        <Button
          onClick={onRegister}
          className="h-14 w-full max-w-xs rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-base font-bold text-white shadow-lg shadow-orange-500/30 hover:from-orange-600 hover:to-orange-700 active:scale-95 transition-transform"
        >
          立即报名
        </Button>

        <div className="flex gap-6 text-xs font-medium text-white/50">
          <a href="#highlights" className="hover:text-white/80 transition-colors">亮点</a>
          <a href="#guests" className="hover:text-white/80 transition-colors">嘉宾</a>
          <a href="#timeline" className="hover:text-white/80 transition-colors">议程</a>
        </div>
      </div>
    </section>
  );
}

function InfoRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-2 text-sm text-white/80">
      {icon}
      <span>{children}</span>
    </div>
  );
}
