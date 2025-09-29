/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Post, Body, Res, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { Response } from 'express';
import { RefreshTokenDto } from './dto/refresh-dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiUnauthorizedResponse({description: 'Invalid email or password'})
  async login(@Res({ passthrough: true }) response: Response, @Body() loginAuthDto: LoginAuthDto) {
    const result = await this.authService.login(loginAuthDto);
    response.cookie('access_token', result.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    response.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return result;
  }

  @Post('refresh')
  @ApiOperation({summary: 'Refresh access token'})
  @ApiUnauthorizedResponse({description: 'Error while refresh token'})
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  @ApiOperation({summary: 'Get user information'})
  me(@Req() req: Request){
    return req['user'];
  }

}
