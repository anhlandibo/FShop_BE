/* eslint-disable @typescript-eslint/require-await */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { Repository } from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { NotificationsGateway } from 'src/modules/notifications/notifications.gateway';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { NotificationType, Role } from 'src/constants';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private notiGateway: NotificationsGateway,
  ) {}
  async create(createNotificationDto: CreateNotificationDto) {
    const { userId } = createNotificationDto;

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new HttpException('Not found user', HttpStatus.NOT_FOUND);
    console.log('Creating notification for userId:', userId);


    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      user: { id: userId },
      isRead: false,
    });

    const savedNoti = await this.notificationRepository.save(notification);
    
    this.notiGateway.sendToUser(userId, savedNoti);
    
    return savedNoti;
  }

  async sendNotification(userId: number, title: string, message: string, type: NotificationType) {
      try {
        const notification = this.notificationRepository.create({
            title,
            message,
            type,
            user: { id: userId },
            isRead: false
        });
        const saved = await this.notificationRepository.save(notification);
        this.notiGateway.sendToUser(userId, saved);
        return saved;
      } catch (error) {
          console.error(`Failed to send notification to user ${userId}`, error);
      }
  }

  async sendToAdmin(title: string, message: string, type: NotificationType) {
      const data = {
          title,
          message,
          type,
          createdAt: new Date(),
          isRead: false
      };
      this.notiGateway.sendToAdmin(data);

      const admins = await this.userRepository.find({
          where: { role: Role.Admin } 
      });

      if (admins.length > 0) {
          const notifications = admins.map(admin => {
              return this.notificationRepository.create({
                  title,
                  message,
                  type,
                  user: { id: admin.id },
                  isRead: false
              });
          });

          await this.notificationRepository.save(notifications);
      }
  }

  // Gửi Broadcast 
  async sendToAll(title: string, message: string, type: NotificationType) {
      // 1. Socket broadcast
      this.notiGateway.broadcast({
          title,
          message,
          type,
          createdAt: new Date(),
          isRead: false
      });

      // 2. Lưu DB (Batch insert cho all users - Cẩn thận nếu user quá đông > 10k)
      const users = await this.userRepository.find({ select: ['id'] });
      if (users.length) {
          const notifications = users.map(u => this.notificationRepository.create({
              title,
              message,
              type,
              user: { id: u.id },
              isRead: false
          }));
          await this.notificationRepository.save(notifications);
      }
  }

  async findByUser(userId: number) {
    if (!(await this.userRepository.findBy({ id: userId })))
      throw new HttpException('Not found user', HttpStatus.NOT_FOUND);
    return this.notificationRepository.find({
      where: {
        user: { id: userId },
      },
    });
  }

  async markAsRead(userId: number) {
    if (!(await this.userRepository.findBy({ id: userId })))
      throw new HttpException('Not found user', HttpStatus.NOT_FOUND);
    return this.notificationRepository.update(
      { user: { id: userId } },
      { isRead: true },
    );
  }

  async markOneAsRead(notificationId: number, userId: number) {
    const notification = await this.notificationRepository.findOne({
      where: {
        id: notificationId,
        user: { id: userId },
      },
    });

    if (!notification) throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
    

    if (notification.isRead) return notification; 

    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  async getMyNotifications(userId: number, query: QueryNotificationDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      type,
      isRead
    } = query;

    const [data, total] = await this.notificationRepository.findAndCount({
      where: { user: { id: userId }, type, isRead: isRead === undefined ? undefined : isRead === 'true' },
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
