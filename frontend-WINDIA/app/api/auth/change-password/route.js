import { supabase } from "@/src/lib/supabase";
import { getAuthedUser, errorResponse, successResponse } from "@/src/lib/security";
import { validatePassword } from "@/src/lib/validation";
import { rateLimit, getClientIp } from "@/src/lib/rateLimit";

export async function POST(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);

  const ip = getClientIp(req);
  const limit = rateLimit(`change-pw:${user.id}:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) return errorResponse("Too many attempts. Please try again later.", 429);

  const { currentPassword, newPassword } = await req.json().catch(() => ({}));
  if (!currentPassword || !newPassword) return errorResponse("Current and new password are required", 400);

  const passErr = validatePassword(newPassword);
  if (passErr) return errorResponse(passErr, 400);

  const { error: verifyErr } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
  if (verifyErr) return errorResponse("Current password is incorrect", 401);

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return errorResponse(error.message || "Could not update password", 400);

  return successResponse({ message: "Password updated successfully" });
}
