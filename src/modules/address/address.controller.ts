import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AddressService } from './address.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { QueryDto } from 'src/dto/query.dto';
import { CreateAddressDto, UpdateAddressDto } from './dto';

@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @UseGuards(AuthGuard)
  @Post()
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

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.addressService.delete(id);
  }

  @UseGuards(AuthGuard)
  @Get()
  getMyAddresses(@Req() req: Request) {
    const {id} = req['user'];
    return this.addressService.getMyAddresses(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Req() req: Request, @Param('id') id: number, @Body() updateAddressDto: UpdateAddressDto) {
    const {id: userId} = req['user'];
    return this.addressService.update(userId, id, updateAddressDto);
  }

  @UseGuards(AuthGuard)
  @Get(':addressId')
  getAddress(@Req() req: Request, @Param('addressId') addressId: number) {
    const {id} = req['user'];
    console.log(id)
    return this.addressService.getAddressById(id, addressId);
  }
}
