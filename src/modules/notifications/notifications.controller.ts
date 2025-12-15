import { Controller, Get, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { QueryNotificationDto } from './dto/query-notification.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getByUser(@Query('userId') userId: number) {
    return this.notificationsService.findByUser(userId);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') userId: number) {
    return this.notificationsService.markAsRead(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiOperation({ summary: 'Get my notifications with pagination and sorting' })
  getMyNotifications(
    @Req() req: Request,
    @Query() query: QueryNotificationDto,
  ) {
    const {id} = req['user'];
    return this.notificationsService.getMyNotifications(id, query);
  }
}
