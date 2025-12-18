import { ConfigService } from '@nestjs/config';
import { MailerOptions } from '@nestjs-modules/mailer';

export const getMailConfig = (configService: ConfigService): MailerOptions => {
  return {
    transport: {
      host: configService.get<string>('MAIL_HOST'),
      port: configService.get<number>('MAIL_PORT'),
      secure: false, // false cho port 587 (STARTTLS)
      requireTLS: true, // Bắt buộc dùng TLS cho Gmail
      auth: {
        user: configService.get<string>('MAIL_USER'),
        pass: configService.get<string>('MAIL_PASSWORD'),
      },
      tls: {
        // Không reject unauthorized certificates (dùng cho dev)
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000, // 10s timeout
      greetingTimeout: 10000, // 10s greeting timeout
    },
    defaults: {
      from: configService.get<string>('MAIL_FROM'),
    },
  };
};