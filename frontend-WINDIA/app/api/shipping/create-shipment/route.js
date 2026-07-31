import { supabase } from "@/src/lib/supabase";
import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { getAuthedUser, isAdmin, errorResponse, successResponse } from "@/src/lib/security";
import { getShippingProvider } from "@/src/lib/shipping";

export async function POST(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);
  if (!(await isAdmin(user.id, supabaseAdmin))) return errorResponse("Admin access required", 403);

  const { orderId } = await req.json().catch(() => ({}));
  if (!orderId) return errorResponse("orderId is required", 400);

  const { data: order, error } = await supabaseAdmin
    .from("orders").select("*, order_items(*)").eq("id", orderId).single();

  if (error || !order) return errorResponse("Order not found", 404);
  if (order.payment_method === "razorpay" && order.payment_status !== "paid") {
    return errorResponse("Cannot ship an unpaid order", 409);
  }
  if (order.awb_code) return errorResponse("This order already has a shipment created", 409);

  const provider = getShippingProvider();
  const result = await provider.createShipment({
    orderId: order.id, orderNumber: order.order_number, shippingAddress: order.shipping_address,
    items: order.order_items, totalPrice: order.total_price, paymentMethod: order.payment_method,
  });

  await supabaseAdmin.from("shipments").insert({
    order_id: order.id, provider: process.env.SHIPPING_PROVIDER || "nimbuspost",
    awb_code: result.awbCode || null, courier_name: result.courierName || null,
    status: result.success ? "created" : "failed", tracking_url: result.trackingUrl || null, raw_response: result.raw,
  });

  if (!result.success) return errorResponse(`Shipment creation failed: ${result.error}`, 502);

  await supabaseAdmin.from("orders").update({
    awb_code: result.awbCode, courier_name: result.courierName,
    shipping_provider: process.env.SHIPPING_PROVIDER || "nimbuspost",
    order_status: "processing", updated_at: new Date().toISOString(),
  }).eq("id", order.id);

  return successResponse({ awbCode: result.awbCode, courierName: result.courierName, trackingUrl: result.trackingUrl });
}
