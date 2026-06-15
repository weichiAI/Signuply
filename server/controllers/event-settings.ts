import type { Context } from "hono";
import { eventSettingsService } from "../models/services/event-settings";

export async function getEventSettings(c: Context) {
  try {
    const slug = c.req.query("slug") || "default";
    const settings = await eventSettingsService.get(slug);
    return c.json(settings);
  } catch (error) {
    console.error("GET /api/event failed:", error);
    return c.json({ message: error instanceof Error ? error.message : "Error" }, error instanceof Error && error.message === "活动不存在" ? 404 : 500);
  }
}

export async function updateEventSettings(c: Context) {
  try {
    const slug = c.req.query("slug") || "default";
    const raw = await c.req.json();
    const settings = await eventSettingsService.update(slug, raw);
    return c.json(settings);
  } catch (error) {
    console.error("PUT /api/event failed:", error);
    return c.json({ message: error instanceof Error ? error.message : "Error" }, 400);
  }
}

export async function listEvents(c: Context) {
  try {
    const list = await eventSettingsService.list();
    return c.json(list);
  } catch (error) {
    return c.json({ message: error instanceof Error ? error.message : "Error" }, 500);
  }
}

export async function createEvent(c: Context) {
  try {
    const raw = await c.req.json();
    const slug = raw.slug?.trim();
    const adminPassword = raw.adminPassword?.trim() || "";
    if (!slug) throw new Error("请输入活动标识");
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("标识只能包含小写字母、数字和短横线");
    let settings = await eventSettingsService.create(slug);
    if (adminPassword) {
      settings = await eventSettingsService.update(slug, { adminPassword });
    }
    return c.json(settings, 201);
  } catch (error) {
    console.error("POST /api/event failed:", error);
    return c.json({ message: error instanceof Error ? error.message : "Error" }, 400);
  }
}

export async function deleteEvent(c: Context) {
  try {
    const raw = await c.req.json();
    const slug = raw.slug;
    if (!slug) throw new Error("缺少活动标识");
    await eventSettingsService.delete(slug);
    return c.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/event failed:", error);
    return c.json({ message: error instanceof Error ? error.message : "Error" }, 400);
  }
}
