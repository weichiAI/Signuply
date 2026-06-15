import { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";
import QRCode from "qrcode";

type ShareQRCodeProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ShareQRCode({ open, onOpenChange }: ShareQRCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const shareUrl = window.location.origin + window.location.pathname + window.location.search.replace(/[?&]manage=true/g, "").replace(/^&/, "?").replace(/^\?$/, "");

  useEffect(() => {
    if (open) {
      setQrDataUrl("");
      QRCode.toDataURL(shareUrl, {
        width: 280, margin: 2, color: { dark: "#0B1121", light: "#FFFFFF" },
      }).then(setQrDataUrl).catch(() => setQrDataUrl(""));
    }
  }, [open]);

  function copyLink() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-border/60 bg-card/96 px-0 pb-8">
        <DrawerHeader className="px-5">
          <DrawerTitle className="text-center">分享活动</DrawerTitle>
          <DrawerDescription className="text-center">扫描二维码或复制链接分享</DrawerDescription>
        </DrawerHeader>

        <div className="px-5 flex flex-col items-center gap-4">
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-4 bg-white">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="活动二维码" className="w-44 h-44" />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="w-full">
            <p className="text-[10px] text-gray-400 mb-1">活动链接</p>
            <div className="flex gap-1">
              <Input readOnly value={shareUrl} className="text-xs font-mono" />
              <Button size="sm" variant="outline" onClick={copyLink} className="flex items-center gap-1 text-xs">
                <Copy size={12} /> 复制
              </Button>
            </div>
          </div>

          <Button className="w-full h-12 rounded-xl bg-[#0B1121] text-white font-bold" onClick={() => onOpenChange(false)}>
            完成
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
