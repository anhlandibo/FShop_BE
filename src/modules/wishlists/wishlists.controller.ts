/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { WishlistsService } from './wishlists.service';
import { CreateWishlistsDto } from './dtos/create-wishlits.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiCreatedResponse, ApiNotFoundResponse, ApiConflictResponse } from '@nestjs/swagger';
import { QueryDto } from 'src/dto/query.dto';

@Controller('wishlists')
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my wishlists' })
  async getAll(@Req() req: Request) {
    const {id} = req['user'];
    return this.wishlistsService.getMyWishlists(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('toggle')
  @ApiOperation({ summary: 'Toggle wishlist item (add if not exists, remove if exists)' })
  async toggle(@Req() req: Request, @Body() createWishlistDto: CreateWishlistsDto) {
    const { id } = req['user'];
    return this.wishlistsService.toggle(id, createWishlistDto);
  }

  @Delete()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear all wishlist items for the authenticated user' })
  async removeAll(@Req() req: Request) {
    const { id } = req['user'];
    return this.wishlistsService.removeAll(id);
  }

}

