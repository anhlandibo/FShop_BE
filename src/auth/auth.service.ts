import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LoginAuthDto } from './dto/login-auth.dto';
import { UsersService } from 'src/users/users.service';
import { comparePassword } from 'src/utils/hash';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) { }
  async login(loginAuthDto: LoginAuthDto) {
    const { email, password } = loginAuthDto
    const user = await this.usersService.findByEmail(email)
    const isMatch = await comparePassword(password, user.password)
    if (isMatch)
      return user
    throw new HttpException("Bad credential", HttpStatus.UNAUTHORIZED)
  }
}
