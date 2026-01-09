/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LivestreamsService } from './livestreams.service';
import {
  JoinStreamDto,
  SendMessageDto,
  PinProductDto,
  UnpinProductDto,
  TrackProductClickDto,
  LeaveStreamDto
} from './dtos/gateway-payload.dto';

@WebSocketGateway({ cors: { origin: '*' }, namespace: 'livestreams' })
export class LivestreamsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('LivestreamGateway');

  // Map to track user sessions: socketId -> { userId, livestreamId, guestId }
  private activeSessions: Map<
    string,
    { userId?: number; livestreamId?: number; guestId?: string }
  > = new Map();

  constructor(private readonly livestreamService: LivestreamsService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const session = this.activeSessions.get(client.id);
    if (session && session.livestreamId) {
      // ✅ ADD: Ensure viewer is removed
      try {
        await this.handleLeaveInternal(
          client.id,
          session.livestreamId,
          session.userId,
          session.guestId,
        );
        this.logger.log(`[Gateway] Cleanup completed for ${client.id}`);
      } catch (error) {
        this.logger.error(
          `[Gateway] Error cleaning up viewer: ${error.message}`,
        );
      }
    }

    this.activeSessions.delete(client.id);
  }

  // Helper to get user from socket (if authenticated)
  private getUserFromSocket(client: Socket): { id: number } | null {
    // In real implementation, extract from JWT token in handshake
    // For now, we'll get it from handshake auth or query
    const userId =
      client.handshake.auth?.userId || client.handshake.query?.userId;
    return userId ? { id: parseInt(userId as string, 10) } : null;
  }

  // 1. JOIN LIVESTREAM
  @SubscribeMessage('join_livestream')
  async handleJoin(
    @MessageBody() data: JoinStreamDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { livestreamId, guestId } = data;
      const user = this.getUserFromSocket(client);

      // Track viewer join
      await this.livestreamService.trackViewerJoinByUserId(
        livestreamId,
        user?.id || null,
        guestId,
      );

      // Join socket room
      const room = `stream_${livestreamId}`;
      client.join(room);

      // Store session
      this.activeSessions.set(client.id, {
        userId: user?.id,
        livestreamId,
        guestId,
      });

      this.logger.log(
        `User ${user?.id || guestId} joined livestream ${livestreamId}`,
      );

      // Get current viewer count
      const viewerCount =
        await this.livestreamService.getCurrentViewerCount(livestreamId);

      // Notify room about new viewer
      this.server.to(room).emit('viewer_joined', {
        viewerCount,
        timestamp: new Date(),
      });

      client.emit('joined_livestream', {
        success: true,
        message: 'Connected to livestream',
        viewerCount,
      });
    } catch (error) {
      this.logger.error(`Error joining livestream: ${error.message}`);
      client.emit('error', {
        success: false,
        message: error.message,
      });
    }
  }

  // 2. LEAVE LIVESTREAM
  @SubscribeMessage('leave_livestream')
  async handleLeave(
    @MessageBody() data: LeaveStreamDto,
    @ConnectedSocket() client: Socket,
  ) {
    const session = this.activeSessions.get(client.id);
    if (session) {
      await this.handleLeaveInternal(
        client.id,
        data.livestreamId,
        session.userId,
        session.guestId,
      );
    }
  }

  private async handleLeaveInternal(
    socketId: string,
    livestreamId: number,
    userId?: number,
    guestId?: string,
  ) {
    try {
      // Track viewer leave
      await this.livestreamService.trackViewerLeaveByUserId(
        livestreamId,
        userId || null,
        guestId,
      );

      // Leave socket room
      const room = `stream_${livestreamId}`;
      this.server.in(socketId).socketsLeave(room);

      this.logger.log(
        `User ${userId || guestId} left livestream ${livestreamId}`,
      );

      // Get updated viewer count
      const viewerCount =
        await this.livestreamService.getCurrentViewerCount(livestreamId);

      // Notify room about viewer leaving
      this.server.to(room).emit('viewer_left', {
        viewerCount,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Error leaving livestream: ${error.message}`);
    }
  }

  // 3. SEND MESSAGE (CHAT)
  @SubscribeMessage('send_live_message')
  async handleMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { livestreamId, content } = data;
      const user = this.getUserFromSocket(client);

      if (!user) {
        client.emit('error', {
          success: false,
          message: 'You must be logged in to send messages',
        });
        return;
      }

      // Save message to database
      const savedMessage = await this.livestreamService.saveMessageByUserId(
        livestreamId,
        user.id,
        content,
      );

      const room = `stream_${livestreamId}`;

      // Broadcast message to all viewers
      this.server.to(room).emit('new_live_message', {
        id: savedMessage.id,
        userId: user.id,
        user: {
          id: savedMessage.user.id,
          fullName: savedMessage.user.fullName,
          avatar: savedMessage.user.avatar,
        },
        content: savedMessage.content,
        isPinned: savedMessage.isPinned,
        createdAt: savedMessage.createdAt,
      });
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      client.emit('error', {
        success: false,
        message: error.message,
      });
    }
  }

  // 4. PIN PRODUCT
  @SubscribeMessage('pin_live_product')
  async handlePinProduct(
    @MessageBody() data: PinProductDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { livestreamId, productId } = data;
      const user = this.getUserFromSocket(client);

      if (!user) {
        client.emit('error', {
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      // Pin product
      const pinnedProduct = await this.livestreamService.pinProductByUserId(
        livestreamId,
        productId,
        user.id,
      );

      const room = `stream_${livestreamId}`;

      // Broadcast to all viewers
      this.server.to(room).emit('product_pinned', {
        id: pinnedProduct.id,
        product: pinnedProduct.product,
        pinnedAt: pinnedProduct.pinnedAt,
      });

      this.logger.log(
        `Product ${productId} pinned in livestream ${livestreamId}`,
      );
    } catch (error) {
      this.logger.error(`Error pinning product: ${error.message}`);
      client.emit('error', {
        success: false,
        message: error.message,
      });
    }
  }

  // 5. UNPIN PRODUCT
  @SubscribeMessage('unpin_live_product')
  async handleUnpinProduct(
    @MessageBody() data: UnpinProductDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { livestreamId, productId } = data;
      const user = this.getUserFromSocket(client);

      if (!user) {
        client.emit('error', {
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      // Unpin product
      await this.livestreamService.unpinProductByUserId(
        livestreamId,
        productId,
        user.id,
      );

      const room = `stream_${livestreamId}`;

      // Broadcast to all viewers
      this.server.to(room).emit('product_unpinned', {
        productId,
        timestamp: new Date(),
      });

      this.logger.log(
        `Product ${productId} unpinned from livestream ${livestreamId}`,
      );
    } catch (error) {
      this.logger.error(`Error unpinning product: ${error.message}`);
      client.emit('error', {
        success: false,
        message: error.message,
      });
    }
  }

  // 6. TRACK PRODUCT CLICK
  @SubscribeMessage('track_product_click')
  async handleProductClick(
    @MessageBody() data: TrackProductClickDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { livestreamId, productId } = data;

      await this.livestreamService.trackProductClick(livestreamId, productId);

      client.emit('product_click_tracked', {
        success: true,
        productId,
      });
    } catch (error) {
      this.logger.error(`Error tracking product click: ${error.message}`);
    }
  }

  // 7. DELETE MESSAGE (Only streamer or message owner)
  @SubscribeMessage('delete_live_message')
  async handleDeleteMessage(
    @MessageBody() data: { messageId: number; livestreamId: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { messageId, livestreamId } = data;
      const user = this.getUserFromSocket(client);

      if (!user) {
        client.emit('error', {
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      await this.livestreamService.deleteMessageByUserId(messageId, user.id);

      const room = `stream_${livestreamId}`;

      // Broadcast message deletion
      this.server.to(room).emit('message_deleted', {
        messageId,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Error deleting message: ${error.message}`);
      client.emit('error', {
        success: false,
        message: error.message,
      });
    }
  }

  // 8. PIN MESSAGE
  @SubscribeMessage('pin_live_message')
  async handlePinMessage(
    @MessageBody() data: { messageId: number; livestreamId: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { messageId, livestreamId } = data;
      const user = this.getUserFromSocket(client);

      if (!user) {
        client.emit('error', {
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const pinnedMessage = await this.livestreamService.pinMessageByUserId(
        messageId,
        user.id,
      );

      const room = `stream_${livestreamId}`;

      // Broadcast pinned message
      this.server.to(room).emit('message_pinned', {
        messageId,
        message: pinnedMessage,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Error pinning message: ${error.message}`);
      client.emit('error', {
        success: false,
        message: error.message,
      });
    }
  }

  // Helper method: Notify livestream start (called from service)
  notifyLivestreamStart(livestreamId: number, data: any) {
    const room = `stream_${livestreamId}`;
    this.server.to(room).emit('livestream_started', data);
  }

  // Helper method: Notify livestream end (called from service)
  notifyLivestreamEnd(livestreamId: number, data: any) {
    const room = `stream_${livestreamId}`;
    this.server.to(room).emit('livestream_ended', data);
  }

  @SubscribeMessage('viewer_heartbeat')
  async handleViewerHeartbeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { livestreamId: number },
  ) {
    const userId = client.data.userId;
    const guestId = client.data.guestId;

    console.log('[Gateway] Heartbeat received:', {
      livestreamId: data.livestreamId,
      userId,
      guestId,
    });

    try {
      // Update last activity timestamp for this viewer
      await this.livestreamService.updateViewerHeartbeat(
        data.livestreamId,
        userId,
        guestId,
      );
    } catch (error) {
      console.error('[Gateway] Heartbeat error:', error);
    }
  }
}
