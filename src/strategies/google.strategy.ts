/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject('GOOGLE_CONFIG') private googleConfig: any,
  ) {
    super({
      clientID: googleConfig.clientId,
      clientSecret: googleConfig.clientSecret,
      callbackURL: googleConfig.callbackURL,
      scope: ['email', 'profile'],
    });
    
    console.log('[Google OAuth] callbackURL =', googleConfig.callbackURL);

  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    try {
      const { name, emails, photos } = profile;
      if (!emails || emails.length === 0) {
        throw new HttpException('Google account has no email', HttpStatus.UNAUTHORIZED);
      }

      const user = {
        email: emails[0].value,
        fullName: `${name.givenName} ${name.familyName}`,
        avatar: photos?.[0]?.value ?? null,
        provider: 'google',
        accessToken,
      };

      done(null, user);
    }
    catch (err) {
      done(err, null);
    }
  }
}
