/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
// strategies/jwt-refresh.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

const refreshCookieExtractor = (req: Request) => req?.cookies?.['refresh_token'] || null;
// Hoặc nếu bạn muốn lấy từ body: dùng passport-custom, hoặc viết extractor đọc req.body.refreshToken

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(JwtStrategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        refreshCookieExtractor,
      ]),
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
      return {
      id: payload.sub,          
      username: payload.username,
      role: payload.role,
      cartId: payload.cartId,
    };
  }
}
