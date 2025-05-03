import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { User } from '../../user/entities/user.entity';
import { Role } from '../../user/entities/role.entity';
import { PasswordResetRequest } from '../../user/entities/password-reset-request.entity';
import { RequestUser } from '../../user/entities/request-user.entity';
@Module({
  imports: [TypeOrmModule.forFeature([User, Role,PasswordResetRequest,RequestUser,])], 
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
