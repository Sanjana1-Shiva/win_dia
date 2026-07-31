import { supabase } from "@/src/lib/supabase";
import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { getAuthedUser, isAdmin, errorResponse, successResponse } from "@/src/lib/security";

export async function GET(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);
  if (!(await isAdmin(user.id, supabaseAdmin))) return errorResponse("Admin access required", 403);

  const [{ count: totalOrders }, { count: pendingOrders }, { count: totalProducts }, { count: totalUsers }, { data: paidOrders }, { data: statusRows }] =
    await Promise.all([
      supabaseAdmin.from("orders").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("orders").select("*", { count: "exact", head: true }).in("order_status", ["placed", "confirmed", "processing"]),
      supabaseAdmin.from("products").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("orders").select("total_price").eq("payment_status", "paid"),
      supabaseAdmin.from("orders").select("order_status"),
    ]);

  const totalRevenue = (paidOrders || []).reduce((sum, o) => sum + Number(o.total_price || 0), 0);

  const statusBreakdown = {};
  for (const row of statusRows || []) {
    statusBreakdown[row.order_status] = (statusBreakdown[row.order_status] || 0) + 1;
  }

  return successResponse({
    stats: {
      totalOrders: totalOrders || 0,
      pendingOrders: pendingOrders || 0,
      totalProducts: totalProducts || 0,
      totalUsers: totalUsers || 0,
      totalRevenue,
      statusBreakdown,
    },
  });
}
