import { useState, useEffect, useRef } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle } from "lucide-react";
import { useRegistrationSubmit } from "@/hooks/use-registration";
import type { FormField } from "@/hooks/use-event-settings";
import QRCode from "qrcode";

const DEFAULT_FORM_FIELDS: FormField[] = [
  { key: "name", label: "姓名", type: "text", required: true },
  { key: "phone", label: "手机号", type: "tel", required: true },
  { key: "company", label: "公司", type: "text", required: true },
  { key: "title", label: "职位", type: "text", required: true },
  { key: "attendees", label: "参会人数", type: "select", options: ["1", "2", "3", "4", "5"], required: false },
  { key: "notes", label: "备注", type: "textarea", required: false },
];

type RegistrationDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formFields?: FormField[];
};

export function RegistrationDrawer({ open, onOpenChange, formFields = DEFAULT_FORM_FIELDS }: RegistrationDrawerProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successData, setSuccessData] = useState<{ ticketNo: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const submitMutation = useRegistrationSubmit();

  useEffect(() => {
    if (open) {
      setStep("form");
      setFormData({});
      setErrors({});
      setSuccessData(null);
      setQrDataUrl("");
    }
  }, [open]);

  useEffect(() => {
    if (successData && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, `TICKET:${successData.ticketNo}`, {
        width: 160, margin: 1, color: { dark: "#0B1121", light: "#FFFFFF" },
      }).then(() => {
        setQrDataUrl(canvasRef.current?.toDataURL("image/png") || "");
      }).catch(() => {});
    }
  }, [successData]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    for (const field of formFields) {
      if (field.required && !formData[field.key]?.trim()) {
        e[field.key] = `请输入${field.label}`;
      }
      if (field.type === "tel" && formData[field.key] && !/^\d{11}$/.test(formData[field.key])) {
        e[field.key] = "请输入正确的手机号";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    try {
      const payload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(formData)) {
        const trimmed = String(value).trim();
        if (!trimmed) continue;
        payload[key] = key === "attendees" ? (parseInt(trimmed, 10) || 1) : trimmed;
      }
      // Ensure required API fields exist
      if (!payload.name) payload.name = "";
      if (!payload.phone) payload.phone = "";
      if (!payload.company) payload.company = "";
      if (!payload.title) payload.title = "";
      if (payload.attendees === undefined) payload.attendees = 1;
      const result = await submitMutation.mutateAsync(payload as any);
      setSuccessData({ ticketNo: result.ticketNo });
      setStep("success");
    } catch {}
  }

  function updateField(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  }

  function renderField(field: FormField) {
    const label = (
      <Label className="text-xs font-semibold text-gray-700">
        {field.label}{!field.required ? "（选填）" : ""}
      </Label>
    );

    if (field.type === "select") {
      const opts: string[] = Array.isArray(field.options) ? field.options : [];
      return (
        <div key={field.key} className="space-y-1.5">
          {label}
          <select
            className="w-full min-h-[44px] rounded-xl border border-input/80 bg-white/80 px-3 text-sm"
            value={formData[field.key] || (opts[0] ?? "")}
            onChange={(e) => updateField(field.key, e.target.value)}
          >
            {opts.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {errors[field.key] && <p className="text-xs text-red-500">{errors[field.key]}</p>}
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <div key={field.key} className="space-y-1.5">
          {label}
          <Textarea
            placeholder={`请输入${field.label}${!field.required ? "（选填）" : ""}`}
            rows={2}
            value={formData[field.key] || ""}
            onChange={(e) => updateField(field.key, e.target.value)}
          />
          {errors[field.key] && <p className="text-xs text-red-500">{errors[field.key]}</p>}
        </div>
      );
    }

    return (
      <div key={field.key} className="space-y-1.5">
        {label}
        <Input
          type={field.type}
          placeholder={`请输入${field.label}`}
          maxLength={field.type === "tel" ? 11 : undefined}
          value={formData[field.key] || ""}
          onChange={(e) => updateField(field.key, field.type === "tel" ? e.target.value.replace(/\D/g, "") : e.target.value)}
        />
        {errors[field.key] && <p className="text-xs text-red-500">{errors[field.key]}</p>}
      </div>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-border/60 bg-card/96 px-0 pb-8 max-h-[85vh]">
        {step === "form" ? (
          <>
            <DrawerHeader className="px-5">
              <DrawerTitle>报名参会</DrawerTitle>
              <DrawerDescription>填写信息，锁定您的专属席位</DrawerDescription>
            </DrawerHeader>
            <div className="px-5 space-y-4 overflow-y-auto">
              {formFields.map(renderField)}
            </div>
            <div className="px-5 pt-4">
              <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold" onClick={handleSubmit} disabled={submitMutation.isPending}>
                {submitMutation.isPending ? "提交中..." : "确认报名"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DrawerHeader className="px-5">
              <DrawerTitle className="text-center text-green-600 flex items-center justify-center gap-2"><CheckCircle size={22} />报名成功！</DrawerTitle>
              <DrawerDescription className="text-center">您的电子票已生成，请保存</DrawerDescription>
            </DrawerHeader>
            <div className="px-5 flex flex-col items-center gap-4">
              <div className="rounded-2xl border-2 border-dashed border-gray-200 p-4 bg-white">
                {qrDataUrl ? <img src={qrDataUrl} alt="电子票二维码" className="w-40 h-40" /> : <div className="w-40 h-40 flex items-center justify-center text-gray-300 text-xs">生成中...</div>}
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <div className="text-center"><p className="text-xs text-gray-500">电子票编号</p><p className="text-lg font-bold text-[#0B1121] tracking-wider">{successData?.ticketNo || ""}</p></div>
              <p className="text-xs text-gray-400 text-center">请截图保存二维码，凭电子票入场</p>
              <Button className="w-full h-12 rounded-xl bg-[#0B1121] text-white font-bold" onClick={() => onOpenChange(false)}>完成</Button>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
