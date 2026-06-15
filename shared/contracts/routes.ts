import { GREETING_ROUTE_PATH } from "../constants/greeting";
import { REGISTRATION_CREATE_ROUTE_PATH, REGISTRATION_COUNT_ROUTE_PATH } from "../constants/registration";
import { GreetingResponseSchema, RegistrationCreateSchema, RegistrationResponseSchema, RegistrationCountResponseSchema } from "../schema";

export const api = {
  greeting: {
    get: {
      method: "GET",
      path: GREETING_ROUTE_PATH,
      responses: {
        200: GreetingResponseSchema,
      },
    },
  },
  registration: {
    create: {
      method: "POST",
      path: REGISTRATION_CREATE_ROUTE_PATH,
      body: RegistrationCreateSchema,
      responses: {
        201: RegistrationResponseSchema,
      },
    },
    count: {
      method: "GET",
      path: REGISTRATION_COUNT_ROUTE_PATH,
      responses: {
        200: RegistrationCountResponseSchema,
      },
    },
  },
} as const;
