import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { validateName, validateEmail, normalizeEmail, validatePhone } from "@/src/lib/validation";
import { rateLimit, getClientIp } from "@/src/lib/rateLimit";
import { errorResponse, successResponse, sanitizeText } from "@/src/lib/security";

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`contact:${ip}`, 5, 15 * 60 * 1000);
    if (!limit.allowed) return errorResponse("Too many messages sent. Please try again later.", 429);

    const body = await req.json().catch(() => ({}));
    const name = sanitizeText(body.name, 100);
    const email = normalizeEmail(body.email);
    const phone = body.phone ? sanitizeText(body.phone, 20) : null;
    const subject = body.subject ? sanitizeText(body.subject, 150) : null;
    const message = sanitizeText(body.message, 3000);

    const nameErr = validateName(name);
    if (nameErr) return errorResponse(nameErr, 400);

    const emailErr = validateEmail(email);
    if (emailErr) return errorResponse(emailErr, 400);

    if (phone) {
      const phoneErr = validatePhone(phone);
      if (phoneErr) return errorResponse(phoneErr, 400);
    }

    if (!message || message.trim().length < 10) {
      return errorResponse("Message must be at least 10 characters", 400);
    }

    const { error } = await supabaseAdmin
      .from("contact_messages")
      .insert({ name, email, phone, subject, message: message.trim() });

    if (error) {
      console.error("Contact message insert failed:", error.message);
      return errorResponse("Could not send your message. Please try again.", 500);
    }

    return successResponse({ message: "Thanks — we'll get back to you soon." });
  } catch (err) {
    console.error("Contact route error:", err.message);
    return errorResponse("Server error", 500);
  }
}
