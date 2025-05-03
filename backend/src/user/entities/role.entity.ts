import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: 'admin' | 'manager' | 'employee' | 'client';

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
