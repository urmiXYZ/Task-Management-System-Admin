// email.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'wilfrid.bartell@ethereal.email',
        pass: 'wPawbjUnbCBaaXfV4d',
      },
    });
  }

  async sendPasswordResetEmail(to: string, resetLink: string): Promise<string> {
    const info = await this.transporter.sendMail({
      from: '"Task Manager" <no-reply@taskmanager.com>',
      to,
      subject: '🔐 Password Reset Request',
      html: `
        <p>You requested a password reset.</p>
        <p>Click <a href="${resetLink}">here</a> to reset your password.</p>
        <p>This link will expire in 1 hour.</p>
      `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('📨 Email sent. Preview it at:', previewUrl);
    }

    return previewUrl || ''; // Return preview link
  }
}
