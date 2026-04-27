'use server';

import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserUID } from '@/lib/firebase-admin';
import { supabaseAdmin, RESUME_BUCKET } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export interface ResumeRecord {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  label: string | null;
  uploadedAt: Date;
}

// ── Get all resumes for a user ──────────────────────────────────────────
export async function getResumes(idToken: string) {
  try {
    const uid = await getAuthenticatedUserUID(idToken);
    const resumes = await prisma.resume.findMany({
      where: { userId: uid },
      orderBy: { uploadedAt: 'desc' },
    });
    return { success: true, resumes };
  } catch (error: any) {
    return { success: false, error: error.message, resumes: [] };
  }
}

// ── Save resume metadata and upload file ──────────────────────────────────
export async function uploadAndSaveResume(idToken: string, formData: FormData) {
  try {
    const uid = await getAuthenticatedUserUID(idToken);
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided.');

    const timestamp = Date.now();
    const fileNameSafe = file.name.replace(/\s+/g, '_');
    const storagePath = `${uid}/${timestamp}_${fileNameSafe}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload with Admin SDK
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(RESUME_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) throw new Error(`Upload error: ${uploadError.message}`);

    const { data: urlData } = supabaseAdmin.storage.from(RESUME_BUCKET).getPublicUrl(storagePath);
    const fileUrl = urlData.publicUrl;

    const resume = await prisma.resume.create({
      data: {
        userId: uid,
        fileName: file.name,
        fileUrl: fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        label: file.name.replace(/\.[^.]+$/, ''),
      },
    });

    revalidatePath('/resumes');
    return { success: true, resume };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


// ── Delete a resume ──────────────────────────────────────────────────────
export async function deleteResume(id: string, idToken: string) {
  try {
    const uid = await getAuthenticatedUserUID(idToken);
    const resume = await prisma.resume.findUnique({ where: { id } });
    if (!resume || resume.userId !== uid) {
      return { success: false, error: 'Not authorized.' };
    }

    // Delete from Supabase Storage
    const filePath = resume.fileUrl.split(`/${RESUME_BUCKET}/`)[1];
    if (filePath) {
      await supabaseAdmin.storage.from(RESUME_BUCKET).remove([filePath]);
    }

    // Unlink from any jobs first
    await prisma.job.updateMany({
      where: { resumeId: id },
      data: { resumeId: null }
    });

    await prisma.resume.delete({ where: { id } });
    revalidatePath('/resumes');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Link resume to a job ─────────────────────────────────────────────────
export async function linkResumeToJob(jobId: string, resumeId: string | null, idToken: string) {
  try {
    const uid = await getAuthenticatedUserUID(idToken);
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.userId !== uid) return { success: false, error: 'Not authorized.' };

    await prisma.job.update({ where: { id: jobId }, data: { resumeId } });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Update resume label ───────────────────────────────────────────────────
export async function updateResumeLabel(id: string, label: string, idToken: string) {
  try {
    const uid = await getAuthenticatedUserUID(idToken);
    const resume = await prisma.resume.findUnique({ where: { id } });
    if (!resume || resume.userId !== uid) return { success: false, error: 'Not authorized.' };

    await prisma.resume.update({ where: { id }, data: { label } });
    revalidatePath('/resumes');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
