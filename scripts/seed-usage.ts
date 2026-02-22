import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Seeding usage data...');

  // Get a user
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError || !users.users.length) {
    console.error('No users found', userError);
    return;
  }
  const userId = users.users[0].id;
  console.log(`Using user: ${users.users[0].email} (${userId})`);

  // Create provider if not exists
  const { data: existingProvider, error: providerError } = await supabase
    .from('providers')
    .select('id')
    .eq('user_id', userId)
    .eq('provider', 'openai')
    .single();

  let providerId = existingProvider?.id;

  if (!providerId) {
    const { data: newProvider, error: createError } = await supabase
      .from('providers')
      .insert({
        user_id: userId,
        provider: 'openai',
        display_name: 'OpenAI (Seeded)',
        api_key_encrypted: 'dummy',
        api_key_iv: 'dummy',
        api_key_tag: 'dummy'
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating provider', createError);
      return;
    }
    providerId = newProvider.id;
  }

  // Generate 30 days of data
  const records = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Random usage
    const requests = Math.floor(Math.random() * 100);
    const inputTokens = requests * 500;
    const outputTokens = requests * 200;
    const cost = (inputTokens * 0.0000025) + (outputTokens * 0.00001); // Approx GPT-3.5

    records.push({
      provider_id: providerId,
      user_id: userId,
      date: dateStr,
      model: 'gpt-3.5-turbo',
      requests,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: cost,
      raw_data: { source: 'seed' }
    });

    // Add some GPT-4 usage too
    if (Math.random() > 0.5) {
      const requests4 = Math.floor(Math.random() * 20);
      const inputTokens4 = requests4 * 800;
      const outputTokens4 = requests4 * 400;
      const cost4 = (inputTokens4 * 0.00003) + (outputTokens4 * 0.00006); // Approx GPT-4

      records.push({
        provider_id: providerId,
        user_id: userId,
        date: dateStr,
        model: 'gpt-4',
        requests: requests4,
        input_tokens: inputTokens4,
        output_tokens: outputTokens4,
        cost_usd: cost4,
        raw_data: { source: 'seed' }
      });
    }
  }

  const { error: insertError } = await supabase
    .from('usage_records')
    .upsert(records, { onConflict: 'provider_id, date, model' });

  if (insertError) {
    console.error('Error seeding usage records', insertError);
  } else {
    console.log(`Inserted ${records.length} usage records successfully.`);
  }
}

seed().catch(console.error);
