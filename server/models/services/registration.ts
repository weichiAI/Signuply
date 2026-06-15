import { getDataSource } from "../../db";
import { RegistrationRepository } from "../repositories/registration";
import type { RegistrationCreate } from "../../../shared/schema";

export class RegistrationService {
  private async getRepository(): Promise<RegistrationRepository> {
    const [Registration, EventSettings] = await Promise.all([
      import("../entities/Registration"),
      import("../entities/EventSettings"),
    ]);
    const ds = await getDataSource({ entities: [Registration.Registration, EventSettings.EventSettings] });
    return new RegistrationRepository(ds);
  }

  async register(data: RegistrationCreate): Promise<{ id: number; ticketNo: string }> {
    const repo = await this.getRepository();
    const registration = await repo.create(data);
    const ticketNo = `EVT-${String(registration.id).padStart(6, "0")}`;
    return { id: registration.id, ticketNo };
  }

  async getCount(): Promise<number> {
    const repo = await this.getRepository();
    return repo.count();
  }

  async getAll() {
    const repo = await this.getRepository();
    return repo.findAll();
  }
}

export const registrationService = new RegistrationService();
