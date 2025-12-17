/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateStockInDto } from './dto/create-stock-in.dto';
import { StockLogQueryDto } from './dto/stock-log-query.dto';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/role.decorator';
import { Role } from '../../constants/role.enum';
import { Request } from 'express';

@ApiTags('Stock Management')
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('in')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Import stock for multiple variants (Admin only)' })
  @ApiResponse({ status: 201, description: 'Stock imported successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  createStockIn(@Req() req: any, @Body() createStockInDto: CreateStockInDto) {
    const { id } = req['user'];
    return this.stockService.createStockIn(createStockInDto, id);
  }

  @Get('logs')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Get all stock logs with filtering (Admin only)' })
  @ApiResponse({ status: 200, description: 'Stock logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  getStockLogs(@Query() query: StockLogQueryDto) {
    return this.stockService.getStockLogs(query);
  }

  @Get('logs/:variantId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Get stock logs for a specific variant (Admin only)',
  })
  @ApiResponse({ status: 200, description: 'Variant stock logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  getStockLogsByVariant(
    @Param('variantId') variantId: number,
    @Query() query: StockLogQueryDto,
  ) {
    return this.stockService.getStockLogsByVariant(variantId, query);
  }

  @Get('summary/:variantId')
  @ApiOperation({ summary: 'Get stock summary for a variant' })
  @ApiResponse({ status: 200, description: 'Stock summary retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  getStockSummary(@Param('variantId') variantId: number) {
    return this.stockService.getStockSummary(variantId);
  }
}
