import { supabase } from "@/src/lib/supabase";
import { validateEmail, normalizeEmail } from "@/src/lib/validation";
import { rateLimit, getClientIp } from "@/src/lib/rateLimit";
import { errorResponse, successResponse } from "@/src/lib/security";

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const { email: rawEmail } = await req.json();
    const emailErr = validateEmail(rawEmail);
    if (emailErr) return errorResponse(emailErr, 400);
    const email = normalizeEmail(rawEmail);

    const limit = rateLimit(`forgot-pw:${ip}:${email}`, 4, 15 * 60 * 1000);
    if (!limit.allowed) return errorResponse("Too many requests. Please try again later.", 429);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl}/reset-password` });

    // Same message whether or not the email exists — prevents account enumeration
    return successResponse({ message: "If an account exists for that email, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    return errorResponse("Server error", 500);
  }
}
