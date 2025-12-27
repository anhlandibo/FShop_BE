/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryDto } from 'src/dto/query.dto';
import { UpdateOrderStatusDto } from './dto/update-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { ActorRole } from 'src/utils/order-status.rules';
import { RolesGuard } from 'src/guards/roles.guard';
import { AuthGuard } from '@nestjs/passport';
import { ApiBadRequestResponse, ApiBearerAuth, ApiNotFoundResponse, ApiOperation } from '@nestjs/swagger';
import { OrderQueryDto } from 'src/dto/orderQuery.dto';
import { OrderStatus } from 'src/constants';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}
  

  // CREATE ORDER
  @UseGuards(AuthGuard('jwt'))
  @Post()
  @ApiOperation({ summary: 'Create a new order for the authenticated user' })
  @ApiNotFoundResponse({ description: 'User or address or cart item not found' })
  @ApiBadRequestResponse({ description: 'Not enough quantity'})
  create(@Req() req: Request, @Body() createOrderDto: CreateOrderDto) {
    const { id } = req['user'];
    return this.ordersService.create(id, createOrderDto);
  }

  // GET MY ORDERS
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiOperation({ summary: 'Get all orders for the authenticated user' })
  @ApiNotFoundResponse({ description: 'User not found' })
  getMyOrders(@Req() req: Request, @Query() query: OrderQueryDto) {
    const { id } = req['user'];
    return this.ordersService.getMyOrders(id, query);
  }

  // GET ALL ORDERS
  @Get('all')
  @ApiOperation({ summary: 'Get all orders' })
  getAll(@Query() query: OrderQueryDto) {
    return this.ordersService.getAll(query);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':orderId')
  @ApiOperation({ summary: 'Get order by ID for the authenticated user' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  getOrderById(@Param('orderId') orderId: number) {
    return this.ordersService.getOrderById(orderId);
  }

  // GET ORDER BY ID FOR AUTHENTICATED USER
  @UseGuards(AuthGuard('jwt'))
  @Get('me/:orderId')
  @ApiOperation({ summary: 'Get order by ID for the authenticated user' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  getOrderByIdForUser(@Req() req: Request, @Param('orderId') orderId: number) {
    const { id } = req['user'];
    return this.ordersService.getOrderByIdForUser(id, orderId);
  }

  // CANCEL ORDER
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order (only PENDING or CONFIRMED orders)' })
  @ApiBearerAuth()
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiBadRequestResponse({ description: 'Order cannot be canceled in current status' })
  async cancelOrder(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelOrderDto,
  ) {
    const userId = req['user'].id;
    const userRole = req['user'].role;

    // Ensure user owns this order
    await this.ordersService.ensureOrderOwnership(id, userId);

    const actor = {
      id: userId,
      role: userRole === 'admin' ? 'admin' : 'user' as ActorRole,
      reason: dto.reason,
    };

    return this.ordersService.updateStatus(id, OrderStatus.CANCELED, actor);
  }

  // UPDATE ORDER STATUS
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

  // USER CONFIRM DELIVERY
  @UseGuards(AuthGuard('jwt'))
  @Post(':orderId/confirm-delivery')
  @ApiOperation({ summary: 'User confirms receipt of goods' })
  @ApiBearerAuth()
  confirmDelivery(@Req() req: Request, @Param('orderId', ParseIntPipe) orderId: number) {
    const {id} = req['user'];
    return this.ordersService.userConfirmDelivery(orderId, id);
  }
}
