import { supabase } from "@/src/lib/supabase";
import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { getAuthedUser, isAdmin, errorResponse, successResponse, sanitizeText } from "@/src/lib/security";

async function requireAdmin(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return { error: errorResponse("Please sign in", 401) };
  if (!(await isAdmin(user.id, supabaseAdmin))) return { error: errorResponse("Admin access required", 403) };
  return { user };
}

function slugify(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { data, error: dbErr } = await supabaseAdmin
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (dbErr) return errorResponse("Could not load categories", 500);
  return successResponse({ categories: data });
}

export async function POST(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const name = sanitizeText(body.name, 100);
  if (!name) return errorResponse("Category name is required", 400);

  const { data, error: dbErr } = await supabaseAdmin
    .from("categories")
    .insert({
      name,
      slug: slugify(name),
      description: body.description ? sanitizeText(body.description, 500) : null,
      parent_id: body.parentId || null,
      sort_order: Number(body.sortOrder) || 0,
    })
    .select()
    .single();

  if (dbErr) {
    if (dbErr.code === "23505") return errorResponse("A category with that name already exists", 409);
    return errorResponse("Could not create category", 500);
  }
  return successResponse({ category: data }, 201);
}

export async function PATCH(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  if (!body.id) return errorResponse("Category id is required", 400);

  const updates = {};
  if (body.name !== undefined) { updates.name = sanitizeText(body.name, 100); updates.slug = slugify(updates.name); }
  if (body.description !== undefined) updates.description = sanitizeText(body.description, 500);
  if (body.isActive !== undefined) updates.is_active = Boolean(body.isActive);
  if (body.sortOrder !== undefined) updates.sort_order = Number(body.sortOrder);

  const { data, error: dbErr } = await supabaseAdmin.from("categories").update(updates).eq("id", body.id).select().single();
  if (dbErr) return errorResponse("Could not update category", 500);
  return successResponse({ category: data });
}

export async function DELETE(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return errorResponse("Category id is required", 400);

  // Products referencing this category just get category_id = null (see migration's ON DELETE SET NULL) — no products are deleted
  const { error: dbErr } = await supabaseAdmin.from("categories").delete().eq("id", id);
  if (dbErr) return errorResponse("Could not delete category", 500);
  return successResponse({ deleted: true });
}
