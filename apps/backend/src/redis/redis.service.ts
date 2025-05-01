import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379');

  async publishJob(channel: string, payload: any) {
    await this.redis.publish(channel, JSON.stringify(payload));
    this.logger.log(`📥 Job publié dans Redis [${channel}]`);
  }

  subscribe(channel: string, handler: (message: any) => void) {
    const subscriber = new Redis(process.env.REDIS_URL || 'redis://redis:6379');
    subscriber.subscribe(channel);
    subscriber.on('message', (chan, msg) => {
      this.logger.log(`📬 Message Redis reçu [${chan}]`);
      handler(JSON.parse(msg));
    });
  }
}
