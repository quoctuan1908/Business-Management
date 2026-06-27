import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries) => {
      if (retries > 5) return false; 
      return 5000;
    }
  }
});

redisClient.on('error', (err : Error) => {
  console.error('Redis Connection Error:', err.message);
});

redisClient.connect().catch((err : Error) => {
  console.error('Could not connect to Redis:', err.message);
});

export default redisClient;