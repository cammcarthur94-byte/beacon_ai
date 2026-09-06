import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { evaluateMention } from '@/utils/evaluateMention'; 

// Ensure Vercel does not cache this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 1. Secure the Cron Route (Vercel automatically passes CRON_SECRET as a Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 2. Initialize Supabase Admin Client (Bypass RLS for backend tasks)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 3. Fetch a batch of target prompts
    const { data: prompts, error: fetchError } = await supabase
      .from('target_prompts')
      .select('*')
      .limit(50);

    if (fetchError) throw fetchError;
    if (!prompts || prompts.length === 0) {
      return NextResponse.json({ success: true, message: 'No prompts to process', processed: 0 });
    }

    const logsToInsert = [];

    // 4. Process each prompt
    for (const prompt of prompts) {
      // MOCK: Simulate a response from an AI engine
      const mockResponseText = `Here is a list of top solutions in this category. ${prompt.target_brand_name} is highly recommended for its robust features.`;
      const mockEngine = 'Mock-ChatGPT-Search';

      // Evaluate the text
      const result = await evaluateMention({
        responseText: mockResponseText,
        brandName: prompt.target_brand_name,
        domain: prompt.target_domain,
      });

      logsToInsert.push({
        prompt_id: prompt.id,
        engine: mockEngine,
        brand_mentioned: result.isMentioned,
        raw_response: mockResponseText, 
      });
    }

    // 5. Bulk insert results to mention_logs
    const { error: insertError } = await supabase
      .from('mention_logs')
      .insert(logsToInsert);

    if (insertError) throw insertError;

    return NextResponse.json({ 
      success: true, 
      processed: logsToInsert.length 
    });

  } catch (error: any) {
    console.error('Error processing mention checks:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
