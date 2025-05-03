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
import {VerifyEmailDto } from './dto/verify-email.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(PasswordResetRequest) private resetRequestRepo: Repository<PasswordResetRequest>,
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    @InjectRepository(RequestUser)private readonly requestUserRepository: Repository<RequestUser>
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

  // New: Forgot Password Request
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

    return {
      message: 'Password reset requested',
      resetToken: token, 
    };
  }

  // New: Reset Password
  async resetPassword(token: string, newPassword: string) {
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

    // After successful reset, delete the reset request
    await this.resetRequestRepo.delete({ id: resetRequest.id });

    return { message: 'Password has been reset successfully' };
  }


  // Outsider user signup (register in request table)

  async signup(name: string, email: string, password: string) {
    const existingUser = await this.requestUserRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('Email already in use');
    }
  
    const verificationToken = crypto.randomBytes(20).toString('hex'); // generate random token
  
    const newUser = this.requestUserRepository.create({
      name,
      email,
      password,
      verificationToken,
    });
  
    await this.requestUserRepository.save(newUser);
  
    // Ideally send an email with token link, but for now just return the token
    return { message: 'User successfully registered. Please verify your email.', token: verificationToken };
  }
  

  async verifyEmail(verifyDto: VerifyEmailDto) {
    const { email, token } = verifyDto;
  
    const user = await this.requestUserRepository.findOne({ where: { email } });
  
    if (!user) {
      throw new Error('User not found');
    }
  
    // Check the token
    if (!user.verificationToken || user.verificationToken !== token) {
      throw new Error('Invalid token');
    }
  
    // Mark the user as verified
    if (user.isVerified) {
      throw new Error('User already verified');
    }
  
    user.isVerified = true;
  
    user.verificationToken = '';
  
    await this.requestUserRepository.save(user);
  
    return { message: 'Email successfully verified. Please wait for admin approval.' };
  }
  
  
  async regenerateVerificationToken(email: string) {
    const user = await this.requestUserRepository.findOne({ where: { email } });
  
    if (!user) {
      throw new Error('User not found');
    }
  
    if (user.isVerified) {
      throw new Error('User already verified');
    }
  
    // Generate a new random token
    const newToken = crypto.randomBytes(20).toString('hex'); // Generates a secure random token
  
    user.verificationToken = newToken;
    await this.requestUserRepository.save(user);
  
    return {
      message: 'A new verification token has been generated.',
      newToken, // (In real life, don't return it in API — send via email!)
    };
  }
  
  
  

// Admin approve user and assign role
async approveUser(userId: number, role: string) {
  const requestUser = await this.requestUserRepository.findOne({ where: { id: userId } });
  if (!requestUser || !requestUser.isVerified) {
    throw new Error('User is not verified or not found');
  }

  const validRoles = ['admin', 'manager', 'employee', 'client'] as const;

  if (!validRoles.includes(role as any)) {
    throw new Error('Invalid role');
  }


  const userRole = await this.roleRepository.findOne({ where: { name: role as typeof validRoles[number] } });

  if (!userRole) {
    throw new Error('Role not found');
  }
    // Create a new user entry and assign role
    const approvedUser = this.userRepo.create({
      name: requestUser.name,
      email: requestUser.email,
      password: requestUser.password,  
      role: userRole,  
    });
    

    await this.userRepo.save(approvedUser); 


    // Remove from request_users table as they are now moved to main users
    await this.requestUserRepository.remove(requestUser);

    return { message: `User approved and assigned role ${role}` };
  }
}
