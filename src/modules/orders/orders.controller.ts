import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryDto } from 'src/dto/query.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Req() req: Request, @Body() createOrderDto: CreateOrderDto) {
    const {id} = req['user'];
    return this.ordersService.create(id, createOrderDto);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  getMyOrders(@Req() req: Request, @Query() query: QueryDto) {
    const {id} = req['user'];
    return this.ordersService.getMyOrders(id, query);
  }

  @Get('all')
  getAll(@Query() query: QueryDto) {
    return this.ordersService.getAll(query);
  }

  @UseGuards(AuthGuard)
  @Get('me/:orderId')
  getOrderById(@Req() req: Request, @Param('orderId') orderId: number) {
    const {id} = req['user'];
    return this.ordersService.getOrderById(id, orderId);
  }

  
}
