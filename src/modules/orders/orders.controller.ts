/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryDto } from 'src/dto/query.dto';
import { UpdateOrderStatusDto } from './dto/update-status.dto';
import { ActorRole } from 'src/utils/order-status.rules';
import { RolesGuard } from 'src/guards/roles.guard';
import { AuthGuard } from '@nestjs/passport';
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOperation } from '@nestjs/swagger';
import { OrderQueryDto } from 'src/dto/orderQuery.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @ApiOperation({ summary: 'Create a new order for the authenticated user' })
  @ApiNotFoundResponse({ description: 'User or address or cart item not found' })
  @ApiBadRequestResponse({ description: 'Not enough quantity'})
  create(@Req() req: Request, @Body() createOrderDto: CreateOrderDto) {
    const { id } = req['user'];
    return this.ordersService.create(id, createOrderDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiOperation({ summary: 'Get all orders for the authenticated user' })
  @ApiNotFoundResponse({ description: 'User not found' })
  getMyOrders(@Req() req: Request, @Query() query: OrderQueryDto) {
    const { id } = req['user'];
    return this.ordersService.getMyOrders(id, query);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all orders' })
  getAll(@Query() query: OrderQueryDto) {
    return this.ordersService.getAll(query);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/:orderId')
  @ApiOperation({ summary: 'Get order by ID for the authenticated user' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  getOrderById(@Req() req: Request, @Param('orderId') orderId: number) {
    const { id } = req['user'];
    return this.ordersService.getOrderById(id, orderId);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Update order status' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  updateOrderStatus(@Req() req: any, @Param('id') id: number, @Body() dto: UpdateOrderStatusDto) {
    const actor = {
      id: req.user.id,
      role: req.user.role as ActorRole,
      reason: dto['reason'],
    };
    return this.ordersService.updateStatus(id, dto.status, actor);
  }
}
