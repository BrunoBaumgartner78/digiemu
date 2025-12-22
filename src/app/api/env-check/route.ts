import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    cwd: process.cwd(),
    hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    hasBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    keys: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "SET" : "MISSING",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "SET" : "MISSING",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "SET" : "MISSING",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? "SET" : "MISSING",
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? "SET" : "MISSING",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "SET" : "MISSING",
    },
  });
}
