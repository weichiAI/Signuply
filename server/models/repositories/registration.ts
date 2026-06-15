import type { DataSource, Repository as TypeORMRepo } from "typeorm";
import { Registration } from "../entities/Registration";
import type { RegistrationCreate } from "../../../shared/schema";

export class RegistrationRepository {
  constructor(private readonly dataSource: DataSource) {}

  private get repo(): TypeORMRepo<Registration> {
    return this.dataSource.getRepository(Registration);
  }

  async create(data: RegistrationCreate): Promise<Registration> {
    const registration = this.repo.create(data);
    return this.repo.save(registration);
  }

  async count(): Promise<number> {
    return this.repo.count();
  }

  async findAll(): Promise<Registration[]> {
    return this.repo.find({ order: { createdAt: "DESC" } });
  }
}
