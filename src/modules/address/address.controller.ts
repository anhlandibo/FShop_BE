import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AddressService } from './address.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { QueryDto } from 'src/dto/query.dto';
import { CreateAddressDto, UpdateAddressDto } from './dto';
import { ApiBearerAuth, ApiCreatedResponse, ApiNotFoundResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new address for the authenticated user'})
  @ApiCreatedResponse({description: 'Address created successfully'})
  @ApiNotFoundResponse({description: 'User not found'})
  create(@Req() req: Request, @Body() createAddressDto: CreateAddressDto) {
    const {id} = req['user'];
    return this.addressService.create(id, createAddressDto);
  }

  // @Roles(Role.Admin)
  // @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get all addresses (admin)' })
  @Get('all')
  findAll(@Query()query: QueryDto) {
    return this.addressService.findAll(query);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete address by ID' })
  delete(@Param('id') id: number) {
    return this.addressService.delete(id);
  }

  @UseGuards(AuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all addresses for the authenticated user' })
  getMyAddresses(@Req() req: Request) {
    const {id} = req['user'];
    return this.addressService.getMyAddresses(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update address by ID' })
  update(@Req() req: Request, @Param('id') id: number, @Body() updateAddressDto: UpdateAddressDto) {
    const {id: userId} = req['user'];
    return this.addressService.update(userId, id, updateAddressDto);
  }

  @UseGuards(AuthGuard)
  @Get(':addressId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get address by ID' })
  getAddress(@Req() req: Request, @Param('addressId') addressId: number) {
    const {id} = req['user'];
    console.log(id)
    return this.addressService.getAddressById(id, addressId);
  }
}
