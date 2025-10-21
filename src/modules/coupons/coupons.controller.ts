import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { QueryDto } from 'src/dto/query.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { RedeemCouponDto } from './dto/redeem-coupon.dto';

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

  @Post('validate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate coupon' })
  validate(@Req() req: Request, @Body() validateCouponDto: ValidateCouponDto) {
    const { id } = req['user'];
    return this.couponsService.validate(validateCouponDto.code, id);
  }

  @Post('apply')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply coupon' })
  apply(@Req() req: Request, @Body() dto: ApplyCouponDto) {
    const { id } = req['user'];
    return this.couponsService.apply(dto.code, dto.orderId, id);
  }

  @Post('redeem')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate coupon' })
  redeem(@Req() req: Request, @Body() dto: RedeemCouponDto) {
    const { id } = req['user'];
    return this.couponsService.redeem(dto.code, dto.orderId, id);
  }
}
