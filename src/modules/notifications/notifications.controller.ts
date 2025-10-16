import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Get()
  getByUser(@Query('userId') userId: number) {
    return this.notificationsService.findByUser(userId);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') userId: number) {
    return this.notificationsService.markAsRead(userId);
  }

}
