import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async create(@Res({ passthrough: true }) response: Response, @Body() loginAuthDto: LoginAuthDto) {
    const result = await this.authService.login(loginAuthDto);
    response.cookie('access_token', result.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return result;
  }

}
