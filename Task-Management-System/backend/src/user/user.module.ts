import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { Role } from './entities/role.entity';
import { PasswordResetRequest } from './entities/password-reset-request.entity';
import { RequestUser } from './entities/request-user.entity';


@Module({
  imports: [TypeOrmModule.forFeature([User,Role, PasswordResetRequest,  RequestUser])],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
