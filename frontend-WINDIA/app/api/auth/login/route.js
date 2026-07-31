import { NextResponse } from "next/server";
import { supabase } from "@/src/lib/supabase";
import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { validateEmail, normalizeEmail } from "@/src/lib/validation";
import { rateLimit, getClientIp } from "@/src/lib/rateLimit";
import { errorResponse } from "@/src/lib/security";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const { email: rawEmail, password } = await req.json();

    const ipLimit = rateLimit(`login-ip:${ip}`, 20, 15 * 60 * 1000);
    if (!ipLimit.allowed) return errorResponse("Too many login attempts from this device. Please try again later.", 429);

    const emailErr = validateEmail(rawEmail);
    if (emailErr || !password) return errorResponse("Email and password are required", 400);
    const email = normalizeEmail(rawEmail);

    const emailLimit = rateLimit(`login-email:${email}`, 8, 15 * 60 * 1000);
    if (!emailLimit.allowed) return errorResponse("Too many attempts on this account. Please wait 15 minutes.", 429);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, role, failed_login_attempts, locked_until")
      .eq("email", email)
      .single();

    if (profile?.locked_until && new Date(profile.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(profile.locked_until) - new Date()) / 60000);
      return errorResponse(`Account temporarily locked due to repeated failed attempts. Try again in ${minutesLeft} minute(s).`, 423);
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    await supabaseAdmin.from("login_attempts").insert({ email, ip, success: !error });

    if (error) {
      if (profile) {
        const attempts = (profile.failed_login_attempts || 0) + 1;
        const update = { failed_login_attempts: attempts };
        if (attempts >= MAX_FAILED_ATTEMPTS) {
          update.locked_until = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString();
        }
        await supabaseAdmin.from("profiles").update(update).eq("id", profile.id);
      }
      return errorResponse("Invalid email or password", 401);
    }

    if (profile) {
      await supabaseAdmin.from("profiles").update({ failed_login_attempts: 0, locked_until: null }).eq("id", profile.id);
    }

    return NextResponse.json({
      success: true,
      user: { id: data.user.id, email: data.user.email, name: data.user.user_metadata?.name || "", role: profile?.role || "customer" },
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      expires_at: data.session?.expires_at,
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return errorResponse("Server error", 500);
  }
}
