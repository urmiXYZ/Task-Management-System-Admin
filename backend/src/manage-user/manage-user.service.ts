import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestUser } from '../user/entities/request-user.entity';
import { User } from '../user/entities/user.entity';
import { Role } from '../user/entities/role.entity';
import * as fastcsv from 'fast-csv';
import { Response } from 'express';

@Injectable()
export class ManageUserService {
  constructor(
    @InjectRepository(RequestUser) private requestUserRepo: Repository<RequestUser>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>
  ) {}

  async addUserFromRequest(id: number, roleName: 'manager' | 'employee') {
    const requestUser = await this.requestUserRepo.findOne({ where: { id } });
    if (!requestUser) throw new NotFoundException('Request user not found');

    const role = await this.roleRepo.findOne({ where: { name: roleName } });
    if (!role) throw new NotFoundException('Role not found');

    const user = this.userRepo.create({
      name: requestUser.name,
      email: requestUser.email,
      password: requestUser.password,
      role,
    });

    await this.userRepo.save(user);
    await this.requestUserRepo.delete({ id });

    return { message: `${roleName} added successfully`, user };
  }

  async getUsersByRole(roleName: string) {
    return this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('role.name = :roleName', { roleName })
      .getMany();
  }
  
  async searchUsers(term: string): Promise<User[]> {
    if (!term) {
      throw new BadRequestException('Search term is required');
    }
  
    const isNumeric = /^\d+$/.test(term); // checks if term is a number
  
    const query = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role');
  
    if (isNumeric) {
      query.where('CAST(user.id AS TEXT) = :term', { term });
    } else {
      query.where('user.name ILIKE :term', { term: `%${term}%` });
    }
  
    return query.getMany();
  }
  
  
  async filterUsersByDate(startDate: string, endDate: string): Promise<User[]> {
    if (!startDate || !endDate) {
      throw new BadRequestException('Both startDate and endDate are required');
    }
  
    return this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.createdAt BETWEEN :start AND :end', {
        start: new Date(startDate),
        end: new Date(endDate),
      })
      .getMany();
  }
  
  async exportAllUsersToCSV(res: Response): Promise<void> {
    const users = await this.userRepo.find({
      relations: ['role'],
      order: { id: 'ASC' }, // Sort by ID ascending
    });
  
    const data = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role?.name || 'Unknown', // Ensure role is shown
      createdAt: user.createdAt.toLocaleString('en-BD'),
      updatedAt: user.updatedAt.toLocaleString('en-BD'),
    }));
  
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=all-users.csv');
  
    const csvStream = fastcsv.format({ headers: true });
    csvStream.pipe(res);
    data.forEach(row => csvStream.write(row));
    csvStream.end();
  }

  async exportUsersByRoleToCSV(roleName: string, res: Response): Promise<void> {
    const users = await this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('role.name = :roleName', { roleName })
      .getMany();

    const data = users.map(user => ({
      ID: user.id,
      Name: user.name,
      Email: user.email,
      Role: user.role?.name || 'N/A',
      CreatedAt: user.createdAt.toISOString(),
      UpdatedAt: user.updatedAt.toISOString(),
    }));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${roleName}-users.csv`);

    const csvStream = fastcsv.format({ headers: true });
    csvStream.pipe(res);
    data.forEach(row => csvStream.write(row));
    csvStream.end();
  }
  
  
}
