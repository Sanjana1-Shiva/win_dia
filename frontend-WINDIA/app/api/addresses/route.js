import { supabase } from "@/src/lib/supabase";
import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { getAuthedUser, errorResponse, successResponse, sanitizeObject } from "@/src/lib/security";
import { validateAddress } from "@/src/lib/validation";

export async function GET(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);

  const { data, error } = await supabaseAdmin
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return errorResponse("Could not load addresses", 500);
  return successResponse({ addresses: data });
}

export async function POST(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);

  const body = sanitizeObject(await req.json().catch(() => ({})), 300);
  const errors = validateAddress(body);
  if (Object.keys(errors).length > 0) return errorResponse("Invalid address", 400, { fieldErrors: errors });

  if (body.isDefault) {
    await supabaseAdmin.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  }

  const { data, error } = await supabaseAdmin
    .from("addresses")
    .insert({
      user_id: user.id,
      type: ["home", "office", "other"].includes(body.type) ? body.type : "home",
      name: body.name.trim(),
      phone: body.phone.trim(),
      street: body.street.trim(),
      city: body.city.trim(),
      state: body.state.trim(),
      pincode: body.pincode.trim(),
      is_default: Boolean(body.isDefault),
    })
    .select()
    .single();

  if (error) return errorResponse("Could not save address", 500);
  return successResponse({ address: data }, 201);
}
