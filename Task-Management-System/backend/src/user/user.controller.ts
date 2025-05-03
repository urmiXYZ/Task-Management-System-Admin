import {
  Controller,
  Get,
  Headers,
  Put,
  Body,
  Req,
  UseGuards,
  Post,
  UploadedFile,
  UseInterceptors,
  Param
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { SignupDto } from './dto/signup.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}


  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Req() req) {
    return this.userService.findById(req.user.userId);
  }

  
  @UseGuards(AuthGuard('jwt'))
  @Put('profile')
  updateProfile(@Req() req, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.userId, dto);
  }


  @UseGuards(AuthGuard('jwt'))
  @Put('profile/password')
  changePassword(@Req() req, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(req.user.userId, dto);
  }


  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    const link = await this.userService.requestPasswordReset(body.email);
    return { message: link };
  }


  @Put('reset-password')
  async resetPassword(
    @Headers('reset-token') token: string,
    @Body() body: { newPassword: string }
  ) {
    const result = await this.userService.resetPassword(token, body.newPassword);
    return { message: result };
  }


  @UseGuards(AuthGuard('jwt'))
  @Post('profile/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${Math.round(
            Math.random() * 1e9,
          )}.${file.originalname.split('.').pop()}`;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Req() req) {
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.userService.updateAvatar(req.user.userId, avatarUrl);
  }


  @Post('verify-email')
  async verifyEmail(@Body() verifyDto: VerifyEmailDto) {
    return this.userService.verifyEmail(verifyDto);
  }


  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    return this.userService.signup(signupDto.name, signupDto.email, signupDto.password);
  }

  @Post('resend-verification-token')
async resendVerificationToken(@Body() body: { email: string }) {
  return this.userService.regenerateVerificationToken(body.email);
}



  @Put('approve/:userId')
  @UseGuards(AuthGuard('jwt'), RolesGuard) 
@Roles('admin') 
  async approveUser(
    @Param('userId') userId: number,
    @Body() body: { role: string } 
  ) {
    return this.userService.approveUser(userId, body.role);
  }

  
}
