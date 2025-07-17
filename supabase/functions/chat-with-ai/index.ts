import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPEN_AI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPEN_AI_API_KEY is not set');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User error:', userError);
      throw new Error('User not authenticated');
    }

    console.log('User authenticated:', user.id);

    // Get user's profile information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
    }

    // Get user's credit information
    const { data: creditInfo, error: creditError } = await supabase
      .from('credit_info')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (creditError && creditError.code !== 'PGRST116') {
      console.error('Credit info error:', creditError);
    }

    // Get user's financial goals
    const { data: goals, error: goalsError } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', user.id);

    if (goalsError) {
      console.error('Goals error:', goalsError);
    }

    // Parse the request body
    const { message } = await req.json();
    console.log('User message:', message);

    // Create system prompt with user information
    let systemPrompt = `You are a helpful financial coach AI assistant. You provide personalized financial advice based on the user's information.

User Information:
- Name: ${profile?.first_name || 'Unknown'} ${profile?.last_name || ''}
- Age: ${profile?.age || 'Not provided'}
- Email: ${profile?.email || 'Not provided'}`;

    if (creditInfo) {
      systemPrompt += `

Credit Information:
- Credit Score: ${creditInfo.credit_score || 'Not provided'}
- Total Debt: $${creditInfo.total_debt || 'Not provided'}
- Late Payments: ${creditInfo.late_payments || 0}
- Credit Utilization: ${creditInfo.credit_utilization || 'Not provided'}%`;
    }

    if (goals && goals.length > 0) {
      systemPrompt += `

Financial Goals:`;
      goals.forEach((goal, index) => {
        systemPrompt += `
${index + 1}. ${goal.title}${goal.target_amount ? ` (Target: $${goal.target_amount})` : ''}${
          goal.target_date ? ` (Due: ${goal.target_date})` : ''
        }
   Status: ${goal.status || 'active'}
   Priority: ${goal.priority || 'medium'}`;
        if (goal.description) {
          systemPrompt += `
   Description: ${goal.description}`;
        }
      });
    }

    systemPrompt += `

Please provide helpful, personalized financial advice based on this information. Be encouraging, practical, and specific in your recommendations. If you don't have enough information about something, ask clarifying questions.`;

    console.log('System prompt created');

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI response generated');

    // Save both messages to chat history
    const { error: saveUserError } = await supabase.from('chat_history').insert({
      user_id: user.id,
      message: message,
      is_user_message: true,
    });

    if (saveUserError) {
      console.error('Error saving user message:', saveUserError);
    }

    const { error: saveAIError } = await supabase.from('chat_history').insert({
      user_id: user.id,
      message: aiResponse,
      is_user_message: false,
    });

    if (saveAIError) {
      console.error('Error saving AI message:', saveAIError);
    }

    console.log('Messages saved to chat history');

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat-with-ai function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
