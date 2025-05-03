import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ManageUserModule } from './manage-user/manage-user.module'; 
import { User } from './user/entities/user.entity';
import { Role } from './user/entities/role.entity';
import { PasswordResetRequest } from './user/entities/password-reset-request.entity';
import { RequestUser } from './user/entities/request-user.entity';
import { Category } from './category/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'root',
      database: 'task_management',
      entities: [
        User,
        Role,
        PasswordResetRequest,
        RequestUser,
        Category,
      ],
      synchronize: true,
    }),
    AuthModule,
    UserModule,
    CategoryModule,
    DashboardModule,
    ManageUserModule, 
  ],
})
export class AppModule {}
