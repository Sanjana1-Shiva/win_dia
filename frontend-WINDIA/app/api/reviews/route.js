import { supabase } from "@/src/lib/supabase";
import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { getAuthedUser, errorResponse, successResponse, sanitizeText } from "@/src/lib/security";
import { rateLimit, getClientIp } from "@/src/lib/rateLimit";

export async function GET(req) {
  const productId = new URL(req.url).searchParams.get("productId");
  if (!productId) return errorResponse("productId is required", 400);

  const { data: reviews, error } = await supabaseAdmin
    .from("reviews")
    .select("id, rating, title, comment, is_verified_purchase, created_at, user_id")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) return errorResponse("Could not load reviews", 500);

  // reviews.user_id points at auth.users, not profiles, so PostgREST can't
  // auto-embed profiles(name) here (no direct foreign key between them) —
  // that's exactly what was causing every product page's reviews to 400.
  // Fetch names separately and map them in instead.
  const userIds = [...new Set((reviews || []).map((r) => r.user_id).filter(Boolean))];
  let nameMap = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, name").in("id", userIds);
    nameMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.name]));
  }

  const result = (reviews || []).map((r) => ({
    id: r.id,
    name: nameMap[r.user_id] || "Anonymous",
    rating: r.rating,
    title: r.title,
    text: r.comment,
    verified: r.is_verified_purchase,
    date: new Date(r.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
  }));

  return successResponse({ reviews: result });
}

export async function POST(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in to leave a review", 401);

  const ip = getClientIp(req);
  const limit = rateLimit(`review:${user.id}:${ip}`, 10, 60 * 60 * 1000);
  if (!limit.allowed) return errorResponse("Too many reviews submitted. Please try again later.", 429);

  const body = await req.json().catch(() => ({}));
  const productId = body.productId;
  const rating = Number(body.rating);
  const title = body.title ? sanitizeText(body.title, 100) : null;
  const comment = sanitizeText(body.comment, 2000);

  if (!productId) return errorResponse("productId is required", 400);
  if (!rating || rating < 1 || rating > 5) return errorResponse("Rating must be between 1 and 5", 400);
  if (!comment || comment.trim().length < 5) return errorResponse("Review must be at least 5 characters", 400);

  // Verified Purchase: does this user have any paid order containing this product?
  const { data: matchingOrder } = await supabaseAdmin
    .from("order_items")
    .select("order_id, orders!inner(id, user_id, payment_status)")
    .eq("product_id", productId)
    .eq("orders.user_id", user.id)
    .eq("orders.payment_status", "paid")
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .insert({
      product_id: productId,
      user_id: user.id,
      order_id: matchingOrder?.order_id || null,
      rating,
      title,
      comment: comment.trim(),
      is_verified_purchase: Boolean(matchingOrder),
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return errorResponse("You've already reviewed this product", 409);
    return errorResponse("Could not submit review", 500);
  }

  return successResponse({ review: data }, 201);
}
