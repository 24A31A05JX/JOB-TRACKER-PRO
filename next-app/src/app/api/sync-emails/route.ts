import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { google } from 'googleapis';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      return NextResponse.json({ error: "User profile not found in database." }, { status: 404 });
    }

    const account = userDoc.data();

    if (!account?.googleAccessToken) {
      return NextResponse.json({ error: "No Gmail connection active. Please reconnect." }, { status: 403 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: account.googleAccessToken
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // 2. Fetch recent unseen emails strictly matching job filters
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread (interview OR application OR applied OR offer -newsletter)',
      maxResults: 5
    });

    const messages = response.data.messages || [];
    let log = [];

    if (messages.length === 0) {
      return NextResponse.json({ message: "No relevant unread job emails found." });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: "application/json" }});

    for (const msg of messages) {
      if (!msg.id) continue;
      const fullMsg = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'metadata', metadataHeaders: ['Subject', 'From'] });
      
      const headers = fullMsg.data.payload?.headers;
      const subject = headers?.find(h => h.name === 'Subject')?.value || 'No Subject';
      const from = headers?.find(h => h.name === 'From')?.value || 'Unknown Sender';

      const prompt = `
        You are an AI Email Parser for a Job Tracker CRM. Analyze this email metadata.
        Does it indicate the user's job application moved to the "Interview" stage, "Offer" stage, or "Rejected" stage?
        If it's just a newsletter or unrelated, return null updates.
        
        Subject: ${subject}
        From: ${from}
        
        Return exactly this JSON schema:
        {
          "companyName": "The guessed company name based on sender domain or subject",
          "newStatus": "Interview" | "Offer" | "Rejected" | null
        }
      `;

      const aiRes = await model.generateContent(prompt);
      const parsed = JSON.parse(aiRes.response.text());

      if (parsed.newStatus && parsed.companyName) {
        log.push(`Detected ${parsed.newStatus} status from ${parsed.companyName} (${subject})`);
        
        // Query Firestore instead of Prisma
        const q = query(collection(db, "jobs"), where("userId", "in", [uid, account.email || '']));
        const querySnapshot = await getDocs(q);
        const existingJobs = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
        
        const match = existingJobs.find((j: any) => 
          j.companyName.toLowerCase().includes(parsed.companyName.toLowerCase()) || 
          parsed.companyName.toLowerCase().includes(j.companyName.toLowerCase())
        );

        if (match && match.status !== parsed.newStatus) {
           await updateDoc(doc(db, "jobs", match.id), { status: parsed.newStatus });
           log.push(`--> CRM Auto-Updated ${match.companyName} phase to: '${parsed.newStatus}'!`);
        }
      }

      await gmail.users.messages.modify({
        userId: 'me',
        id: msg.id,
        requestBody: { removeLabelIds: ['UNREAD'] }
      });
    }

    return NextResponse.json({ success: true, processed: messages.length, log });
  } catch (error: any) {
    if (error.code === 401) {
       return NextResponse.json({ error: "Access token expired. Please click 'Connect Workspace' again." }, { status: 401 });
    }
    console.error("Gmail OAuth/Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
