import { supabase } from "@/src/lib/supabase";
import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { getAuthedUser, errorResponse, successResponse, sanitizeObject } from "@/src/lib/security";
import { validateAddress } from "@/src/lib/validation";
import { rateLimit, getClientIp } from "@/src/lib/rateLimit";
import { getRazorpayClient } from "@/src/lib/razorpay";
import { sendOrderConfirmationEmail, sendAdminNewOrderAlert } from "@/src/lib/email";

/**
 * POST /api/orders
 * Creates an order from the authenticated user's cart.
 *
 * SECURITY: prices/stock/totals are never taken from the request body.
 * Every item's price is re-fetched from `products` here and totals are
 * recomputed — a tampered client request can't change what gets charged.
 */
export async function POST(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in to place an order", 401);

  const ip = getClientIp(req);
  const limit = rateLimit(`order-create:${user.id}:${ip}`, 10, 10 * 60 * 1000);
  if (!limit.allowed) return errorResponse("Too many order attempts. Please wait a few minutes.", 429);

  let body;
  try { body = await req.json(); } catch { return errorResponse("Invalid request body", 400); }

  const { items, shippingAddress, paymentMethod, orderNotes, deliverySpeed, couponCode } = sanitizeObject(body, 2000);

  if (!Array.isArray(items) || items.length === 0) return errorResponse("Your cart is empty", 400);
  if (items.length > 50) return errorResponse("Too many items in a single order", 400);
  if (!["razorpay", "cod"].includes(paymentMethod)) return errorResponse("Invalid payment method", 400);

  const addressErrors = validateAddress(shippingAddress || {});
  if (Object.keys(addressErrors).length > 0) {
    return errorResponse("Please provide a complete, valid delivery address", 400, { fieldErrors: addressErrors });
  }

  const productIds = [...new Set(items.map((i) => i.productId || i.id || i._id).filter(Boolean))];
  if (productIds.length === 0) return errorResponse("Cart items are missing product references", 400);

  const { data: products, error: prodErr } = await supabaseAdmin
    .from("products")
    .select("id, name, price, image, image_url, count_in_stock, is_active, net_weight, weight")
    .in("id", productIds);

  if (prodErr) {
    console.error("Order creation - product lookup failed:", prodErr.message);
    return errorResponse("Could not verify products. Please try again.", 500);
  }

  const productMap = new Map((products || []).map((p) => [p.id, p]));
  const orderItems = [];
  let itemsPrice = 0;

  for (const raw of items) {
    const productId = raw.productId || raw.id || raw._id;
    const product = productMap.get(productId);
    const qty = Math.max(1, Math.min(20, parseInt(raw.qty, 10) || 1));

    if (!product || product.is_active === false) {
      return errorResponse("One of the items in your cart is no longer available.", 409);
    }
    if (product.count_in_stock < qty) {
      return errorResponse(`"${product.name}" only has ${product.count_in_stock} left in stock.`, 409, {
        productId: product.id, available: product.count_in_stock,
      });
    }

    itemsPrice += Number(product.price) * qty;
    orderItems.push({
      product_id: product.id, name: product.name,
      image: product.image || product.image_url || null,
      price: Number(product.price), qty, flavor: raw.flavor || null,
      net_weight_grams: Number(product.net_weight ?? product.weight ?? 0),
    });
  }

  const shippingPrice = itemsPrice >= 499 ? 0 : 50;
  const expressSurcharge = deliverySpeed === "express" ? 100 : 0;

  const { data: taxSetting } = await supabaseAdmin.from("settings").select("value").eq("key", "tax_rate_percent").maybeSingle();
  const taxRatePercent = taxSetting ? Number(taxSetting.value) : 5; // falls back to 5% if the setting row is ever missing
  const taxPrice = Math.round(itemsPrice * (taxRatePercent / 100) * 100) / 100;

  // Coupon — validated here, not trusted from the client. The checkout UI
  // shows a preview discount, but this is the number that's actually charged.
  let discountPrice = 0;
  let appliedCouponCode = null;
  if (couponCode) {
    const { data: coupon } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .ilike("code", couponCode.trim())
      .maybeSingle();

    if (coupon && coupon.active
      && (!coupon.expires_at || new Date(coupon.expires_at) > new Date())
      && (!coupon.usage_limit || coupon.times_used < coupon.usage_limit)
      && itemsPrice >= Number(coupon.min_order_value || 0)
    ) {
      discountPrice = Math.round(itemsPrice * (Number(coupon.discount_percent) / 100) * 100) / 100;
      appliedCouponCode = coupon.code;
      await supabaseAdmin.from("coupons").update({ times_used: coupon.times_used + 1 }).eq("id", coupon.id);
    }
    // Invalid/expired/ineligible coupon → silently ignored (discount stays 0),
    // same as if none was entered. The order still goes through.
  }

  const totalPrice = Math.round((itemsPrice + taxPrice + shippingPrice + expressSurcharge - discountPrice) * 100) / 100;

  const { data: orderNumberData } = await supabaseAdmin.rpc("generate_order_number");
  const orderNumber = orderNumberData || `WIN-${Date.now()}`;

  const { data: order, error: orderErr } = await supabaseAdmin
    .from("orders")
    .insert({
      order_number: orderNumber, user_id: user.id, shipping_address: shippingAddress,
      order_notes: orderNotes || null, items_price: itemsPrice, tax_price: taxPrice,
      shipping_price: shippingPrice + expressSurcharge, discount_price: discountPrice,
      coupon_code: appliedCouponCode, total_price: totalPrice,
      payment_method: paymentMethod, payment_status: "pending", order_status: "placed",
    })
    .select()
    .single();

  if (orderErr) {
    console.error("Order insert failed:", orderErr.message);
    return errorResponse("Could not create order. Please try again.", 500);
  }

  const { error: itemsErr } = await supabaseAdmin
    .from("order_items")
    .insert(orderItems.map((i) => ({ ...i, order_id: order.id })));

  if (itemsErr) {
    console.error("Order items insert failed:", itemsErr.message);
    await supabaseAdmin.from("orders").delete().eq("id", order.id);
    return errorResponse("Could not create order. Please try again.", 500);
  }

  // Decrement stock now to prevent overselling between order creation and payment.
  for (const item of orderItems) {
    await supabaseAdmin
      .from("products")
      .update({ count_in_stock: productMap.get(item.product_id).count_in_stock - item.qty })
      .eq("id", item.product_id);
  }

  if (paymentMethod === "cod") {
    const orderWithItems = { ...order, order_items: orderItems };
    // Fire-and-forget — a slow/failed email shouldn't block the order response
    sendOrderConfirmationEmail(orderWithItems, user.email).catch((e) => console.error("Order confirmation email failed:", e.message));
    sendAdminNewOrderAlert(order).catch((e) => console.error("Admin order alert failed:", e.message));
    return successResponse({ order, requiresPayment: false });
  }

  try {
    const razorpay = getRazorpayClient();
    const rpOrder = await razorpay.orders.create({
      amount: Math.round(totalPrice * 100),
      currency: "INR",
      receipt: order.order_number,
      notes: { internal_order_id: order.id },
    });

    await supabaseAdmin.from("orders").update({ razorpay_order_id: rpOrder.id }).eq("id", order.id);

    return successResponse({
      order, requiresPayment: true,
      razorpay: { orderId: rpOrder.id, amount: rpOrder.amount, currency: rpOrder.currency, keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID },
    });
  } catch (err) {
    console.error("Razorpay order creation failed:", err.message);
    return errorResponse("Payment gateway is not configured yet. Set your Razorpay keys (see SETUP.md).", 503);
  }
}

/** GET /api/orders — list the authenticated user's own order history. */
export async function GET(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return errorResponse("Could not load orders", 500);
  return successResponse({ orders: data });
}
