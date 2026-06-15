import { Hono } from "hono";
import { api } from "../../shared/routes";
import { createRegistration, getRegistrationCount, getRegistrationList } from "../controllers/registration";

const registrationRoute = new Hono();

registrationRoute.post(api.registration.create.path, createRegistration);
registrationRoute.get(api.registration.count.path, getRegistrationCount);
registrationRoute.get("/api/registration/list", getRegistrationList);

export { registrationRoute };
