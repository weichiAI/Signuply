import { getDataSource } from "../../db";
import { EventSettingsRepository } from "../repositories/event-settings";
import type { EventSettings } from "../entities/EventSettings";

const JSON_KEYS = ["highlights","guests","timeline","audience","partners","requiredFields","formFields","sectionLabels","sectionSubtitles","enabledSections"];
const STRING_KEYS = ["id","slug","title","subtitle","date","time","location","address","trafficInfo","mapLink","heroBgColor","heroBgImage","adminPassword"];

function deserialize(settings: EventSettings): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of STRING_KEYS) { out[key] = (settings as unknown as Record<string, unknown>)[key] || ""; }
  for (const key of JSON_KEYS) {
    const v = (settings as unknown as Record<string, unknown>)[key];
    try { out[key] = typeof v === "string" ? JSON.parse(v) : (v || (["sectionLabels","sectionSubtitles"].includes(key) ? {} : [])); }
    catch { out[key] = key === "sectionLabels" ? {} : []; }
  }
  return out;
}

export class EventSettingsService {
  private async getRepo(): Promise<EventSettingsRepository> {
    const [Registration, EventSettings] = await Promise.all([
      import("../entities/Registration"), import("../entities/EventSettings"),
    ]);
    const ds = await getDataSource({ entities: [Registration.Registration, EventSettings.EventSettings] });
    return new EventSettingsRepository(ds);
  }

  async get(slug: string): Promise<Record<string, unknown>> {
    const repo = await this.getRepo();
    return deserialize(await repo.getBySlug(slug));
  }

  async update(slug: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const repo = await this.getRepo();
    const serialized: Record<string, unknown> = { ...data };
    for (const key of JSON_KEYS) { if (data[key] !== undefined) serialized[key] = JSON.stringify(data[key]); }
    return deserialize(await repo.update(slug, serialized as Partial<EventSettings>));
  }

  async list(): Promise<{ slug: string; title: string }[]> {
    const repo = await this.getRepo();
    const all = await repo.listAll();
    return all.map(e => ({ slug: e.slug, title: e.title }));
  }

  async create(slug: string): Promise<Record<string, unknown>> {
    const repo = await this.getRepo();
    return deserialize(await repo.create(slug));
  }

  async delete(slug: string): Promise<void> {
    const repo = await this.getRepo();
    return repo.deleteBySlug(slug);
  }
}

export const eventSettingsService = new EventSettingsService();
