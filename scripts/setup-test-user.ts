import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTestUser() {
  const email = 'otto.medina.ai@gmail.com';
  const password = 'TestPassword123!';

  // Check if user exists
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (user) {
    console.log(`User ${email} exists. Updating password...`);
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: password,
      email_confirm: true
    });
    if (error) console.error('Error updating password:', error);
    else console.log('Password updated successfully.');
  } else {
    console.log(`User ${email} not found. Creating...`);
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (error) console.error('Error creating user:', error);
    else console.log('User created successfully:', data.user.id);
  }
}

setupTestUser();
