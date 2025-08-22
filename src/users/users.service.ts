import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(private configService: ConfigService) { }
  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    // get an environment variable
    const dbUser = this.configService.get<string>('DATABASE_USER');
    // get a custom configuration value
    const dbHost = this.configService.get<string>('DATABASE_PASSWORD');
    console.log(dbUser, dbHost);
    return {
      dbUser,
      dbHost,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
