import type { DataSource, Repository as TypeORMRepo } from "typeorm";
import { EventSettings, DEFAULT_EVENT_SETTINGS } from "../entities/EventSettings";

export class EventSettingsRepository {
  constructor(private readonly dataSource: DataSource) {}

  private get repo(): TypeORMRepo<EventSettings> {
    return this.dataSource.getRepository(EventSettings);
  }

  async getBySlug(slug: string): Promise<EventSettings> {
    let settings = await this.repo.findOne({ where: { slug } });
    if (!settings && slug === "default") {
      settings = this.repo.create(DEFAULT_EVENT_SETTINGS);
      await this.repo.save(settings);
    }
    if (!settings) throw new Error("活动不存在");
    return settings;
  }

  async update(slug: string, data: Partial<EventSettings>): Promise<EventSettings> {
    const settings = await this.getBySlug(slug);
    Object.assign(settings, data);
    return this.repo.save(settings);
  }

  async listAll(): Promise<EventSettings[]> {
    return this.repo.find({ order: { id: "ASC" } });
  }

  async create(slug: string): Promise<EventSettings> {
    const base = { ...DEFAULT_EVENT_SETTINGS, slug };
    const settings = this.repo.create(base);
    return this.repo.save(settings);
  }

  async deleteBySlug(slug: string): Promise<void> {
    if (slug === "default") throw new Error("不能删除默认活动");
    const settings = await this.repo.findOne({ where: { slug } });
    if (settings) await this.repo.remove(settings);
  }
}
