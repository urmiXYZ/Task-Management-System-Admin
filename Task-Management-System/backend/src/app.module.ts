import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { User } from './user/entities/user.entity';
import { Role } from './user/entities/role.entity';
import { PasswordResetRequest } from './user/entities/password-reset-request.entity'; 
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { UserService } from './user/user.service';
import { UserController } from './user/user.controller';
import { RequestUser } from './user/entities/request-user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'root',
      database: 'task_management',
      entities: [User, Role, PasswordResetRequest,RequestUser], 
      synchronize: true,
    }),
    AuthModule,
    UserModule,
    AdminModule,
  ],
})
export class AppModule {}
