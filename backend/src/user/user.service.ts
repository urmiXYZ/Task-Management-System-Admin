import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PasswordResetRequest } from './entities/password-reset-request.entity';
import * as crypto from 'crypto';
import * as moment from 'moment';
import { RequestUser } from './entities/request-user.entity';
import { Role } from './entities/role.entity';
import { EmailService } from '../email/email.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(PasswordResetRequest) private resetRequestRepo: Repository<PasswordResetRequest>,
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    @InjectRepository(RequestUser) private readonly requestUserRepository: Repository<RequestUser>,
    private readonly emailService: EmailService // 
  ) {}

  async findById(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(id: number, dto: UpdateProfileDto) {
    await this.userRepo.update(id, dto);
    return this.findById(id);
  }

  async changePassword(id: number, dto: ChangePasswordDto) {
    const user = await this.findById(id);

    if (dto.oldPassword !== user.password) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    await this.userRepo.update(id, { password: dto.newPassword });

    return { message: 'Password updated successfully' };
  }

  async updateAvatar(id: number, avatarUrl: string) {
    await this.userRepo.update(id, { avatarUrl });
    return this.findById(id);
  }

async requestPasswordReset(email: string) {
  const user = await this.userRepo.findOne({ where: { email } });
  if (!user) {
    throw new NotFoundException('User with this email not found');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = moment().add(1, 'hour').toDate();

  const resetRequest = this.resetRequestRepo.create({
    user,
    token,
    expiresAt,
  });
  await this.resetRequestRepo.save(resetRequest);

  const resetLink = `http://localhost:3000/reset-password?token=${token}`;

  const previewLink = await this.emailService.sendPasswordResetEmail(user.email, resetLink);

  return {
    message: `Password reset link has been sent to ${user.email}`,
    previewLink,
  };
}

  
  // ✅ Reset password using token
  async resetPassword(token: string, newPassword: string): Promise<string> {
    const resetRequest = await this.resetRequestRepo.findOne({
      where: { token },
      relations: ['user'],
    });
    if (!resetRequest) {
      throw new NotFoundException('Invalid or expired reset token');
    }
    if (moment().isAfter(resetRequest.expiresAt)) {
      throw new BadRequestException('Reset token has expired');
    }
    const user = resetRequest.user;
    user.password = newPassword;

    await this.userRepo.save(user);
    await this.resetRequestRepo.delete({ id: resetRequest.id });
    return 'Password has been reset successfully';
  }
 
  
}
