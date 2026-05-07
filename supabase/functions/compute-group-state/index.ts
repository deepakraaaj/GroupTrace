import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceRole)

serve(async (req) => {
  try {
    const { group_id } = await req.json()

    if (!group_id) {
      return new Response(
        JSON.stringify({ error: 'group_id required' }),
        { status: 400 }
      )
    }

    // Call the stored function (available in Postgres)
    const { data, error } = await supabase
      .rpc('compute_group_state', { p_group_id: group_id })

    if (error) throw error

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
