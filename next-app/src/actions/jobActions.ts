"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { adminAuth, getAuthenticatedUserUID } from "@/lib/firebase-admin"
import { scheduleInterviewReminder } from "@/lib/queue"

export type JobInput = {
  companyName: string
  jobTitle: string
  status: "WISHLIST" | "APPLIED" | "INTERVIEW" | "OFFER" | "REJECTED"
  location?: string
  salary?: string
  jobUrl?: string
  notes?: string
  resumeId?: string
  interviewDate?: string | null
}

function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    let host = new URL(url).hostname;
    if (host.startsWith("www.")) return host.substring(4);
    return host;
  } catch (error) { return null; }
}

export async function createJob(data: JobInput, idToken: string) {
  try {
    const uid = await getAuthenticatedUserUID(idToken);
    const domain = extractDomain(data.jobUrl);
    const logoUrl = domain ? `https://logo.clearbit.com/${domain}` : null;

    const newJob = await prisma.job.create({
      data: {
        userId: uid,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        status: data.status,
        location: data.location || null,
        salary: data.salary || null,
        jobUrl: data.jobUrl || null,
        logoUrl: logoUrl,
        notes: data.notes || null,
        resumeId: data.resumeId || null,
        interviewDate: data.interviewDate ? new Date(data.interviewDate) : null,
      }
    });

    if (newJob.status === 'INTERVIEW' && newJob.interviewDate) {
      try {
        await scheduleInterviewReminder(newJob.id, 'firebase-user@example.com', newJob.companyName, newJob.interviewDate);
      } catch (qErr: any) { console.error('Queue Error', qErr) }
    }

    revalidatePath("/dashboard")
    return { success: true, job: newJob }
  } catch (error: any) {
    console.error("Prisma Create Error:", error);
    return { success: false, error: error.message || "Failed to create job application." }
  }
}

export async function getJobs(idToken: string) {
  try {
    const uid = await getAuthenticatedUserUID(idToken);

    const jobs = await prisma.job.findMany({
      where: { userId: uid },
      orderBy: { createdAt: 'desc' },
      include: {
        interviews: {
          orderBy: { interviewDate: 'asc' }
        },
        resume: true
      }
    });

    return { success: true, jobs }
  } catch (error: any) {
    console.error("Prisma Fetch Error:", error);
    return { success: false, error: error.message || "Failed to fetch jobs.", jobs: [] }
  }
}

export async function updateJobStatus(id: string, newStatus: "WISHLIST" | "APPLIED" | "INTERVIEW" | "OFFER" | "REJECTED", idToken: string, interviewDate?: string) {
  try {
    const uid = await getAuthenticatedUserUID(idToken);

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job || job.userId !== uid) {
      return { success: false, error: "Not authorized to modify this job." };
    }

    const dataToUpdate: any = { status: newStatus };
    if (interviewDate) {
      dataToUpdate.interviewDate = new Date(interviewDate);
    }

    await prisma.job.update({
      where: { id },
      data: dataToUpdate
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update status." };
  }
}

export async function deleteJob(id: string, idToken: string) {
  try {
    const uid = await getAuthenticatedUserUID(idToken);

    const job = await prisma.job.findUnique({ where: { id } });
    
    if (!job) {
      return { success: false, error: "Job not found." };
    }

    if (job.userId !== uid) {
      console.error(`[deleteJob] UID mismatch: token=${uid}, job.userId=${job.userId}`);
      return { success: false, error: "Not authorized to delete this job." };
    }

    // Delete linked interviews first to avoid FK constraint errors
    await prisma.interview.deleteMany({ where: { jobId: id } });

    // Now delete the job itself
    await prisma.job.delete({ where: { id } });
    
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error('[deleteJob] Error:', error);
    return { success: false, error: error.message || "Failed to delete job." };
  }
}



