/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as cookie from 'cookie';
import {
    WebSocketGateway,
    SubscribeMessage,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Role } from 'src/constants';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(socket: Socket) {
    try {
      // 1. Lấy cookie string từ handshake headers
      const rawCookies = socket.handshake.headers.cookie;

      if (!rawCookies) {
        console.log('Connection rejected: No cookies found');
        socket.disconnect();
        return;
      }

      // 2. Parse cookie string thành object
      const parsedCookies = cookie.parse(rawCookies);
      const accessToken = parsedCookies['access_token']; // Tên cookie bạn đã set ở AuthController

      if (!accessToken) {
        console.log('Connection rejected: No access_token found');
        socket.disconnect();
        return;
      }

      // 3. Verify token
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(accessToken, {
        secret,
      });

      // 4. Lấy userId từ payload 
      const userId = payload.sub;
      const role = payload.role;


      // 5. Lưu thông tin vào socket data để dùng lại nếu cần
      socket.data.user = {
        id: userId,
        email: payload.username,
        role: role
      };

      // 6. Join room riêng của user
      await socket.join(`user_${userId}`);

      if (role === Role.Admin) { // Check role
          await socket.join('admin_room');
          console.log(`Admin ${userId} joined admin_room`);
      }

      console.log(`User ${userId} connected`);

    } catch (error) {
      console.log('Connection rejected: Invalid token', error.message);
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    const userId = socket.data?.user?.id;
    if (userId) {
       console.log(`User ${userId} disconnected`);
    }
  }

  @SubscribeMessage('join')
  handleJoin(socket: Socket, userId: number) {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room`);
  }

  sendToUser(userId: number, data: any) {
    // gui toi cac clien da join user_userId
    this.server.to(`user_${userId}`).emit('notification:new', data);
  }

  sendToAdmin(data: any) {
    this.server.to('admin_room').emit('notification:admin', data);
  }

  broadcast(data: any) {
    this.server.emit('notification:new', data);
  }
}
