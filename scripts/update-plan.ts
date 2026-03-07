
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updatePlan() {
  const { data, error } = await supabase
    .from('profiles')
    .update({ plan: 'enterprise' })
    .eq('email', 'amedinat@hotmail.com')
    .select()

  if (error) {
    console.error('Error updating plan:', error.message)
    process.exit(1)
  }

  console.log('Successfully updated plan:', data)
}

updatePlan()
