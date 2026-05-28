import { Processor, Process } from '@nestjs/bull';
import * as Bull from 'bull';

@Processor('chat-retry')
export class ChatRetryProcessor {
  @Process('process-retry')
  async handleChatRetry(job: Bull.Job<any>) {
    console.log(`\n==================================================`);
    console.log(`[BullMQ Chat Retry] Processing Job ID: ${job.id}`);
    console.log(`[BullMQ Chat Retry] Data:`, JSON.stringify(job.data));
    console.log(`==================================================\n`);

    const { userId, sessionId, message, attempt } = job.data;

    // Simulate calling the external AI API service with retry parameters
    console.log(`[BullMQ Chat Retry] Attempt #${attempt} succeeded for Session: ${sessionId}`);

    return {
      success: true,
      processedAt: new Date(),
      jobId: job.id,
    };
  }
}
