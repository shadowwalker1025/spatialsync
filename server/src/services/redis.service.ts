import Redis from 'ioredis';
import { EventEmitter } from 'events';
import { ENV } from '../config/env';

class RedisService {
  private pubClient: Redis | null = null;
  private subClient: Redis | null = null;
  private memoryPubSub = new EventEmitter();
  private memoryCache = new Map<string, string>();
  private isRedisConnected = false;

  constructor() {
    this.memoryPubSub.setMaxListeners(100);
    this.initRedis();
  }

  private initRedis() {
    try {
      this.pubClient = new Redis(ENV.REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // Don't crash if Redis is unavailable
        lazyConnect: true,
      });

      this.subClient = new Redis(ENV.REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
        lazyConnect: true,
      });

      this.pubClient.connect()
        .then(() => {
          this.isRedisConnected = true;
          console.log('⚡ Redis connected successfully for Pub/Sub & Caching');
        })
        .catch(() => {
          this.isRedisConnected = false;
          console.log('ℹ️ Running with high-performance in-memory cache & Pub/Sub (Standalone mode)');
        });

      this.pubClient.on('error', () => {
        this.isRedisConnected = false;
      });

      this.subClient.on('error', () => {
        this.isRedisConnected = false;
      });
    } catch {
      this.isRedisConnected = false;
      console.log('ℹ️ Redis client bypassed. Using fast in-memory store.');
    }
  }

  public async publish(channel: string, message: any): Promise<void> {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    if (this.isRedisConnected && this.pubClient) {
      try {
        await this.pubClient.publish(channel, payload);
        return;
      } catch {
        // fallback
      }
    }
    this.memoryPubSub.emit(channel, payload);
  }

  public subscribe(channel: string, callback: (message: string) => void): void {
    if (this.isRedisConnected && this.subClient) {
      this.subClient.subscribe(channel, (err) => {
        if (!err) {
          this.subClient?.on('message', (chan, msg) => {
            if (chan === channel) callback(msg);
          });
        }
      });
    }
    this.memoryPubSub.on(channel, callback);
  }

  public async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const stringVal = typeof value === 'string' ? value : JSON.stringify(value);
    if (this.isRedisConnected && this.pubClient) {
      try {
        if (ttlSeconds) {
          await this.pubClient.set(key, stringVal, 'EX', ttlSeconds);
        } else {
          await this.pubClient.set(key, stringVal);
        }
        return;
      } catch {
        // fallback
      }
    }
    this.memoryCache.set(key, stringVal);
  }

  public async get<T = any>(key: string): Promise<T | null> {
    if (this.isRedisConnected && this.pubClient) {
      try {
        const val = await this.pubClient.get(key);
        if (val) {
          try {
            return JSON.parse(val) as T;
          } catch {
            return val as unknown as T;
          }
        }
      } catch {
        // fallback
      }
    }
    const val = this.memoryCache.get(key);
    if (!val) return null;
    try {
      return JSON.parse(val) as T;
    } catch {
      return val as unknown as T;
    }
  }

  public async del(key: string): Promise<void> {
    if (this.isRedisConnected && this.pubClient) {
      try {
        await this.pubClient.del(key);
        return;
      } catch {
        // fallback
      }
    }
    this.memoryCache.delete(key);
  }
}

export const redisService = new RedisService();
