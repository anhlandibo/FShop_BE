import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LoginAuthDto } from './dto/login-auth.dto';
import { UsersService } from 'src/users/users.service';
import { comparePassword } from 'src/utils/hash';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) { }
  async login(loginAuthDto: LoginAuthDto) {
    // check credential
    const { email, password } = loginAuthDto
    const user = await this.usersService.findByEmail(email)
    const isMatch = await comparePassword(password, user.password)
    if (!isMatch)
      throw new HttpException("Bad credential", HttpStatus.UNAUTHORIZED)
    //generate JWT
    const payload = { sub: user.id, username: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
