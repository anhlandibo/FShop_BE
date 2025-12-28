/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/role.decorator';
import { Role } from 'src/constants/role.enum';
import {
  DashboardQueryDto,
  DateRange,
  OverviewResponseDto,
  RevenueDataDto,
  OrderStatusDataDto,
  TopProductDto,
  RecentOrderDto,
  HomePageStatsDto,
} from './dto';

@Controller('admin/dashboard')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Admin)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  async getOverview(
    @Query() query: DashboardQueryDto,
  ): Promise<OverviewResponseDto> {
    const range = query.range || DateRange.THIRTY_DAYS;
    return this.dashboardService.getOverview(range);
  }

  @Get('revenue')
  async getRevenue(
    @Query() query: DashboardQueryDto,
  ): Promise<RevenueDataDto[]> {
    const range = query.range || DateRange.THIRTY_DAYS;
    return this.dashboardService.getRevenue(range);
  }

  @Get('/orders/order-status')
  async getOrderStatus(
    @Query() query: DashboardQueryDto,
  ): Promise<OrderStatusDataDto[]> {
    const range = query.range || DateRange.THIRTY_DAYS;
    return this.dashboardService.getOrderStatus(range);
  }

  @Get('top-products')
  async getTopProducts(
    @Query() query: DashboardQueryDto,
  ): Promise<TopProductDto[]> {
    const range = query.range || DateRange.THIRTY_DAYS;
    return this.dashboardService.getTopProducts(range);
  }

  @Get('/orders/recent')
  async getRecentOrders(): Promise<RecentOrderDto[]> {
    return this.dashboardService.getRecentOrders();
  }

  @Get('statistics')
  async getHomePageStatistics(): Promise<HomePageStatsDto> {
    return this.dashboardService.getHomePageStats();
  }
}


