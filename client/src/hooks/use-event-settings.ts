import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type FormField = {
  key: string;
  label: string;
  type: "text" | "tel" | "select" | "textarea";
  required: boolean;
  options?: string[];
};

export type SectionLabels = {
  highlights: string;
  guests: string;
  timeline: string;
  audience: string;
  venue: string;
  partners: string;
};

export type EventSettings = {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  time: string;
  location: string;
  address: string;
  trafficInfo?: string;
  mapLink?: string;
  heroBgColor?: string;
  heroBgImage?: string;
  adminPassword?: string;
  requiredFields?: string[];
  formFields?: FormField[];
  sectionLabels: SectionLabels;
  sectionSubtitles?: Record<string, string>;
  enabledSections?: string[];
  highlights: { title: string; desc: string }[];
  guests: { name: string; title: string; desc: string }[];
  timeline: { time: string; title: string; desc: string }[];
  audience: { label: string; desc: string }[];
  partners: string[];
};

async function fetchEventSettings(slug: string): Promise<EventSettings> {
  const res = await fetch(`/api/event?slug=${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error("获取活动信息失败");
  return res.json();
}

async function updateEventSettings(slug: string, data: Partial<EventSettings>): Promise<EventSettings> {
  const res = await fetch(`/api/event?slug=${encodeURIComponent(slug)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("保存失败");
  return res.json();
}

async function listEvents(): Promise<{ slug: string; title: string }[]> {
  const res = await fetch("/api/events");
  if (!res.ok) return [];
  return res.json();
}

async function createEvent(params: { slug: string; adminPassword?: string }): Promise<EventSettings> {
  const res = await fetch("/api/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({ message: "创建失败" })); throw new Error(err.message); }
  return res.json();
}

export function useEventSettings(slug: string) {
  return useQuery({
    queryKey: ["eventSettings", slug],
    queryFn: () => fetchEventSettings(slug),
    staleTime: 30000,
  });
}

export function useUpdateEventSettings(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EventSettings>) => updateEventSettings(slug, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["eventSettings", slug] }); },
  });
}

export function useEventList() {
  return useQuery({ queryKey: ["eventList"], queryFn: listEvents, staleTime: 10000 });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["eventList"] }); },
  });
}
