import { NextResponse } from 'next/server';

export async function GET() {
  const hasGeminiKey = Boolean(
    process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  );

  return NextResponse.json({
    ok: true,
    provider: 'gemini',
    configured: hasGeminiKey,
    label: hasGeminiKey ? 'Assistente IA online' : 'Assistente IA offline',
  });
}
