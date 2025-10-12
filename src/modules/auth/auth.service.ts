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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cloudinaryService: CloudinaryService,
    @InjectRedis() private readonly redis: Redis,
  ) { }

  private readonly REFRESH_PREFIX = 'rt' // key: rt:{userId}:{jti}
  private readonly ACCESS_DENY_PREFIX = 'at:deny'

  private async storeRefreshJti(userId: number, jti: string, ttlSeconds: number) {
    const key = `${this.REFRESH_PREFIX}:${userId}:${jti}`;
    await this.redis.set(key, 1, 'EX', ttlSeconds);
    return key;
  }

  private async existsRefreshJti(userId: number, jti: string) {
    const key = `${this.REFRESH_PREFIX}:${userId}:${jti}`;
    return (await this.redis.exists(key)) === 1;
  }

  private async revokeRefreshJti(userId: number, jti: string) {
    const key = `${this.REFRESH_PREFIX}:${userId}:${jti}`;
    await this.redis.del(key);
  }

  private getTokenExpSeconds(expiresIn: string | number): number {
    if (typeof expiresIn === 'number') return expiresIn;
    const m = /^(\d+)([smhd])$/.exec(expiresIn);
    if (!m) return 0;
    const n = parseInt(m[1], 10);
    switch (m[2]) {
      case 's': return n;
      case 'm': return n * 60;
      case 'h': return n * 3600;
      case 'd': return n * 86400;
      default: return 0;
    }
  }

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

      const { sub: userId, username, role, cartId, jti } = payload as {
        sub: number; username: string; role: string; cartId: number; jti: string;
      };

      // 1) Kiểm tra refresh jti còn trong allowlist không
      const ok = await this.existsRefreshJti(userId, jti);
      if (!ok) {
        throw new HttpException('Refresh token revoked', HttpStatus.UNAUTHORIZED);
      }

      // 2) Rotation: revoke jti cũ trước khi cấp mới
      await this.revokeRefreshJti(userId, jti);

      // 3) Cấp mới (generateTokens sẽ tạo jti mới và lưu vào Redis)
      return this.generateTokens(userId, username, role, cartId);
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

    const accessExpires = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m';
    const refreshExpires = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

    const access_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: accessExpires
    });

    const jtiRefresh = randomUUID();
    const refresh_payload = { ...payload, jti: jtiRefresh };
    const refresh_token = await this.jwtService.signAsync(refresh_payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpires
    });

    // Lưu allowlist jti refresh
    const ttl = this.getTokenExpSeconds(refreshExpires);
    await this.storeRefreshJti(userId, jtiRefresh, ttl);

    return { access_token, refresh_token };
  }

  async logout (refreshToken: string | undefined, req: Request) {
    if (refreshToken) {
      try {
        const payload = await this.jwtService.verifyAsync(refreshToken, {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        });
        const { sub: userId, jti } = payload as { sub: number; jti: string };
        await this.revokeRefreshJti(userId, jti);
      } catch {
        // token hỏng/expired -> coi như đã logout
      }
    }
  } 

  async logoutAll(userId: number) {
    const pattern = `${this.REFRESH_PREFIX}:${userId}:*`;
    let cursor = '0';
    do {
      const [next, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', '100');
      cursor = next;
      if (keys.length) await this.redis.del(...keys);
    } while (cursor !== '0');
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
            await this.usersRepository.update(user.id, {
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

  async getMyProfile(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }
}
