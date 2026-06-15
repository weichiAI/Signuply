import { useState, useEffect, useRef } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateEventSettings, type EventSettings, type FormField } from "@/hooks/use-event-settings";
import { AlertTriangle, Trash2, Plus, Pencil, Image, ArrowLeft } from "lucide-react";

type EditSection = "basic" | "highlights" | "guests" | "timeline" | "audience" | "partners" | "venue" | "formFields";

type EditDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: EditSection;
  data: EventSettings;
  slug: string;
};

const SECTION_LABELS: Record<EditSection, string> = {
  basic: "基本信息", venue: "场地信息", highlights: "活动亮点",
  guests: "嘉宾阵容", timeline: "详细议程", audience: "适合人群", partners: "合作伙伴",
  formFields: "报名表单字段",
};

type HighlightItem = { title: string; desc: string };
type GuestItem = { name: string; title: string; desc: string };
type TimelineItem = { time: string; title: string; desc: string };
type AudienceItem = { label: string; desc: string };

function itemToRecord(item: unknown, section: EditSection): Record<string, string> {
  if (section === "partners") return { value: String(item) };
  if (section === "formFields") {
    const f = item as FormField;
    return { key: f.key, label: f.label, type: f.type, required: String(f.required), options: f.options?.join(", ") || "" };
  }
  const obj = item as Record<string, string>;
  return { ...obj };
}

const TYPE_LABELS: Record<string, string> = {
  text: "文本",
  tel: "手机号",
  select: "下拉",
  textarea: "多行文本",
};

export function EditDrawer({ open, onOpenChange, section, data, slug }: EditDrawerProps) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [items, setItems] = useState<unknown[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [newItem, setNewItem] = useState<Record<string, string>>({});
  const [reqFields, setReqFields] = useState<string[]>([]);
  const [secLabels, setSecLabels] = useState<Record<string, string>>({});
  const [secSubtitles, setSecSubtitles] = useState<Record<string, string>>({});
  const [enabledSecs, setEnabledSecs] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeSection, setActiveSection] = useState<EditSection>(section);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateMutation = useUpdateEventSettings(slug);

  useEffect(() => {
    setActiveSection(section);
  }, [section]);

  useEffect(() => {
    if (open && data) {
      setErrorMsg("");
      setAdding(false);
      setEditingIdx(null);
      if (activeSection === "basic") {
        setForm({ title: data.title || "", subtitle: data.subtitle || "", date: data.date || "", time: data.time || "", location: data.location || "", address: data.address || "", heroBgColor: data.heroBgColor || "#0B1121", heroBgImage: data.heroBgImage || "" });
        setReqFields(data.requiredFields || ["name", "phone", "company", "title"]);
        setSecLabels(data.sectionLabels || {});
        setSecSubtitles(data.sectionSubtitles || {});
        setEnabledSecs(data.enabledSections || ["highlights","guests","timeline","audience","venue","partners"]);
      } else if (activeSection === "venue") {
        setForm({ location: data.location || "", address: data.address || "", trafficInfo: data.trafficInfo || "", mapLink: data.mapLink || "" });
      } else if (activeSection === "formFields") {
        const arr = data.formFields || [];
        setItems(arr);
        setNewItem({});
      } else {
        const arr = (data as Record<string, unknown>)[activeSection] as unknown[];
        setItems(arr || []);
        setNewItem({});
      }
    }
  }, [open, activeSection, data]);

  async function persistItems(newItems: unknown[]) {
    setErrorMsg("");
    try {
      await updateMutation.mutateAsync({ [activeSection]: newItems } as Partial<EventSettings>);
      setItems(newItems);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "保存失败");
    }
  }

  async function handleSave() {
    setErrorMsg("");
    try {
      if (activeSection === "basic") {
        await updateMutation.mutateAsync({ title: form.title, subtitle: form.subtitle, date: form.date, time: form.time, location: form.location, address: form.address, heroBgColor: form.heroBgColor, heroBgImage: form.heroBgImage, requiredFields: reqFields, sectionLabels: secLabels as any, sectionSubtitles: secSubtitles as any, enabledSections: enabledSecs as any });
      } else if (activeSection === "venue") {
        await updateMutation.mutateAsync({ location: form.location, address: form.address, trafficInfo: form.trafficInfo, mapLink: form.mapLink });
      }
      onOpenChange(false);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "保存失败");
    }
  }

  function deleteItem(idx: number) {
    const newItems = items.filter((_, i) => i !== idx);
    persistItems(newItems);
  }

  function startEdit(idx: number) {
    setNewItem(itemToRecord(items[idx], activeSection));
    setEditingIdx(idx);
    setAdding(true);
    setErrorMsg("");
  }

  function startAdd() {
    setNewItem({});
    setEditingIdx(null);
    setAdding(true);
    setErrorMsg("");
  }

  function cancelForm() {
    setAdding(false);
    setEditingIdx(null);
    setNewItem({});
    setErrorMsg("");
  }

  function submitItem() {
    if (activeSection === "partners") {
      const val = newItem.value?.trim();
      if (!val) { setErrorMsg("请输入合作方名称"); return; }
      const newItems = editingIdx !== null
        ? items.map((it, i) => i === editingIdx ? val : it)
        : [...items, val];
      persistItems(newItems);
      cancelForm();
    } else if (activeSection === "highlights") {
      if (!newItem.title?.trim() || !newItem.desc?.trim()) { setErrorMsg("请填写标题和描述"); return; }
      const entry = { title: newItem.title.trim(), desc: newItem.desc.trim() };
      const newItems = editingIdx !== null ? items.map((it, i) => i === editingIdx ? entry : it) : [...items, entry];
      persistItems(newItems);
      cancelForm();
    } else if (activeSection === "guests") {
      if (!newItem.name?.trim() || !newItem.title?.trim()) { setErrorMsg("请填写姓名和头衔"); return; }
      const entry = { name: newItem.name.trim(), title: newItem.title.trim(), desc: newItem.desc?.trim() || "" };
      const newItems = editingIdx !== null ? items.map((it, i) => i === editingIdx ? entry : it) : [...items, entry];
      persistItems(newItems);
      cancelForm();
    } else if (activeSection === "timeline") {
      if (!newItem.time?.trim() || !newItem.title?.trim()) { setErrorMsg("请填写时间和标题"); return; }
      const entry = { time: newItem.time.trim(), title: newItem.title.trim(), desc: newItem.desc?.trim() || "" };
      const newItems = editingIdx !== null ? items.map((it, i) => i === editingIdx ? entry : it) : [...items, entry];
      persistItems(newItems);
      cancelForm();
    } else if (activeSection === "audience") {
      if (!newItem.label?.trim() || !newItem.desc?.trim()) { setErrorMsg("请填写标签和描述"); return; }
      const entry = { label: newItem.label.trim(), desc: newItem.desc.trim() };
      const newItems = editingIdx !== null ? items.map((it, i) => i === editingIdx ? entry : it) : [...items, entry];
      persistItems(newItems);
      cancelForm();
    } else if (activeSection === "formFields") {
      if (!newItem.label?.trim()) { setErrorMsg("请填写字段名"); return; }
      const key = newItem.key?.trim() || newItem.label.trim().replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "_").toLowerCase();
      const type = newItem.type || "text";
      const required = newItem.required === "true";
      const options = type === "select" ? (newItem.options || "").split(",").map(s => s.trim()).filter(Boolean) : undefined;
      const entry: FormField = { key, label: newItem.label.trim(), type: type as FormField["type"], required, ...(options ? { options } : {}) };
      const newItems = editingIdx !== null ? items.map((it, i) => i === editingIdx ? entry : it) : [...items, entry];
      persistItems(newItems);
      cancelForm();
    }
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errorMsg) setErrorMsg("");
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.url) updateField("heroBgImage", json.url);
    } catch {}
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function renderSectionContent() {
    if (activeSection === "basic") {
      return (
        <>
          <Field label="活动标题"><Input value={form.title || ""} onChange={(e) => updateField("title", e.target.value)} /></Field>
          <Field label="副标题"><Input value={form.subtitle || ""} onChange={(e) => updateField("subtitle", e.target.value)} /></Field>
          <Field label="日期"><Input value={form.date || ""} onChange={(e) => updateField("date", e.target.value)} /></Field>
          <Field label="时间"><Input value={form.time || ""} onChange={(e) => updateField("time", e.target.value)} /></Field>
          <Field label="地点名称"><Input value={form.location || ""} onChange={(e) => updateField("location", e.target.value)} /></Field>
          <Field label="详细地址"><Input value={form.address || ""} onChange={(e) => updateField("address", e.target.value)} /></Field>

          <div className="pt-3 border-t border-gray-100">
            <Label className="text-xs font-semibold text-gray-700 mb-1">Hero 背景设置</Label>
            <div className="space-y-2 mt-2">
              <div className="flex gap-2">
                <Input placeholder="背景色 #0B1121" value={form.heroBgColor || ""} onChange={(e) => updateField("heroBgColor", e.target.value)} />
                <input type="color" value={form.heroBgColor || "#0B1121"} onChange={(e) => updateField("heroBgColor", e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
              </div>
              <Input placeholder="背景图片URL（可选）" value={form.heroBgImage || ""} onChange={(e) => updateField("heroBgImage", e.target.value)} />
              {form.heroBgImage && (
                <div className="relative rounded-lg overflow-hidden">
                  <img src={form.heroBgImage} alt="背景预览" className="w-full h-24 object-cover" />
                </div>
              )}
              <div>
                <label className="cursor-pointer">
                  <div className="flex items-center justify-center gap-1.5 h-10 rounded-lg border border-dashed border-gray-200 text-xs text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors">
                    <Image size={14} />
                    {uploading ? "上传中..." : "上传背景图片"}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100">
            <Label className="text-xs font-semibold text-gray-700 mb-1">板块标题和副标题</Label>
            <div className="space-y-2 mt-2">
              {[
                { key: "highlights", name: "亮点" },
                { key: "guests", name: "嘉宾" },
                { key: "timeline", name: "议程" },
                { key: "audience", name: "人群" },
                { key: "venue", name: "场地" },
                { key: "partners", name: "合作" },
              ].map(({ key, name }) => (
                <div key={key} className="flex gap-2 items-center">
                  <span className="text-[10px] text-gray-400 w-8 flex-shrink-0">{name}</span>
                  <Input
                    className="flex-1"
                    value={secLabels[key] || ""}
                    placeholder={`${name}标题`}
                    onChange={(e) => setSecLabels(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                  <Input
                    className="flex-1"
                    value={secSubtitles[key] || ""}
                    placeholder={`${name}副标题`}
                    onChange={(e) => setSecSubtitles(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <Label className="text-xs font-semibold text-gray-700 mt-2">板块显示开关</Label>
            <p className="text-[10px] text-gray-400">关闭的板块不会在页面上显示</p>
            <div className="flex flex-wrap gap-2">
              {["highlights:亮点","guests:嘉宾","timeline:议程","audience:人群","venue:场地","partners:合作"].map(item => {
                const [key, label] = item.split(":");
                const enabled = enabledSecs.includes(key);
                return (
                  <button key={key} onClick={() => {
                    if (enabled) {
                      setEnabledSecs(prev => prev.filter(f => f !== key));
                    } else {
                      setEnabledSecs(prev => [...prev, key]);
                    }
                  }}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${enabled ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-400 border-gray-200"}`}>
                    {label}{enabled ? " ✓" : ""}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label className="text-xs font-semibold text-gray-700">报名表单必填项</Label>
            <p className="text-[10px] text-gray-400">选择访客报名时必须填写的字段</p>
            <div className="flex flex-wrap gap-2">
              {["name:姓名", "phone:手机号", "company:公司", "title:职位"].map((item) => {
                const [key, label] = item.split(":");
                const checked = reqFields.includes(key);
                return (
                  <button key={key} onClick={() => setReqFields(prev => checked ? prev.filter(f => f !== key) : [...prev, key])}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${checked ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-500 border-gray-200"}`}>
                    {label}{checked ? " ✓" : ""}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <Button variant="outline" className="w-full text-xs" onClick={() => setActiveSection("formFields")}>
              编辑自定义字段 →
            </Button>
          </div>

          <div className="pt-2">
            <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold" onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "保存中..." : "保存"}
            </Button>
          </div>
        </>
      );
    }

    if (activeSection === "venue") {
      return (
        <>
          <Field label="地点名称"><Input value={form.location || ""} onChange={(e) => updateField("location", e.target.value)} /></Field>
          <Field label="详细地址"><Input value={form.address || ""} onChange={(e) => updateField("address", e.target.value)} /></Field>
          <Field label="交通指引"><Input value={form.trafficInfo || ""} onChange={(e) => updateField("trafficInfo", e.target.value)} /></Field>
          <Field label="地图链接"><Input value={form.mapLink || ""} placeholder="高德/百度地图链接" onChange={(e) => updateField("mapLink", e.target.value)} /></Field>
          <div className="pt-2">
            <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold" onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "保存中..." : "保存"}
            </Button>
          </div>
        </>
      );
    }

    if (activeSection === "formFields") {
      return (
        <>
          {section === "basic" && activeSection === "formFields" && (
            <button onClick={() => setActiveSection("basic")} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-1">
              <ArrowLeft size={12} /> 返回基本信息
            </button>
          )}
          {items.map((item, idx) => {
            const f = item as FormField;
            return (
              <div key={idx} className="relative flex items-center gap-3 rounded-xl bg-gray-50 p-3 pr-16">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{f.label}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${f.required ? "bg-orange-100 text-orange-600" : "bg-gray-200 text-gray-500"}`}>
                      {f.required ? "必填" : "选填"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {TYPE_LABELS[f.type] || f.type} · {f.key}
                    {f.options?.length ? ` · 选项: ${f.options.join(", ")}` : ""}
                  </p>
                </div>
                <div className="absolute right-2 top-3 flex items-center gap-1">
                  <button onClick={() => startEdit(idx)} className="text-blue-400 hover:text-blue-600 active:scale-90 transition-transform">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => deleteItem(idx)} className="text-red-400 hover:text-red-600 active:scale-90 transition-transform">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}

          {adding ? (
            <div className="rounded-xl bg-orange-50 p-3 space-y-2">
              <Input placeholder="字段名（显示给访客）" value={newItem.label || ""} onChange={(e) => setNewItem(p => ({ ...p, label: e.target.value }))} />
              <select
                className="w-full min-h-[40px] rounded-lg border border-input/80 bg-white px-3 text-sm"
                value={newItem.type || "text"}
                onChange={(e) => setNewItem(p => ({ ...p, type: e.target.value }))}
              >
                <option value="text">文本</option>
                <option value="tel">手机号</option>
                <option value="select">下拉选择</option>
                <option value="textarea">多行文本</option>
              </select>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newItem.required === "true"}
                  onChange={(e) => setNewItem(p => ({ ...p, required: e.target.checked ? "true" : "false" }))}
                  className="w-4 h-4 rounded accent-orange-500"
                />
                <span className="text-xs text-gray-600">必填字段</span>
              </label>
              {(newItem.type === "select") && (
                <Input placeholder="选项（逗号分隔，如: 1,2,3,4,5）" value={newItem.options || ""} onChange={(e) => setNewItem(p => ({ ...p, options: e.target.value }))} />
              )}
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-orange-500 text-white" onClick={submitItem}>
                  {editingIdx !== null ? "保存修改" : "添加"}
                </Button>
                <Button size="sm" variant="outline" onClick={cancelForm}>取消</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full flex items-center justify-center gap-1" onClick={startAdd}>
              <Plus size={14} /> 添加字段
            </Button>
          )}

          {errorMsg && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3">
              <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-600">{errorMsg}</p>
            </div>
          )}
        </>
      );
    }

    return (
      <>
        {items.map((item, idx) => (
          <div key={idx} className="relative flex items-start gap-3 rounded-xl bg-gray-50 p-3 pr-16">
            <div className="flex-1 min-w-0">
              {activeSection === "partners" ? (
                <span className="text-sm">{String(item)}</span>
              ) : activeSection === "highlights" ? (
                <><p className="text-sm font-medium">{(item as HighlightItem).title}</p><p className="text-xs text-gray-500 mt-0.5">{(item as HighlightItem).desc}</p></>
              ) : activeSection === "guests" ? (
                <><p className="text-sm font-medium">{(item as GuestItem).name}</p><p className="text-xs text-orange-500">{(item as GuestItem).title}</p><p className="text-xs text-gray-500 mt-0.5">{(item as GuestItem).desc}</p></>
              ) : activeSection === "timeline" ? (
                <><span className="text-xs font-bold text-orange-500">{(item as TimelineItem).time}</span><p className="text-sm font-medium">{(item as TimelineItem).title}</p><p className="text-xs text-gray-500 mt-0.5">{(item as TimelineItem).desc}</p></>
              ) : activeSection === "audience" ? (
                <><p className="text-sm font-medium">{(item as AudienceItem).label}</p><p className="text-xs text-gray-500 mt-0.5">{(item as AudienceItem).desc}</p></>
              ) : null}
            </div>
            <div className="absolute right-2 top-3 flex items-center gap-1">
              <button onClick={() => startEdit(idx)} className="text-blue-400 hover:text-blue-600 active:scale-90 transition-transform">
                <Pencil size={15} />
              </button>
              <button onClick={() => deleteItem(idx)} className="text-red-400 hover:text-red-600 active:scale-90 transition-transform">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}

        {adding ? (
          <div className="rounded-xl bg-orange-50 p-3 space-y-2">
            {activeSection === "partners" ? (
              <Input placeholder="合作方名称" value={newItem.value || ""} onChange={(e) => setNewItem({ value: e.target.value })} />
            ) : activeSection === "highlights" ? (
              <><Input placeholder="标题" value={newItem.title || ""} onChange={(e) => setNewItem(p => ({ ...p, title: e.target.value }))} />
              <Input placeholder="描述" value={newItem.desc || ""} onChange={(e) => setNewItem(p => ({ ...p, desc: e.target.value }))} /></>
            ) : activeSection === "guests" ? (
              <><Input placeholder="姓名" value={newItem.name || ""} onChange={(e) => setNewItem(p => ({ ...p, name: e.target.value }))} />
              <Input placeholder="头衔" value={newItem.title || ""} onChange={(e) => setNewItem(p => ({ ...p, title: e.target.value }))} />
              <Input placeholder="介绍" value={newItem.desc || ""} onChange={(e) => setNewItem(p => ({ ...p, desc: e.target.value }))} /></>
            ) : activeSection === "timeline" ? (
              <><Input placeholder="时间 (如09:00)" value={newItem.time || ""} onChange={(e) => setNewItem(p => ({ ...p, time: e.target.value }))} />
              <Input placeholder="标题" value={newItem.title || ""} onChange={(e) => setNewItem(p => ({ ...p, title: e.target.value }))} />
              <Input placeholder="描述" value={newItem.desc || ""} onChange={(e) => setNewItem(p => ({ ...p, desc: e.target.value }))} /></>
            ) : activeSection === "audience" ? (
              <><Input placeholder="标签" value={newItem.label || ""} onChange={(e) => setNewItem(p => ({ ...p, label: e.target.value }))} />
              <Input placeholder="描述" value={newItem.desc || ""} onChange={(e) => setNewItem(p => ({ ...p, desc: e.target.value }))} /></>
            ) : null}
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 bg-orange-500 text-white" onClick={submitItem}>
                {editingIdx !== null ? "保存修改" : "添加"}
              </Button>
              <Button size="sm" variant="outline" onClick={cancelForm}>取消</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full flex items-center justify-center gap-1" onClick={startAdd}>
            <Plus size={14} /> 添加一项
          </Button>
        )}

        {errorMsg && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3">
            <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-600">{errorMsg}</p>
          </div>
        )}
      </>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-border/60 bg-card/96 px-0 pb-8 max-h-[85vh]">
        <DrawerHeader className="px-5">
          <DrawerTitle>编辑{SECTION_LABELS[activeSection]}</DrawerTitle>
          <DrawerDescription>修改后自动保存</DrawerDescription>
        </DrawerHeader>

        <div className="px-5 space-y-3 overflow-y-auto">
          {renderSectionContent()}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-semibold text-gray-700">{label}</Label>{children}</div>;
}
