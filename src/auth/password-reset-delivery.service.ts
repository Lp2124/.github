import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { AppConfig } from '../config/env';

@Injectable()
export class PasswordResetDeliveryService {
  private readonly transporter;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {
    this.transporter = nodemailer.createTransport({
      host: configService.get('smtpHost', { infer: true }),
      port: configService.get('smtpPort', { infer: true }),
      secure: configService.get('smtpSecure', { infer: true }),
      requireTLS: !configService.get('smtpSecure', { infer: true }),
      tls: { rejectUnauthorized: true, minVersion: 'TLSv1.2' },
      auth: {
        user: configService.get('smtpUser', { infer: true }),
        pass: configService.get('smtpPassword', { infer: true }),
      },
    });
  }

  async send(email: string, token: string): Promise<void> {
    const resetUrl = new URL(this.configService.get('passwordResetUrl', { infer: true }));
    resetUrl.searchParams.set('token', token);
    await this.transporter.sendMail({
      from: this.configService.get('smtpFrom', { infer: true }),
      to: email,
      subject: 'Reset your password',
      text: `Use this link to reset your password (valid for 15 minutes): ${resetUrl.toString()}`,
    });
  }
}
