import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, UseGuards, Query, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { Roles } from 'src/decorators/role.decorator';
import { Role } from 'src/constants/role.enum';
import { RolesGuard } from 'src/guards/roles.guard';
import { QueryDto } from 'src/dto/query.dto';
import { Request } from 'express';
import { DeleteUsersDto } from 'src/modules/users/dto/delete-users.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @UseInterceptors(FileInterceptor('avatar'))
  create(@Body() createUserDto: CreateUserDto, @UploadedFile() file?: Express.Multer.File) {
    return this.usersService.create(createUserDto, file);
  }
  @Post('create-multiple')
  createMultiple(@Body() createUsersDto: CreateUserDto[]) {
    return this.usersService.createMany(createUsersDto);
  }

  // @Roles(Role.Admin)
  // @UseGuards(AuthGuard)
  @Get()
  findAll(@Query() query: QueryDto, @Req() request: Request) {
    console.log(request.cookies);
    return this.usersService.findAll(query);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('avatar'))
  update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto, @UploadedFile() file?: Express.Multer.File) {
    return this.usersService.update(id, updateUserDto, file);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.usersService.remove(id);
  }


  @Post('remove-mutiple')
  removeMutil(@Body() deleteUsersDto: DeleteUsersDto) {
    return this.usersService.removeUsers(deleteUsersDto);
  }

}
