import { z } from "zod";
import type { GreetingResponse } from "./types/greeting";

export const GreetingResponseSchema: z.ZodType<GreetingResponse> = z.object({
  message: z.string(),
});

export const RegistrationCreateSchema = z.object({
  name: z.string().min(1, "请输入姓名"),
  phone: z.string().regex(/^\d{11}$/, "请输入正确的手机号"),
  company: z.string().min(1, "请输入公司名称"),
  title: z.string().min(1, "请输入职位"),
  attendees: z.number().int().min(1, "至少1人").max(10, "最多10人"),
  notes: z.string().optional(),
});

export type RegistrationCreate = z.infer<typeof RegistrationCreateSchema>;

export const RegistrationResponseSchema = z.object({
  id: z.number(),
  ticketNo: z.string(),
});

export const RegistrationCountResponseSchema = z.object({
  count: z.number(),
});
