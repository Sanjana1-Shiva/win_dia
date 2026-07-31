import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { verifyWebhookSignature } from "@/src/lib/razorpay";

/**
 * Configure in Razorpay Dashboard > Settings > Webhooks:
 *   https://yourdomain.com/api/payment/webhook
 * Subscribe to: payment.captured, payment.failed, order.paid
 *
 * This fires even if the customer closes their browser right after
 * paying, so it's the real source of truth for payment status —
 * unlike /api/payment/verify which is just for instant UI feedback.
 */
export async function POST(req) {
  const signature = req.headers.get("x-razorpay-signature");
  const rawBody = await req.text();

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    console.warn("Razorpay webhook: invalid signature — request rejected");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload;
  try { payload = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Invalid payload" }, { status: 400 }); }

  const eventType = payload.event;
  const paymentEntity = payload.payload?.payment?.entity;
  const razorpayOrderId = paymentEntity?.order_id;
  const razorpayPaymentId = paymentEntity?.id;

  await supabaseAdmin.from("payment_events").insert({
    razorpay_order_id: razorpayOrderId || null, razorpay_payment_id: razorpayPaymentId || null,
    event_type: eventType || "unknown", status: paymentEntity?.status || "unknown", raw_payload: payload,
  });

  if (!razorpayOrderId) return NextResponse.json({ received: true });

  const { data: order } = await supabaseAdmin
    .from("orders").select("id, payment_status").eq("razorpay_order_id", razorpayOrderId).single();

  if (!order) {
    console.warn(`Razorpay webhook: no order found for razorpay_order_id ${razorpayOrderId}`);
    return NextResponse.json({ received: true });
  }

  if (eventType === "payment.captured" || eventType === "order.paid") {
    if (order.payment_status !== "paid") {
      await supabaseAdmin.from("orders").update({
        payment_status: "paid", order_status: "confirmed", razorpay_payment_id: razorpayPaymentId, updated_at: new Date().toISOString(),
      }).eq("id", order.id);
    }
  } else if (eventType === "payment.failed") {
    if (order.payment_status === "pending") {
      await supabaseAdmin.from("orders").update({ payment_status: "failed", updated_at: new Date().toISOString() }).eq("id", order.id);
    }
  }

  return NextResponse.json({ received: true });
}
