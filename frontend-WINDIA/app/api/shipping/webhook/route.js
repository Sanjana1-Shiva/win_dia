import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { sendShippingUpdateEmail } from "@/src/lib/email";

/**
 * POST /api/shipping/webhook?secret=YOUR_SECRET
 * Configure in NimbusPost Dashboard > Settings > Webhooks:
 *   https://yourdomain.com/api/shipping/webhook?secret=<APP_SECRET>
 *
 * NimbusPost doesn't use HMAC-signed webhooks in their standard plan
 * (VERIFY against your account) — protected here by a shared secret
 * query param you set yourself in .env as APP_SECRET.
 */
const STATUS_MAP = {
  picked_up: "processing", in_transit: "shipped", out_for_delivery: "out_for_delivery",
  delivered: "delivered", rto_initiated: "returned", rto_delivered: "returned", cancelled: "cancelled",
};

export async function POST(req) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (!secret || secret !== process.env.APP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  if (!payload) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const awbCode = payload.awb || payload.awb_number; // VERIFY exact field name
  const rawStatus = (payload.status || payload.current_status || "").toLowerCase().replace(/\s+/g, "_");
  if (!awbCode) return NextResponse.json({ received: true });

  const { data: shipment } = await supabaseAdmin.from("shipments").select("id, order_id").eq("awb_code", awbCode).single();
  if (!shipment) {
    console.warn(`Shipping webhook: no shipment found for AWB ${awbCode}`);
    return NextResponse.json({ received: true });
  }

  await supabaseAdmin.from("shipments").update({ status: rawStatus, raw_response: payload, updated_at: new Date().toISOString() }).eq("id", shipment.id);

  const mappedStatus = STATUS_MAP[rawStatus];
  if (!mappedStatus) {
    console.warn(`Shipping webhook: unrecognized status "${rawStatus}" for AWB ${awbCode} — add it to STATUS_MAP`);
    return NextResponse.json({ received: true });
  }

  const update = { order_status: mappedStatus, updated_at: new Date().toISOString() };
  if (mappedStatus === "delivered") update.delivered_at = new Date().toISOString();
  const { data: updatedOrder } = await supabaseAdmin.from("orders").update(update).eq("id", shipment.order_id).select().single();

  if (updatedOrder) {
    const { data: profile } = await supabaseAdmin.from("profiles").select("email").eq("id", updatedOrder.user_id).maybeSingle();
    if (profile?.email) {
      sendShippingUpdateEmail(updatedOrder, profile.email).catch((e) => console.error("Shipping update email failed:", e.message));
    }
  }

  return NextResponse.json({ received: true });
}
