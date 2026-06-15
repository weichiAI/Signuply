import { useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

type Registration = {
  id: number;
  name: string;
  phone: string;
  company: string;
  title: string;
  attendees: number;
  notes?: string;
  createdAt: string;
};

type RegistrationListDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RegistrationListDrawer({ open, onOpenChange }: RegistrationListDrawerProps) {
  const [list, setList] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError("");
      fetch("/api/registration/list")
        .then(r => { if (!r.ok) throw new Error("加载失败"); return r.json(); })
        .then(setList)
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [open]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-border/60 bg-card/96 px-0 pb-8 max-h-[85vh]">
        <DrawerHeader className="px-5">
          <DrawerTitle>报名列表</DrawerTitle>
          <DrawerDescription>共 {list.length} 人报名</DrawerDescription>
        </DrawerHeader>

        <div className="px-5 space-y-3 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-8">加载中...</p>
          ) : error ? (
            <p className="text-sm text-red-500 text-center py-8">{error}</p>
          ) : list.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">暂无报名数据</p>
          ) : (
            list.map((r) => (
              <div key={r.id} className="rounded-xl bg-gray-50 p-3 space-y-1">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-bold">{r.name}</span>
                  <span className="text-[10px] text-gray-400">{new Date(r.createdAt).toLocaleString("zh-CN")}</span>
                </div>
                <p className="text-xs text-gray-600">{r.phone}</p>
                <p className="text-xs text-gray-500">{r.company} · {r.title} · {r.attendees}人</p>
                {r.notes && <p className="text-xs text-gray-400 mt-1">备注：{r.notes}</p>}
              </div>
            ))
          )}
        </div>

        <div className="px-5 pt-4">
          <Button className="w-full h-12 rounded-xl bg-[#0B1121] text-white font-bold" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
