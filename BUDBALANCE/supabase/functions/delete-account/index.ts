import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const jsonHeaders = {
  "Content-Type": "application/json",
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: jsonHeaders,
    })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing function secrets" }), {
        status: 500,
        headers: jsonHeaders,
      })
    }

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: jsonHeaders,
      })
    }

    // Get current user from token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    const {
      data: { user },
      error: getUserError,
    } = await userClient.auth.getUser()

    if (getUserError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: jsonHeaders,
      })
    }

    // Admin client (IMPORTANT)
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Delete user data from tables
    const tables = ["purchases", "settings", "favorites"]

    for (const table of tables) {
      const { error } = await adminClient.from(table).delete().eq("user_id", user.id)
      if (error) {
        return new Response(
          JSON.stringify({ error: `Failed deleting from ${table}: ${error.message}` }),
          {
            status: 500,
            headers: jsonHeaders,
          },
        )
      }
    }

    // Delete auth user
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(user.id)

    if (deleteUserError) {
      return new Response(
        JSON.stringify({ error: `Failed deleting auth user: ${deleteUserError.message}` }),
        {
          status: 500,
          headers: jsonHeaders,
        },
      )
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: jsonHeaders,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: jsonHeaders,
    })
  }
})