import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LoginAuthDto } from './dto/login-auth.dto';
import { comparePassword } from 'src/utils/hash';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/modules/users/users.service';

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
    const payload = { sub: user.id, username: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
