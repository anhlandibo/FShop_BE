import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Req() req: Request, @Body() createOrderDto: CreateOrderDto) {
    const {id} = req['user'];
    return this.ordersService.create(id, createOrderDto);
  }
}
