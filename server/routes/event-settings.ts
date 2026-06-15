import { Hono } from "hono";
import { getEventSettings, updateEventSettings, listEvents, createEvent, deleteEvent } from "../controllers/event-settings";

const eventSettingsRoute = new Hono();

eventSettingsRoute.get("/api/event", getEventSettings);
eventSettingsRoute.put("/api/event", updateEventSettings);
eventSettingsRoute.get("/api/events", listEvents);
eventSettingsRoute.post("/api/event", createEvent);
eventSettingsRoute.delete("/api/event", deleteEvent);

export { eventSettingsRoute };
