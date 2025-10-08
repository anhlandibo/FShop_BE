import { ConfigService } from '@nestjs/config';

export const getGoogleConfig = (configService: ConfigService) => ({
  clientId: configService.get<string>('GOOGLE_CLIENT_ID'),
  clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
  callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
});
