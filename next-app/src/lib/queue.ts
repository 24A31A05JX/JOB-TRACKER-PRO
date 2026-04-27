import { Queue } from 'bullmq';
import Redis from 'ioredis';

// Instantiate an external Redis connection using the default localhost port
// or custom REDIS_URL from Vercel KV / Upstash
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

redisConnection.on('error', (err) => {
  console.log('[Redis] Connection skipped/failed. Ensure Redis is running if testing background queues.');
});

export const notificationQueue = new Queue('interview-reminders', { 
  connection: redisConnection as any 
});

export async function scheduleInterviewReminder(jobId: string, email: string, company: string, interviewDate: Date) {
  // Let's schedule the reminder for 24 hours before the actual interview
  const notifyTime = new Date(interviewDate.getTime() - 24 * 60 * 60 * 1000);
  const delay = notifyTime.getTime() - Date.now();

  // If the interview is already less than 24h away, notify rapidly for demonstration logic
  const actualDelay = delay > 0 ? delay : 10000; 

  await notificationQueue.add('reminder-email', {
    jobId,
    email,
    company,
    interviewDate
  }, {
    delay: actualDelay,
    removeOnComplete: true, // Keep Redis clean
  });

  console.log(`[Queue] Successfully scheduled reminder for ${company}.`);
}
