import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from 'src/user/entities/user.entity';

@Entity()
export class CreateCategoryDto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // Example: Work, Personal, Study

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @ManyToOne(() => User, { eager: true })
  createdBy: User; // Admin who created the category

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
