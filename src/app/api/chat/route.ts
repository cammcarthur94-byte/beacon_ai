import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'The chat bot function has been decommissioned. Please use the Gemini 3.8 Flash AEO Content Studio (/consultant or /api/content-studio) for content creation, recommendations, and multi-angle email drafting.',
    },
    { status: 410 }
  );
}
