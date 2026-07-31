import { supabase } from "@/src/lib/supabase";
import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { getAuthedUser, errorResponse, successResponse, sanitizeObject } from "@/src/lib/security";
import { validateName, validatePhone, normalizePhone } from "@/src/lib/validation";

export async function GET(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);

  const { data, error } = await supabaseAdmin.from("profiles").select("*").eq("id", user.id).single();
  if (error) return errorResponse("Could not load profile", 500);
  return successResponse({ profile: data });
}

export async function PATCH(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);

  const body = sanitizeObject(await req.json().catch(() => ({})), 200);
  const { name, phone, city, state, gender, dob } = body;

  const update = { updated_at: new Date().toISOString() };

  if (name !== undefined) {
    const nameErr = validateName(name);
    if (nameErr) return errorResponse(nameErr, 400);
    update.name = name.trim();
  }
  if (phone) {
    const normalized = normalizePhone(phone);
    const phoneErr = validatePhone(normalized);
    if (phoneErr) return errorResponse(phoneErr, 400);
    update.phone = normalized;
  }
  if (city !== undefined) update.city = city?.trim() || null;
  if (state !== undefined) update.state = state?.trim() || null;
  if (gender !== undefined) update.gender = gender || null;
  if (dob !== undefined) update.date_of_birth = dob || null;

  const { data, error } = await supabaseAdmin.from("profiles").update(update).eq("id", user.id).select().single();
  if (error) return errorResponse("Could not update profile", 500);

  return successResponse({ profile: data });
}
