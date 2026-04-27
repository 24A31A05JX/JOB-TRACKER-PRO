"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUserUID } from "@/lib/firebase-admin"

export type InterviewInput = {
  jobId: string
  type: string
  interviewDate: string
  meetingLink?: string
  prepNotes?: string
  questionsToAsk?: string
  interviewers?: string
}

export async function createInterview(data: InterviewInput, idToken: string) {
  try {
    const uid = await getAuthenticatedUserUID(idToken);

    // Verify the user owns the underlying Job
    const job = await prisma.job.findUnique({ where: { id: data.jobId } });
    if (!job || job.userId !== uid) {
      return { success: false, error: "Not authorized to modify this job's interviews." };
    }

    const newInterview = await prisma.interview.create({
      data: {
        userId: uid,
        jobId: data.jobId,
        type: data.type,
        interviewDate: new Date(data.interviewDate),
        meetingLink: data.meetingLink || null,
        prepNotes: data.prepNotes || null,
        questionsToAsk: data.questionsToAsk || null,
        interviewers: data.interviewers || null,
        status: "UPCOMING"
      }
    });

    revalidatePath("/dashboard")
    revalidatePath("/interviews")
    return { success: true, interview: newInterview }
  } catch (error: any) {
    console.error("Create Interview Error:", error);
    return { success: false, error: error.message || "Failed to create interview round." }
  }
}

export async function updateInterview(interviewId: string, data: Partial<InterviewInput & { status: string, rating: number }>, idToken: string) {
  try {
    const uid = await getAuthenticatedUserUID(idToken);

    const existing = await prisma.interview.findUnique({ where: { id: interviewId } });
    if (!existing || existing.userId !== uid) {
      return { success: false, error: "Not authorized to update this interview." };
    }

    const updatedData: any = {};
    if (data.type) updatedData.type = data.type;
    if (data.interviewDate) updatedData.interviewDate = new Date(data.interviewDate);
    if (data.meetingLink !== undefined) updatedData.meetingLink = data.meetingLink;
    if (data.prepNotes !== undefined) updatedData.prepNotes = data.prepNotes;
    if (data.questionsToAsk !== undefined) updatedData.questionsToAsk = data.questionsToAsk;
    if (data.interviewers !== undefined) updatedData.interviewers = data.interviewers;
    if (data.status) updatedData.status = data.status;
    if (data.rating) updatedData.rating = data.rating;

    const updated = await prisma.interview.update({
      where: { id: interviewId },
      data: updatedData
    });

    revalidatePath("/interviews")
    return { success: true, interview: updated }
  } catch (error: any) {
    console.error("Update Interview Error:", error);
    return { success: false, error: error.message || "Failed to update interview." }
  }
}

export async function deleteInterview(interviewId: string, idToken: string) {
  try {
    const uid = await getAuthenticatedUserUID(idToken);

    const existing = await prisma.interview.findUnique({ where: { id: interviewId } });
    if (!existing || existing.userId !== uid) {
      return { success: false, error: "Not authorized to delete this interview." };
    }

    await prisma.interview.delete({ where: { id: interviewId } });

    revalidatePath("/interviews")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete interview." }
  }
}
