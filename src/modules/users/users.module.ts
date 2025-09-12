import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { CartsModule } from '../carts/carts.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), CloudinaryModule, CartsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
