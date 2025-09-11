/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LoginAuthDto } from './dto/login-auth.dto';
import { comparePassword } from 'src/utils/hash';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/modules/users/users.service';
import { RefreshTokenDto } from './dto/refresh-dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  async login(loginAuthDto: LoginAuthDto) {
    // check credential
    const { email, password } = loginAuthDto;
    const user = await this.usersService.findByEmail(email);
    if (!user)
      throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch)
      throw new HttpException('Bad credential', HttpStatus.UNAUTHORIZED);
    //generate JWT
    return this.generateTokens(user.id, user.email, user.role);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      return this.generateTokens(payload.sub, payload.username, payload.role);
    } catch(err) {
      console.log(err)
      throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
    }
  }

  private async generateTokens(userId: number, email: string, role: string) {
    const payload = { sub: userId, username: email, role };

    const access_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn:
        this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m',
    });

    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn:
        this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    return { access_token, refresh_token };
  }
}
