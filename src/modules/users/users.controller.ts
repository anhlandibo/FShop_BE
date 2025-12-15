/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, UseGuards, Query, Req, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { Roles } from 'src/decorators/role.decorator';
import { Role } from 'src/constants/role.enum';
import { RolesGuard } from 'src/guards/roles.guard';
import { QueryDto } from 'src/dto/query.dto';
import { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateUserDto, UpdateUserDto, DeleteUsersDto } from './dto';
import { ApiConflictResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOperation } from '@nestjs/swagger';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { log } from 'console';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({description: 'User created successfully'})
  @ApiConflictResponse({description: 'User already exists'})
  create(@Body() createUserDto: CreateUserDto, @UploadedFile() file?: Express.Multer.File) {
    return this.usersService.create(createUserDto, file);
  }
  
  @Post('create-multiple')
  @ApiOperation({ summary: 'Create multiple users' })
  createMultiple(@Body() createUsersDto: CreateUserDto[]) {
    return this.usersService.createMany(createUsersDto);
  }

  // @Roles(Role.Admin)
  // @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  findAll(@Query() query: QueryDto, @Req() request: Request) {
    console.log(request.cookies);
    return this.usersService.findAll(query);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Update user' })
  @ApiNotFoundResponse({description: 'User not found'})
  update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto, @UploadedFile() file?: Express.Multer.File) {
    return this.usersService.update(id, updateUserDto, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiNotFoundResponse({description: 'User not found'})
  remove(@Param('id') id: number) {
    return this.usersService.remove(id);
  }

  @Post('remove-mutiple')
  @ApiOperation({ summary: 'Delete many users' })
  @ApiNotFoundResponse({description: 'User not found'})
  removeMutil(@Body() deleteUsersDto: DeleteUsersDto) {
    return this.usersService.removeUsers(deleteUsersDto);
  }

  @Patch('profile') 
  @UseGuards(AuthGuard) 
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Update current user profile (fullName, avatar)' })
  @ApiCreatedResponse({ description: 'Profile updated successfully' })
  updateProfile(
    @Req() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const { id } = req['user']
    return this.usersService.updateProfile(id, updateProfileDto, file);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.register(createUserDto);
  }

  @Get('verify') 
  @ApiOperation({ summary: 'Verify email via link click' })  
  async verifyEmail(
    @Query('token') token: string,
  ) { 
    try {
      await this.usersService.verifyEmail(token);
    } catch (error) {
      log('Email verification error:', error);
    }
  }

}
