/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Post, Body, Res, Get, Req, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { Response } from 'express';
import { RefreshTokenDto } from './dto/refresh-dto';
import { ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Auth } from './entities/auth.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
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
  //@UseGuards(AuthGuard('jwt-refresh'))
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiUnauthorizedResponse({ description: 'Error while refresh token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshTokenFromCookie = (req as any).cookies?.['refresh_token'] as string | undefined;
    if (!refreshTokenFromCookie) throw new HttpException('Refresh token not found', HttpStatus.UNAUTHORIZED);
    const tokens = await this.authService.refresh(refreshTokenFromCookie);

    // rotation xong → set cookie mới
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

    return tokens;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiOperation({ summary: 'Get user information' })
  me(@Req() req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    const {id} = req['user'];
    return this.authService.getMyProfile(id);
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

  @Post('logout')
  @UseGuards(AuthGuard('jwt')) 
  @ApiOperation({ summary: 'Logout current session' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = (req as any).cookies?.['refresh_token'] as string | undefined;
    await this.authService.logout(refreshToken, req);
    res.clearCookie('access_token', { httpOnly: true, sameSite: 'lax', secure: false, path: '/' });
    res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'lax', secure: false, path: '/' });
    return { message: 'Logged out', timestamp: new Date().toISOString() };
  }

  @Post('logout-all')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Logout all sessions of current user' })
  async logoutAll(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = (req as any).user as { sub: number };
    await this.authService.logoutAll(user.sub);
    res.clearCookie('access_token', { httpOnly: true, sameSite: 'lax', secure: false });
    res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'lax', secure: false });
    return { message: 'Logged out from all devices' };
  }

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Change password' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async changePassword(@Req() req: Request, @Body() changePasswordDto: ChangePasswordDto) {
    const { id } = req['user'];
    return this.authService.changePassword(id, changePasswordDto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Step 1: Request password reset email' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Step 2: Submit new password with token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }


}
