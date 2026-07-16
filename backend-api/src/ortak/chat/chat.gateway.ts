import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`[WS Connected] Client ID: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[WS Disconnected] Client ID: ${client.id}`);
  }

  @SubscribeMessage('join_job')
  handleJoinJob(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { jobId: string },
  ) {
    if (data && data.jobId) {
      const room = `job_${data.jobId}`;
      client.join(room);
      console.log(`[WS Room Join] Client ${client.id} joined room: ${room}`);
      return { status: 'success', room };
    }
    return { status: 'error', message: 'Geçersiz talep ID' };
  }

  @SubscribeMessage('leave_job')
  handleLeaveJob(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { jobId: string },
  ) {
    if (data && data.jobId) {
      const room = `job_${data.jobId}`;
      client.leave(room);
      console.log(`[WS Room Leave] Client ${client.id} left room: ${room}`);
      return { status: 'success', room };
    }
    return { status: 'error', message: 'Geçersiz talep ID' };
  }

  @SubscribeMessage('join_provider')
  handleJoinProvider(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { providerId: string },
  ) {
    if (data && data.providerId) {
      const room = `provider_${data.providerId}`;
      client.join(room);
      console.log(`[WS Provider Join] Provider client ${client.id} joined room: ${room}`);
      return { status: 'success', room };
    }
    return { status: 'error', message: 'Geçersiz hizmet veren ID' };
  }

  @SubscribeMessage('join_user')
  handleJoinUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    if (data && data.userId) {
      const room = `user_${data.userId}`;
      client.join(room);
      console.log(`[WS User Join] User client ${client.id} joined room: ${room}`);
      return { status: 'success', room };
    }
    return { status: 'error', message: 'Geçersiz kullanıcı ID' };
  }


  /**
   * Broadcasts a new job distributed notification to a specific provider.
   */
  emitNewJobToProvider(providerId: string, payload: any) {
    const room = `provider_${providerId}`;
    this.server?.to(room).emit('new_job', payload);
    console.log(`[WS Broadcast] New job notification sent to provider room ${room}`);
  }

  /**
   * Broadcasts a new offer to all clients in the job room.
   */
  emitNewOffer(jobId: string, offer: any) {
    const room = `job_${jobId}`;
    this.server?.to(room).emit('new_offer', {
      type: 'new_offer',
      jobId, // Add jobId to identify the request on client side
      offerId: offer.id,
      price: offer.price,
      description: offer.description,
      provider: {
        id: offer.providerId,
        avg_rating: offer.providerRating || 5.0,
        is_approved: offer.providerIsApproved !== undefined ? offer.providerIsApproved : true,
        user: {
          name: offer.providerName || 'Hizmet Veren',
          phone_masked: '',
        },
        subscription: offer.providerSubscription,
      },
    });
    console.log(`[WS Broadcast] New offer emitted to room ${room}`);
  }

  /**
   * Broadcasts job completion request by the provider.
   */
  emitJobCompletedByProvider(jobId: string, payload: any) {
    const room = `job_${jobId}`;
    this.server?.to(room).emit('job_completed_by_provider', payload);
    console.log(`[WS Broadcast] Job completion declaration emitted to room ${room}`);
  }

  /**
   * Broadcasts finalized job completion status.
   */
  emitJobCompletionFinalized(jobId: string, payload: any) {
    const room = `job_${jobId}`;
    this.server?.to(room).emit('job_completion_finalized', payload);
    console.log(`[WS Broadcast] Job completion finalized emitted to room ${room}`);
  }
}
