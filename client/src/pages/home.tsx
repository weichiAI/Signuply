import { useState, useEffect, useRef } from "react";
import { Pencil, Users, Settings } from "lucide-react";
import { HeroSection } from "@/components/event/HeroSection";
import { HighlightsSection } from "@/components/event/HighlightsSection";
import { GuestsSection } from "@/components/event/GuestsSection";
import { TimelineSection } from "@/components/event/TimelineSection";
import { AudienceSection } from "@/components/event/AudienceSection";
import { VenueSection } from "@/components/event/VenueSection";
import { PartnersSection } from "@/components/event/PartnersSection";
import { RegistrationDrawer } from "@/components/event/RegistrationDrawer";
import { RegistrationListDrawer } from "@/components/event/RegistrationListDrawer";
import { StickyBar } from "@/components/event/StickyBar";
import { EditDrawer } from "@/components/event/EditDrawer";
import { ShareQRCode } from "@/components/event/ShareQRCode";
import { useRegistrationCount } from "@/hooks/use-registration";
import { useEventSettings, useUpdateEventSettings, useEventList, useCreateEvent } from "@/hooks/use-event-settings";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EditSection = "basic" | "highlights" | "guests" | "timeline" | "audience" | "partners" | "venue" | "formFields";

export default function Home() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editSection, setEditSection] = useState<EditSection>("basic");
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [eventSwitcherOpen, setEventSwitcherOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pwdVerified, setPwdVerified] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const eventSlug = params.get("event") || "default";
  const isManager = params.get("manage") === "true";
  const shouldCreate = params.get("create") === "1";

  const { data: count } = useRegistrationCount();
  const { data: eventData, isLoading } = useEventSettings(eventSlug);

  useEffect(() => {
    if (eventData) document.title = eventData.title + " · 活动报名";
  }, [eventData]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    const hero = document.getElementById("hero");
    if (hero) observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isManager && shouldCreate) {
      setEventSwitcherOpen(true);
    }
  }, [isManager, shouldCreate]);

  function openEdit(section: EditSection) {
    setEditSection(section);
    setEditDrawerOpen(true);
  }

  if (isLoading || !eventData) {
    return (
      <div className="mobile-screen-shell bg-white flex items-center justify-center min-h-screen">
        <p className="text-sm text-gray-400">加载中...</p>
      </div>
    );
  }

  if (isManager && eventData.adminPassword && !pwdVerified) {
    return (
      <div className="mobile-screen-shell bg-white flex items-center justify-center min-h-screen px-5">
        <div className="w-full max-w-sm space-y-4">
          <h2 className="text-lg font-bold text-center">活动管理验证</h2>
          <p className="text-xs text-gray-500 text-center">此活动已设置管理密码</p>
          <Input
            type="password"
            placeholder="请输入管理密码"
            value={passwordInput}
            onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") {
              if (passwordInput === eventData.adminPassword) {
                setPwdVerified(true);
              } else {
                setPasswordError("密码错误");
              }
            }}}
          />
          {passwordError && <p className="text-xs text-red-500 text-center">{passwordError}</p>}
          <Button
            className="w-full"
            onClick={() => {
              if (passwordInput === eventData.adminPassword) {
                setPwdVerified(true);
              } else {
                setPasswordError("密码错误");
              }
            }}
          >
            验证
          </Button>
        </div>
      </div>
    );
  }

  const labels = eventData.sectionLabels;
  const subtitles = eventData.sectionSubtitles || {};
  const enabled = (eventData.enabledSections?.length ? eventData.enabledSections : ["highlights","guests","timeline","audience","venue","partners"]);

  return (
    <div className="mobile-screen-shell bg-white">
      <div className="mobile-screen-frame">
        <StickyBar
          visible={stickyVisible}
          onRegister={() => setDrawerOpen(true)}
          title={eventData.title}
          date={eventData.date}
          location={eventData.location}
        />

        <div style={{ paddingBottom: "calc(4rem + var(--safe-bottom))" }}>
          <EditWrapper editMode={editMode} onEdit={() => openEdit("basic")}>
            <HeroSection data={eventData} onRegister={() => setDrawerOpen(true)} attendeeCount={count} heroBgColor={eventData.heroBgColor} heroBgImage={eventData.heroBgImage} />
          </EditWrapper>

          {enabled.includes("highlights") && (
            <EditWrapper editMode={editMode} onEdit={() => openEdit("highlights")}>
              <HighlightsSection data={eventData.highlights} title={labels.highlights} subtitle={subtitles.highlights} />
            </EditWrapper>
          )}

          {enabled.includes("guests") && (
            <EditWrapper editMode={editMode} onEdit={() => openEdit("guests")}>
              <GuestsSection data={eventData.guests} title={labels.guests} subtitle={subtitles.guests} />
            </EditWrapper>
          )}

          {enabled.includes("timeline") && (
            <EditWrapper editMode={editMode} onEdit={() => openEdit("timeline")}>
              <TimelineSection data={eventData.timeline} title={labels.timeline} subtitle={subtitles.timeline} />
            </EditWrapper>
          )}

          {enabled.includes("audience") && (
            <EditWrapper editMode={editMode} onEdit={() => openEdit("audience")}>
              <AudienceSection data={eventData.audience} title={labels.audience} subtitle={subtitles.audience} />
            </EditWrapper>
          )}

          {enabled.includes("venue") && (
            <EditWrapper editMode={editMode} onEdit={() => openEdit("venue")}>
              <VenueSection data={{ location: eventData.location, address: eventData.address, trafficInfo: eventData.trafficInfo, mapLink: eventData.mapLink }} title={labels.venue} subtitle={subtitles.venue} />
            </EditWrapper>
          )}

          {enabled.includes("partners") && (
            <EditWrapper editMode={editMode} onEdit={() => openEdit("partners")}>
              <PartnersSection data={eventData.partners} title={labels.partners} subtitle={subtitles.partners} />
            </EditWrapper>
          )}

          <div className="py-8 text-center">
            <p className="text-xs text-gray-400">{eventData.title}</p>
            <p className="text-[10px] text-gray-300 mt-1">Powered by 未迟AI-Club</p>
            {!isManager && (
              <p className="text-[10px] text-gray-300 mt-2">管理入口：在地址后添加 ?manage=true</p>
            )}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3 bg-white/90 backdrop-blur-lg border-t border-gray-100">
          <div className="flex items-center gap-3 max-w-[430px] mx-auto">
            <button
              className="flex items-center gap-2 text-xs font-semibold text-gray-600 min-h-[44px] px-4 rounded-xl border border-gray-200 bg-gray-50 active:bg-gray-100"
              onClick={() => setShareOpen(true)}
            >
              分享
            </button>
            <Button
              onClick={() => setDrawerOpen(true)}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold"
            >
              立即报名
            </Button>
            {!isManager && (
              <button
                onClick={() => { window.location.href = "/?manage=true&event=default&create=1"; }}
                className="flex items-center gap-1 text-xs font-semibold text-orange-500 min-h-[44px] px-3 rounded-xl border border-orange-200 bg-orange-50 active:bg-orange-100"
              >
                创建活动
              </button>
            )}
          </div>
        </div>

        {isManager && editMode && (
          <button
            onClick={() => setListOpen(true)}
            className="fixed left-4 bottom-24 z-40 w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-200"
          >
            <Users size={18} className="text-blue-500" />
          </button>
        )}

        {isManager && (
          <button
            onClick={() => setEventSwitcherOpen(true)}
            className="fixed left-4 bottom-32 z-40 w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-200"
          >
            <Settings size={18} className="text-gray-600" />
          </button>
        )}

        {isManager && (
        <button
          onClick={() => setEditMode(!editMode)}
          className={`fixed right-4 bottom-24 z-40 w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-all ${
            editMode ? "bg-orange-500 text-white" : "bg-white text-gray-500 border border-gray-200"
          }`}
        >
          <Pencil size={18} />
        </button>
        )}

        <RegistrationDrawer open={drawerOpen} onOpenChange={setDrawerOpen} formFields={eventData.formFields} />
        <EditDrawer open={editDrawerOpen} onOpenChange={setEditDrawerOpen} section={editSection} data={eventData} slug={eventSlug} />
        <ShareQRCode open={shareOpen} onOpenChange={setShareOpen} />
        <RegistrationListDrawer open={listOpen} onOpenChange={setListOpen} />
        <EventSwitcher open={eventSwitcherOpen} onOpenChange={setEventSwitcherOpen} currentSlug={eventSlug} />
      </div>
    </div>
  );
}

function EditWrapper({ editMode, onEdit, children }: { editMode: boolean; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      {editMode && (
        <button onClick={onEdit} className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md active:scale-95 transition-transform">
          <Pencil size={14} />
        </button>
      )}
    </div>
  );
}

function EventSwitcher({ open, onOpenChange, currentSlug }: { open: boolean; onOpenChange: (open: boolean) => void; currentSlug: string }) {
  const [newSlug, setNewSlug] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showingNew, setShowingNew] = useState(false);
  const [created, setCreated] = useState<{ slug: string } | null>(null);
  const { data: eventList, isLoading } = useEventList();
  const createMutation = useCreateEvent();

  useEffect(() => {
    if (open) {
      setNewSlug("");
      setNewPassword("");
      setShowingNew(false);
      setCreated(null);
    }
  }, [open]);

  async function handleCreate() {
    const trimmed = newSlug.trim();
    if (!trimmed) return;
    try {
      await createMutation.mutateAsync({ slug: trimmed, adminPassword: newPassword.trim() } as any);
      setCreated({ slug: trimmed });
    } catch {}
  }

  function copyText(text: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }

  function navigateTo(slug: string) {
    window.location.href = `/?manage=true&event=${encodeURIComponent(slug)}`;
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-border/60 bg-card/96 px-0 pb-8 max-h-[85vh]">
        <DrawerHeader className="px-5">
          <DrawerTitle>活动管理</DrawerTitle>
        </DrawerHeader>
        <div className="px-5 space-y-2 overflow-y-auto">
          {created ? (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 space-y-3">
              <p className="text-sm font-semibold text-green-700">活动创建成功！</p>
              <div>
                <p className="text-[10px] text-gray-500 mb-1">访客链接（分享用）：</p>
                <div className="flex gap-1">
                  <Input readOnly value={`${window.location.origin}/?event=${encodeURIComponent(created.slug)}`} className="text-xs font-mono" />
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => copyText(`${window.location.origin}/?event=${encodeURIComponent(created.slug)}`)}>复制</Button>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 mb-1">管理链接（自己用）：</p>
                <div className="flex gap-1">
                  <Input readOnly value={`${window.location.origin}/?manage=true&event=${encodeURIComponent(created.slug)}`} className="text-xs font-mono" />
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => copyText(`${window.location.origin}/?manage=true&event=${encodeURIComponent(created.slug)}`)}>复制</Button>
                </div>
              </div>
              <Button size="sm" className="w-full bg-green-600 text-white" onClick={() => navigateTo(created.slug)}>
                进入管理
              </Button>
            </div>
          ) : (
            <>
              {isLoading ? (
                <p className="text-xs text-gray-400 text-center py-4">加载中...</p>
              ) : (
                eventList?.map((ev) => (
                  <button
                    key={ev.slug}
                    onClick={() => navigateTo(ev.slug)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                      ev.slug === currentSlug
                        ? "border-orange-500 bg-orange-50 text-orange-600"
                        : "border-gray-100 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {ev.title}
                    {ev.slug === currentSlug && <span className="text-xs text-orange-400 ml-2">当前</span>}
                  </button>
                ))
              )}

              {showingNew ? (
                <div className="rounded-xl bg-orange-50 p-3 space-y-2">
                  <Label className="text-xs font-semibold text-gray-700">活动标识（英文）</Label>
                  <Input
                    placeholder="请输入英文标识，如 tech-summit-2026"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                    onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                  />
                  <Label className="text-xs font-semibold text-gray-700">管理密码（可选）</Label>
                  <Input
                    placeholder="设置密码后，管理需验证"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-orange-500 text-white" onClick={handleCreate} disabled={createMutation.isPending}>
                      {createMutation.isPending ? "创建中..." : "创建"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setShowingNew(false); setNewSlug(""); }}>
                      取消
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setShowingNew(true)}>
                  新建活动
                </Button>
              )}
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
