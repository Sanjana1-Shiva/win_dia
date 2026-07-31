import { supabase } from "@/src/lib/supabase";
import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { getAuthedUser, isAdmin, errorResponse, successResponse } from "@/src/lib/security";
import { getShippingProvider } from "@/src/lib/shipping";

export async function GET(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);

  const orderId = new URL(req.url).searchParams.get("orderId");
  if (!orderId) return errorResponse("orderId is required", 400);

  const { data: order, error } = await supabaseAdmin
    .from("orders").select("id, user_id, awb_code, order_status").eq("id", orderId).single();

  if (error || !order) return errorResponse("Order not found", 404);

  const admin = await isAdmin(user.id, supabaseAdmin);
  if (order.user_id !== user.id && !admin) return errorResponse("You do not have access to this order", 403);

  if (!order.awb_code) return successResponse({ status: order.order_status, history: [], shipped: false });

  const provider = getShippingProvider();
  const result = await provider.trackShipment(order.awb_code);
  if (!result.success) return errorResponse(`Could not fetch live tracking: ${result.error}`, 502);

  return successResponse({ status: result.status, history: result.history, shipped: true, awbCode: order.awb_code });
}
