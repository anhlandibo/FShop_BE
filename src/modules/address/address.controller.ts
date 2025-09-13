import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AddressService } from './address.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { CreateAddressDto } from './dto/create-address.dto';
import { Roles } from 'src/decorators/role.decorator';
import { RolesGuard } from 'src/guards/roles.guard';
import { Role } from 'src/constants/role.enum';
import { QueryDto } from 'src/dto/query.dto';

@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Req() req: Request, @Body() createAddressDto: CreateAddressDto) {
    const {id} = req['user'];
    return this.addressService.create(id, createAddressDto);
  }

  // @Roles(Role.Admin)
  // @UseGuards(AuthGuard, RolesGuard)
  @Get('all')
  findAll(@Query()query: QueryDto) {
    return this.addressService.findAll(query);
  }
}
