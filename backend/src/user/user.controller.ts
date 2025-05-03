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
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ✅ Get logged-in user's profile
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
    return this.userService.findById(req.user.userId);
  }

  // ✅ Update profile details
  @UseGuards(JwtAuthGuard)
  @Put('profile')
  updateProfile(@Req() req, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.userId, dto);
  }

  // ✅ Change password
  @UseGuards(JwtAuthGuard)
  @Put('profile/password')
  changePassword(@Req() req, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(req.user.userId, dto);
  }

  // ✅ Request password reset link
@Post('forgot-password')
async forgotPassword(@Body() body: { email: string }) {
  const result = await this.userService.requestPasswordReset(body.email);

  return {
    message: result.message,
    previewLink: result.previewLink,
  };
}
  
  // ✅ Reset password using token
  @Put('reset-password')
  async resetPassword(
    @Headers('reset-token') token: string,
    @Body() body: { newPassword: string }
  ) {
    const result = await this.userService.resetPassword(token, body.newPassword);
    return { message: result };
  }

  // ✅ Upload and update profile picture
  @UseGuards(JwtAuthGuard)
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




  
}
