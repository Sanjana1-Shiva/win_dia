import { supabase } from "@/src/lib/supabase";
import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { getAuthedUser, isAdmin, errorResponse, successResponse } from "@/src/lib/security";
import { sendShippingUpdateEmail } from "@/src/lib/email";

const VALID_STATUSES = ["placed", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"];

export async function GET(req, { params }) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*), shipments(*)")
    .eq("id", params.id)
    .single();

  if (error || !order) return errorResponse("Order not found", 404);

  const admin = await isAdmin(user.id, supabaseAdmin);
  if (order.user_id !== user.id && !admin) return errorResponse("You do not have access to this order", 403);

  return successResponse({ order });
}

export async function PATCH(req, { params }) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);
  if (!(await isAdmin(user.id, supabaseAdmin))) return errorResponse("Admin access required", 403);

  const body = await req.json().catch(() => ({}));
  const { order_status, awb_code, courier_name } = body;
  const update = { updated_at: new Date().toISOString() };

  if (order_status) {
    if (!VALID_STATUSES.includes(order_status)) return errorResponse("Invalid order status", 400);
    update.order_status = order_status;
    if (order_status === "delivered") update.delivered_at = new Date().toISOString();
  }
  if (awb_code) update.awb_code = String(awb_code).slice(0, 60);
  if (courier_name) update.courier_name = String(courier_name).slice(0, 100);

  const { data, error } = await supabaseAdmin.from("orders").update(update).eq("id", params.id).select().single();
  if (error) return errorResponse("Could not update order", 500);

  if (order_status && data) {
    const { data: profile } = await supabaseAdmin.from("profiles").select("email").eq("id", data.user_id).maybeSingle();
    if (profile?.email) {
      sendShippingUpdateEmail(data, profile.email).catch((e) => console.error("Shipping update email failed:", e.message));
    }
  }

  return successResponse({ order: data });
}

export async function DELETE(req, { params }) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);

  const { data: order, error: fetchErr } = await supabaseAdmin
    .from("orders").select("id, user_id, order_status").eq("id", params.id).single();

  if (fetchErr || !order) return errorResponse("Order not found", 404);
  if (order.user_id !== user.id) return errorResponse("You do not have access to this order", 403);
  if (!["placed", "confirmed"].includes(order.order_status)) {
    return errorResponse("This order can no longer be cancelled — it has already shipped.", 409);
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({ order_status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", params.id).select().single();

  if (error) return errorResponse("Could not cancel order", 500);
  return successResponse({ order: data });
}
