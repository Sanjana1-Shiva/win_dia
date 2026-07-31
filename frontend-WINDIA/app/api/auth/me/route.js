import { supabase } from "@/src/lib/supabase";
import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { getAuthedUser, errorResponse, successResponse } from "@/src/lib/security";

export async function GET(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Not authenticated", 401);

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, name, email, phone, role, city, state")
    .eq("id", user.id)
    .single();

  return successResponse({
    user: {
      id: user.id,
      email: user.email,
      name: profile?.name || user.user_metadata?.name || "",
      role: profile?.role || "customer",
      phone: profile?.phone || null,
    },
  });
}
