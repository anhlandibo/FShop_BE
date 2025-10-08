/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Post, Body, Res, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { Response } from 'express';
import { RefreshTokenDto } from './dto/refresh-dto';
import { ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Auth } from './entities/auth.entity';

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
  @UseGuards(AuthGuard('jwt-refresh'))
  @ApiOperation({summary: 'Refresh access token'})
  @ApiUnauthorizedResponse({description: 'Error while refresh token'})
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiOperation({summary: 'Get user information'})
  me(@Req() req: Request){
    return req['user'];
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Login with Google' })
  // eslint-disable-next-line @typescript-eslint/require-await
  async googleAuth() {
    return;
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth2 callback' })
  async googleAuthRedirect(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.loginWithGoogle(req['user']);

    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: 'Login with Google successful',
      ...tokens,
    };
  }



}
