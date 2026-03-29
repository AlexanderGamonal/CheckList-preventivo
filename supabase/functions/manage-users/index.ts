import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = (Deno.env.get("ALLOWED_ORIGIN") || "*").replace(/\/$/, "");

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowed = ALLOWED_ORIGIN === "*" || origin === ALLOWED_ORIGIN ? origin || "*" : ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

function json(data: unknown, status: number, req: Request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  const SUPABASE_URL             = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY        = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // ── 1. Verificar sesión (patrón oficial Supabase Edge Functions) ──
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized: no token" }, 401, req);

  // Crear cliente con el JWT del usuario — Supabase valida internamente
  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth:   { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user: caller }, error: authError } = await supabaseClient.auth.getUser();
  if (authError || !caller) {
    return json({ error: "Unauthorized: invalid session" }, 401, req);
  }

  // ── 2. Verificar que es superadmin ────────────────────────────────
  if (caller.user_metadata?.role !== "superadmin") {
    return json({ error: "Forbidden: solo superadmin" }, 403, req);
  }

  // ── 3. Cliente admin para operaciones privilegiadas ───────────────
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "list") {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
      if (error) throw error;
      return json({ users: data.users }, 200, req);
    }

    if (action === "invite") {
      const { email, role } = body;
      if (!email || !role) return json({ error: "email y role son requeridos" }, 400, req);
      if (!["admin", "superadmin"].includes(role)) return json({ error: "Rol inválido" }, 400, req);
      const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { role },
      });
      if (error) throw error;
      return json({ user: data.user }, 200, req);
    }

    if (action === "update_role") {
      const { userId, role } = body;
      if (!userId || !role) return json({ error: "userId y role son requeridos" }, 400, req);
      if (!["admin", "superadmin"].includes(role)) return json({ error: "Rol inválido" }, 400, req);
      if (userId === caller.id) return json({ error: "No puedes cambiar tu propio rol" }, 400, req);
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { role },
      });
      if (error) throw error;
      return json({ user: data.user }, 200, req);
    }

    if (action === "delete") {
      const { userId } = body;
      if (!userId) return json({ error: "userId es requerido" }, 400, req);
      if (userId === caller.id) return json({ error: "No puedes eliminar tu propia cuenta" }, 400, req);
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) throw error;
      return json({ success: true }, 200, req);
    }

    return json({ error: "Acción inválida" }, 400, req);

  } catch (err) {
    return json({ error: (err as Error).message }, 500, req);
  }
});
