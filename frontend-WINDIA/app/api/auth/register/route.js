import { supabase } from "@/src/lib/supabase";
import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { validateName, validateEmail, normalizeEmail, validatePassword, validatePhone, normalizePhone, validateDOB } from "@/src/lib/validation";
import { rateLimit, getClientIp } from "@/src/lib/rateLimit";
import { errorResponse, successResponse, sanitizeText } from "@/src/lib/security";

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`register:${ip}`, 6, 60 * 60 * 1000);
    if (!limit.allowed) return errorResponse("Too many registration attempts. Please try again later.", 429);

    const body = await req.json();
    const name = sanitizeText(body.name, 60);
    const email = normalizeEmail(body.email);
    const { password } = body;
    const phone = body.phone ? normalizePhone(body.phone) : "";
    const dob = body.dob || null;
    const city = sanitizeText(body.city, 60);
    const state = sanitizeText(body.state, 60);
    const gender = sanitizeText(body.gender, 20);

    const nameErr = validateName(name);
    if (nameErr) return errorResponse(nameErr, 400);

    const emailErr = validateEmail(email);
    if (emailErr) return errorResponse(emailErr, 400);

    const passErr = validatePassword(password);
    if (passErr) return errorResponse(passErr, 400);

    if (phone) {
      const phoneErr = validatePhone(phone);
      if (phoneErr) return errorResponse(phoneErr, 400);

      const { data: existingPhone } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("phone", phone)
        .maybeSingle();
      if (existingPhone) return errorResponse("This phone number is already registered", 409);
    }

    const dobErr = validateDOB(dob);
    if (dobErr) return errorResponse(dobErr, 400);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone } },
    });

    if (error) return errorResponse(error.message || "Could not create account", 400);

    if (data.user) {
      await supabaseAdmin.from("profiles").upsert({
        id: data.user.id,
        name,
        email,
        phone: phone || null,
        date_of_birth: dob,
        city: city || null,
        state: state || null,
        gender: gender || null,
        role: "customer",
        updated_at: new Date().toISOString(),
      });
    }

    if (!data.session) {
      return successResponse({ requiresConfirmation: true, message: "Account created! Please check your email to confirm, then sign in." });
    }

    return successResponse({
      user: { id: data.user.id, email: data.user.email, name },
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (err) {
    console.error("Register error:", err.message);
    return errorResponse("Server error", 500);
  }
}
