import { Button } from "@/components/ui/button";

type StickyBarProps = {
  visible: boolean;
  onRegister: () => void;
  title: string;
  date: string;
  location: string;
};

export function StickyBar({ visible, onRegister, title, date, location }: StickyBarProps) {
  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 px-4 py-2 bg-white/90 backdrop-blur-lg border-b border-gray-100 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between max-w-[430px] mx-auto">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-[#0B1121]">{title}</span>
          <span className="text-[10px] text-gray-400">{date}</span>
        </div>
        <Button
          onClick={onRegister}
          className="h-9 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold"
        >
          立即报名
        </Button>
      </div>
    </div>
  );
}
