/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
    WebSocketGateway,
    SubscribeMessage,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    handleConnection(socket: Socket) {
        console.log('Socket connected:', socket.id);
    }

    handleDisconnect(socket: Socket) {
        console.log('Socket disconnected:', socket.id);
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
}
