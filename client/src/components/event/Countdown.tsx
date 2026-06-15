import { useState, useEffect } from "react";

type CountdownProps = {
  targetDate: Date;
};

function getTimeLeft(target: Date) {
  const now = Date.now();
  const diff = target.getTime() - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    ended: false,
  };
}

export function Countdown({ targetDate }: CountdownProps) {
  const [time, setTime] = useState(() => getTimeLeft(targetDate));

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const items = [
    { value: time.days, label: "天" },
    { value: time.hours, label: "时" },
    { value: time.minutes, label: "分" },
    { value: time.seconds, label: "秒" },
  ];

  if (time.ended) {
    return (
      <div className="flex items-center justify-center gap-3">
        <span className="text-base font-semibold text-orange-400">活动已开始</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-orange-400 tabular-nums">{String(item.value).padStart(2, "0")}</span>
          <span className="text-xs font-medium text-white/70">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
