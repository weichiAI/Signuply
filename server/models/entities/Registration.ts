import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("registrations")
export class Registration {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "varchar" })
  phone!: string;

  @Column({ type: "varchar" })
  company!: string;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "integer" })
  attendees!: number;

  @Column({ type: "varchar", nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
