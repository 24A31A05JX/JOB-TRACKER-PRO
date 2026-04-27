import { Worker } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';

// Attempt to load proper local environment variables for the standalone worker
dotenv.config({ path: path.join(__dirname, '../../.env.local') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const worker = new Worker('interview-reminders', async (job) => {
  const { jobId, email, company, interviewDate } = job.data;
  
  console.log(`\n[BULLMQ] Processing job ${job.id} for user ${email}...`);
  
  // Gmail API Provider pseudo-code block execution
  console.log(`==================== DISPATCHING EMAIL ====================`);
  console.log(`To: ${email}`);
  console.log(`Subject: Action Required: Your ${company} Interview is coming up!`);
  console.log(`Body: Hi there! Just a heads up that your interview with ${company} is scheduled for ${new Date(interviewDate).toLocaleString()}. Review your notes in JobTracker to prepare!`);
  console.log(`===========================================================\n`);
  
  // Simulate network delay using Gmail API or NodeMailer
  await new Promise((resolve) => setTimeout(resolve, 2000));
  
  return { success: true, deliveredTo: email };
}, {
  connection: redisConnection as any,
});

worker.on('completed', job => {
  console.log(`[BULLMQ] ✅ Job ${job.id} has successfully completed! Reminder fired.`);
});

worker.on('failed', (job, err) => {
  console.log(`[BULLMQ] 🚨 Job ${job?.id} failed with error: ${err.message}`);
});

console.log("🌟 Standalone BullMQ Worker started. Listening for 'interview-reminders' tasks...");
