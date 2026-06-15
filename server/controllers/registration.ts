import type { Context } from "hono";
import { api } from "../../shared/routes";
import { RegistrationCreateSchema } from "../../shared/schema";
import { registrationService } from "../models/services/registration";

export async function createRegistration(c: Context) {
  try {
    const raw = await c.req.json();
    const body = RegistrationCreateSchema.parse(raw);

    const result = await registrationService.register(body);

    const response = { id: result.id, ticketNo: result.ticketNo };
    api.registration.create.responses[201].parse(response);

    return c.json(response, 201);
  } catch (error) {
    console.error("POST /api/registration failed:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return c.json({ message }, 400);
  }
}

export async function getRegistrationCount(c: Context) {
  try {
    const count = await registrationService.getCount();
    const response = { count };
    api.registration.count.responses[200].parse(response);
    return c.json(response);
  } catch (error) {
    console.error("GET /api/registration/count failed:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return c.json({ message }, 500);
  }
}

export async function getRegistrationList(c: Context) {
  try {
    const list = await registrationService.getAll();
    return c.json(list);
  } catch (error) {
    console.error("GET /api/registration/list failed:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return c.json({ message }, 500);
  }
}
