import type { Context } from "hono";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const UPLOAD_DIR = path.resolve(".data/uploads");

export async function uploadFile(c: Context) {
  try {
    const body = await c.req.parseBody();
    const file = body.file as File | undefined;
    if (!file) throw new Error("未选择文件");

    const ext = path.extname(file.name) || ".png";
    const name = crypto.randomBytes(8).toString("hex") + ext;
    const filePath = path.join(UPLOAD_DIR, name);

    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    return c.json({ url: `/api/uploads/${name}` });
  } catch (error) {
    console.error("Upload failed:", error);
    return c.json({ message: error instanceof Error ? error.message : "Upload failed" }, 400);
  }
}

export async function serveUpload(c: Context) {
  try {
    const name = c.req.param("name");
    if (!name || name.includes("..")) return c.notFound();
    const filePath = path.join(UPLOAD_DIR, name);
    if (!fs.existsSync(filePath)) return c.notFound();
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(name).toLowerCase();
    const mimeTypes: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp" };
    return c.body(buffer, 200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
  } catch {
    return c.notFound();
  }
}
