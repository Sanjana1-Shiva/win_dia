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

  const { data, error: dbErr } = await supabaseAdmin.from("banners").select("*").order("position").order("sort_order");
  if (dbErr) return errorResponse("Could not load banners", 500);
  return successResponse({ banners: data });
}

export async function POST(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const title = sanitizeText(body.title, 150);
  const imageUrl = body.imageUrl;
  if (!title) return errorResponse("Banner title is required", 400);
  if (!imageUrl) return errorResponse("Banner image URL is required", 400);
  if (!["homepage", "offer", "festival"].includes(body.position)) return errorResponse("Invalid banner position", 400);

  const { data, error: dbErr } = await supabaseAdmin
    .from("banners")
    .insert({
      title,
      image_url: imageUrl,
      link_url: body.linkUrl || null,
      position: body.position,
      sort_order: Number(body.sortOrder) || 0,
    })
    .select()
    .single();

  if (dbErr) return errorResponse("Could not create banner", 500);
  return successResponse({ banner: data }, 201);
}

export async function PATCH(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  if (!body.id) return errorResponse("Banner id is required", 400);

  const updates = {};
  if (body.isActive !== undefined) updates.is_active = Boolean(body.isActive);
  if (body.sortOrder !== undefined) updates.sort_order = Number(body.sortOrder);
  if (body.title !== undefined) updates.title = sanitizeText(body.title, 150);
  if (body.linkUrl !== undefined) updates.link_url = body.linkUrl || null;

  const { data, error: dbErr } = await supabaseAdmin.from("banners").update(updates).eq("id", body.id).select().single();
  if (dbErr) return errorResponse("Could not update banner", 500);
  return successResponse({ banner: data });
}

export async function DELETE(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return errorResponse("Banner id is required", 400);

  const { error: dbErr } = await supabaseAdmin.from("banners").delete().eq("id", id);
  if (dbErr) return errorResponse("Could not delete banner", 500);
  return successResponse({ deleted: true });
}
