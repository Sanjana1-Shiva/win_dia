import { supabase } from "@/src/lib/supabase";
import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { getAuthedUser, isAdmin, errorResponse, successResponse, sanitizeText } from "@/src/lib/security";

async function requireAdmin(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return { error: errorResponse("Please sign in", 401) };
  if (!(await isAdmin(user.id, supabaseAdmin))) return { error: errorResponse("Admin access required", 403) };
  return { user };
}

export async function GET(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { data, error: dbErr } = await supabaseAdmin.from("page_content").select("*").order("section").order("label");
  if (dbErr) return errorResponse("Could not load content", 500);
  return successResponse({ content: data });
}

// Upsert — edits an existing field, or creates a new one (e.g. to wire up a section not yet covered)
export async function PUT(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const key = body.key;
  if (!key || !/^[a-z0-9_.]+$/.test(key)) return errorResponse("Key must be lowercase letters, numbers, dots, and underscores only", 400);
  if (body.value === undefined) return errorResponse("Value is required", 400);

  const { data, error: dbErr } = await supabaseAdmin
    .from("page_content")
    .upsert({
      key,
      value: sanitizeText(String(body.value), 5000),
      section: body.section ? sanitizeText(body.section, 100) : "Custom",
      label: body.label ? sanitizeText(body.label, 150) : key,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (dbErr) return errorResponse("Could not save content", 500);
  return successResponse({ content: data });
}

export async function DELETE(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (!key) return errorResponse("Key is required", 400);

  const { error: dbErr } = await supabaseAdmin.from("page_content").delete().eq("key", key);
  if (dbErr) return errorResponse("Could not delete content", 500);
  return successResponse({ deleted: true });
}
