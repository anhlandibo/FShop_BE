import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { QueryDto } from 'src/dto/query.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  create(@Body() createCouponDto: CreateCouponDto) {
    return this.couponsService.create(createCouponDto);
  }

  @Get('all')
  getAll(@Query() query: QueryDto) {
    return this.couponsService.getAll(query);
  }

  @Get(':id')
  getById(@Param('id') id: number) {
    return this.couponsService.getById(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateCouponDto: UpdateCouponDto) {
    return this.couponsService.update(id, updateCouponDto);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.couponsService.delete(id);
  }
}
