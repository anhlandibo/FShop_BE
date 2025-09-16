/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryDto } from 'src/dto/query.dto';
import { UpdateOrderStatusDto } from './dto/update-status.dto';
import { ActorRole } from 'src/utils/order-status.rules';
import { RolesGuard } from 'src/guards/roles.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Req() req: Request, @Body() createOrderDto: CreateOrderDto) {
    const { id } = req['user'];
    return this.ordersService.create(id, createOrderDto);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  getMyOrders(@Req() req: Request, @Query() query: QueryDto) {
    const { id } = req['user'];
    return this.ordersService.getMyOrders(id, query);
  }

  @Get('all')
  getAll(@Query() query: QueryDto) {
    return this.ordersService.getAll(query);
  }

  @UseGuards(AuthGuard)
  @Get('me/:orderId')
  getOrderById(@Req() req: Request, @Param('orderId') orderId: number) {
    const { id } = req['user'];
    return this.ordersService.getOrderById(id, orderId);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard, RolesGuard)
  updateOrderStatus(@Req() req: any, @Param('id') id: number, @Body() dto: UpdateOrderStatusDto) {
    const actor = {
      id: req.user.id,
      role: req.user.role as ActorRole,
      reason: dto['reason'],
    };
    return this.ordersService.updateStatus(id, dto.status, actor);
  }
}
