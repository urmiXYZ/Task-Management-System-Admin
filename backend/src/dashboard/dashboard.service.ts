import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Role } from 'src/user/entities/role.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async getOverview() {
    const totalUsers = await this.userRepository.count();
    const totalManagers = await this.userRepository.count({ where: { role: { name: 'manager' } } });
    const totalMembers = await this.userRepository.count({ where: { role: { name: 'employee' } } });
    const totalClients = await this.userRepository.count({ where: { role: { name: 'client' } } });
    const totalAdmins = await this.userRepository.count({ where: { role: { name: 'admin' } } });

    const assignedUsers = totalManagers + totalMembers;
    const totalAssignable = totalUsers - totalAdmins - totalClients;
    const assignedPercentage = totalAssignable > 0 ? ((assignedUsers / totalAssignable) * 100).toFixed(2) : '0.00';

    const totalProjects = 50;
    const runningProjects = 20;
    const completedProjects = 25;
    const pendingProjects = 5;
    const projectCompletionRate = ((completedProjects / totalProjects) * 100).toFixed(2);

    const recentActivities = [
      'Manager A created Project Alpha',
      'Member B completed Task X',
      'Client C commented on Task Y',
    ];

    const personalTaskList = [
      { id: 1, title: 'Review new project requests', completed: false },
      { id: 2, title: 'Approve user role changes', completed: true },
    ];

    const shortcuts = [
      { label: 'View Logs', path: '/admin/logs' },
      { label: 'Create New Category', path: '/admin/categories/create' },
    ];

    return {
      userStats: {
        total: totalUsers,
        managers: totalManagers,
        members: totalMembers,
        clients: totalClients,
        admins: totalAdmins,
        assignedUsersRate: `${assignedPercentage}%`,
      },
      projectStats: {
        total: totalProjects,
        running: runningProjects,
        completed: completedProjects,
        pending: pendingProjects,
        completionRate: projectCompletionRate,
      },
      recentActivities,
      personalTaskList,
      shortcuts,
    };
  }
}
