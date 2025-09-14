import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { CartsService } from './carts.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { CartItemDto, CreateCartDto } from './dto';

@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Post()
  create(@Body() createCartDto: CreateCartDto) {
    return this.cartsService.create(createCartDto);
  }

  @Post('add')
  @UseGuards(AuthGuard)
  addToCart(@Req() req: Request, @Body() addToCartDto: CartItemDto) {
    const {cartId} = req['user'];
    return this.cartsService.addToCart(cartId, addToCartDto);
  }

  @Post('remove')
  @UseGuards(AuthGuard)
  removeFromCart(@Req() req: Request, @Body() removeFromCartDto: CartItemDto) {
    const {cartId} = req['user'];
    return this.cartsService.removeFromtCart(cartId, removeFromCartDto);
  }

  @Get('/me')
  @UseGuards(AuthGuard)
  getCart(@Req() req: Request) {
    const {cartId} = req['user'];
    return this.cartsService.getCart(cartId);
  }
}
