/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LoginAuthDto } from './dto/login-auth.dto';
import { comparePassword } from 'src/utils/hash';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/modules/users/users.service';
import { RefreshTokenDto } from './dto/refresh-dto';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Role } from 'src/constants';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cloudinaryService: CloudinaryService,
    @InjectRedis() private readonly redis: Redis,
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
    return this.generateTokens(user.id, user.email, user.role, user.cart.id);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      return this.generateTokens(
        payload.sub,
        payload.username,
        payload.role,
        payload.cartId,
      );
    } catch (err) {
      console.log(err);
      throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
    }
  }

  private async generateTokens(
    userId: number,
    email: string,
    role: string,
    cartId: number,
  ) {
    const payload = { sub: userId, username: email, role, cartId };

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

  async loginWithGoogle(profile: any) {
    const { email, fullName, avatar } = profile;
    let user = await this.usersService.findByEmail(email).catch(() => null);

    if (!user) {
      user = await this.usersService.create({
        email,
        fullName,
        password: Math.random().toString(36).slice(-8),
        role: Role.User,
      });

      if (avatar) {
        try {
          const imageResponse = await axios.get(avatar, {
            responseType: 'arraybuffer',
          });
          const buffer = Buffer.from(imageResponse.data, 'binary');
          const uploaded = await this.cloudinaryService.uploadBuffer(buffer);
          if (uploaded?.secure_url) {
            await this.usersService.update(user.id, {
              avatar: uploaded.secure_url,
              publicId: uploaded.public_id,
              fullName,
              role: Role.User,
            });
          }
        } catch (err) {
          console.warn('Upload Google avatar failed:', err.message);
        }
      }
    }

    const cartId = user.cart?.id ?? null;
    return this.generateTokens(user.id, user.email, user.role, cartId);
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return null;
    return user;
  }
}
