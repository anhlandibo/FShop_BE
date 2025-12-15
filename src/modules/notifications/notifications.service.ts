import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { Repository } from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { NotificationsGateway } from 'src/modules/notifications/notifications.gateway';
import { QueryNotificationDto } from './dto/query-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private notificationRepository: Repository<Notification>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private notiGateway: NotificationsGateway,
  ) { }
  async create(createNotificationDto: CreateNotificationDto) {
    const { userId } = createNotificationDto;
    if (!await this.userRepository.findBy({ id: userId }))
      throw new HttpException("Not found user", HttpStatus.NOT_FOUND);
    const notification = this.notificationRepository.create(createNotificationDto)
    await this.notificationRepository.save(notification)
    this.notiGateway.sendToUser(userId, notification);
    return notification;
  }

  async findByUser(userId: number) {
    if (!await this.userRepository.findBy({ id: userId }))
      throw new HttpException("Not found user", HttpStatus.NOT_FOUND);
    return this.notificationRepository.find({
      where: {
        user: { id: userId }
      }
    })
  }

  async markAsRead(userId: number) {
    if (!await this.userRepository.findBy({ id: userId }))
      throw new HttpException("Not found user", HttpStatus.NOT_FOUND);
    return this.notificationRepository.update({ user: { id: userId } }, { isRead: true })
  }

  async getMyNotifications(userId: number, query: QueryNotificationDto) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'DESC',
  } = query;

  const [data, total] = await this.notificationRepository.findAndCount({
    where: { user: { id: userId } },
    order: {
      [sortBy]: sortOrder,
      isRead: 'ASC', // unread luôn ưu tiên
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

}
