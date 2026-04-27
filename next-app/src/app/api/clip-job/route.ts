import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserUID } from '@/lib/firebase-admin';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized. Missing or invalid token.' }, { status: 401, headers: corsHeaders });
    }

    const token = authHeader.split('Bearer ')[1];
    let uid: string;
    try {
      uid = await getAuthenticatedUserUID(token);
    } catch (authErr) {
      return NextResponse.json({ error: 'Unauthorized. Invalid authentication token.' }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { jobTitle, companyName, location, jobUrl, status } = body;

    if (!jobTitle || !companyName) {
      return NextResponse.json({ error: 'Missing required fields: jobTitle, companyName' }, { status: 400, headers: corsHeaders });
    }

    // Map extension status natively assuming it sends proper values or defaults to WISHLIST
    const mappedStatus = ['WISHLIST', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'].includes(status?.toUpperCase()) 
      ? status.toUpperCase() 
      : 'WISHLIST';

    const newJob = await prisma.job.create({
      data: {
        userId: uid,
        jobTitle,
        companyName,
        location: location || null,
        jobUrl: jobUrl || null,
        status: mappedStatus as any,
      }
    });

    return NextResponse.json({ success: true, id: newJob.id }, { status: 201, headers: corsHeaders });
  } catch (err: any) {
    console.error('SERVER ERROR IN CLIP-JOB:', err);
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
