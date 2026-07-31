import { supabase } from "@/src/lib/supabase";
import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { getAuthedUser, errorResponse, successResponse, sanitizeObject } from "@/src/lib/security";
import { validateAddress } from "@/src/lib/validation";

async function assertOwnership(userId, addressId) {
  const { data } = await supabaseAdmin.from("addresses").select("id, user_id").eq("id", addressId).single();
  return data && data.user_id === userId;
}

export async function PATCH(req, { params }) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);
  if (!(await assertOwnership(user.id, params.id))) return errorResponse("Address not found", 404);

  const body = sanitizeObject(await req.json().catch(() => ({})), 300);
  const errors = validateAddress({ ...body });
  if (Object.keys(errors).length > 0) return errorResponse("Invalid address", 400, { fieldErrors: errors });

  if (body.isDefault) {
    await supabaseAdmin.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  }

  const { data, error } = await supabaseAdmin
    .from("addresses")
    .update({
      type: ["home", "office", "other"].includes(body.type) ? body.type : "home",
      name: body.name.trim(),
      phone: body.phone.trim(),
      street: body.street.trim(),
      city: body.city.trim(),
      state: body.state.trim(),
      pincode: body.pincode.trim(),
      is_default: Boolean(body.isDefault),
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return errorResponse("Could not update address", 500);
  return successResponse({ address: data });
}

export async function DELETE(req, { params }) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);
  if (!(await assertOwnership(user.id, params.id))) return errorResponse("Address not found", 404);

  const { error } = await supabaseAdmin.from("addresses").delete().eq("id", params.id);
  if (error) return errorResponse("Could not delete address", 500);
  return successResponse({ deleted: true });
}
