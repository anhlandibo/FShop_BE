import { Module, forwardRef } from '@nestjs/common';
import { LivestreamsService } from './livestreams.service';
import { LivestreamsController } from './livestreams.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities';
import { User } from '../users/entities/user.entity';
import {
  Livestream,
  LivestreamMessage,
  LivestreamView,
  LivestreamPinnedProduct
} from './entities';
import { LivestreamsGateway } from './livestreams.gateway';
import { MediaServerService } from './media-server.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Livestream,
      Product,
      User,
      LivestreamMessage,
      LivestreamView,
      LivestreamPinnedProduct,
    ]),
    forwardRef(() => NotificationsModule),
    CloudinaryModule,
  ],
  controllers: [LivestreamsController],
  providers: [
    LivestreamsService,
    LivestreamsGateway,
    MediaServerService
  ],
  exports: [LivestreamsService],
})
export class LivestreamsModule {}
