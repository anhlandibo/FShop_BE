/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// strategies/jwt-access.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

const cookieExtractor = (req: Request) => req?.cookies?.['access_token'] || null;

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(JwtStrategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(), // fallback cho Swagger/thử nghiệm
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // payload = { sub, username, role, cartId, ... }
    console.log(payload)
    return {
      id: payload.sub,          
      username: payload.username,
      role: payload.role,
      cartId: payload.cartId,
    };
  }
}
