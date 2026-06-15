import { Hono } from "hono";
import { uploadFile, serveUpload } from "../controllers/upload";

const uploadRoute = new Hono();
uploadRoute.post("/api/upload", uploadFile);
uploadRoute.get("/api/uploads/:name", serveUpload);
export { uploadRoute };
