import Redis from 'ioredis';

function getRedisUrl(): string {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  const password = process.env.REDIS_PASSWORD || '';
  return `redis://:${password}@127.0.0.1:6379`;
}

const globalForRedis = global as unknown as { redis: Redis | undefined };

export const redis =
  globalForRedis.redis ||
  (() => {
    const client = new Redis(getRedisUrl(), {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    client.on('error', (err) => {
      // Ignore background connect errors during build
    });
    return client;
  })();

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
