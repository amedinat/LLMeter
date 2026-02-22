import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { connectProviderSchema } from '@/lib/validators/provider';
import { randomBytes, createCipheriv } from 'crypto';

// Use environment variable for key - fallback for types but must be set
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

function encryptApiKey(apiKey: string) {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY not set in environment variables');
  }

  // Key must be 32 bytes (64 hex chars)
  // If the env var is hex string, convert to buffer.
  const key = Buffer.from(ENCRYPTION_KEY, 'hex'); 
  const iv = randomBytes(16); // 16 bytes for AES-GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag,
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('providers')
      .select('id, provider, display_name, status, last_sync_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
    }

    return NextResponse.json({ providers: data });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = connectProviderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      );
    }

    const { provider, apiKey, displayName } = result.data;
    
    let encryptedData;
    try {
      encryptedData = encryptApiKey(apiKey);
    } catch (err) {
      console.error('Encryption failed:', err);
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    const { encrypted, iv, tag } = encryptedData;

    // Upsert provider
    const { data, error } = await supabase
      .from('providers')
      .upsert({
        user_id: user.id,
        provider,
        api_key_encrypted: encrypted,
        api_key_iv: iv,
        api_key_tag: tag,
        display_name: displayName || null,
        status: 'active',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id, provider' })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      provider: { 
        id: data.id, 
        provider: data.provider, 
        display_name: data.display_name 
      } 
    });
  } catch (error) {
    console.error('Error saving provider:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
