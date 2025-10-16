import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationsGateway } from 'src/modules/notifications/notifications.gateway';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  imports: [TypeOrmModule.forFeature([Notification, User])],
  exports: [NotificationsService, NotificationsGateway]
})
export class NotificationsModule { }
