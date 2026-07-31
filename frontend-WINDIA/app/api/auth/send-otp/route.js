import nodemailer from "nodemailer";
import { validateEmail, normalizeEmail, validateOtp } from "@/src/lib/validation";
import { rateLimit, getClientIp } from "@/src/lib/rateLimit";
import { errorResponse, successResponse } from "@/src/lib/security";

const otpStore = new Map();
const MAX_VERIFY_ATTEMPTS = 5;
const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const { email: rawEmail } = await req.json();
    const emailErr = validateEmail(rawEmail);
    if (emailErr) return errorResponse(emailErr, 400);
    const email = normalizeEmail(rawEmail);

    const ipLimit = rateLimit(`otp-send-ip:${ip}`, 10, 60 * 60 * 1000);
    if (!ipLimit.allowed) return errorResponse("Too many code requests from this device. Try again later.", 429);

    const existing = otpStore.get(email);
    if (existing && Date.now() - existing.sentAt < RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - existing.sentAt)) / 1000);
      return errorResponse(`Please wait ${waitSec}s before requesting another code.`, 429);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { otp, expires: Date.now() + OTP_TTL_MS, sentAt: Date.now(), attempts: 0 });

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    if (!gmailUser || !gmailPass) {
      console.error("OTP email not sent: GMAIL_USER/GMAIL_APP_PASSWORD not configured");
      return errorResponse("Email service is not configured yet.", 503);
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });

    await transporter.sendMail({
      from: `"WIN-DIA" <${gmailUser}>`,
      to: email,
      subject: "Your WIN-DIA Verification Code",
      html: `
        <div style="font-family:'DM Sans',sans-serif;max-width:480px;margin:0 auto;padding:40px;background:#fff;border-radius:16px;border:1px solid #f0e6df">
          <h2 style="font-family:'Cormorant Garamond',serif;font-size:32px;color:#5b3426;margin:0 0 8px">Welcome to WIN-DIA</h2>
          <p style="color:#84766f;font-size:15px;margin-bottom:32px">Your verification code is:</p>
          <div style="font-size:48px;font-weight:700;letter-spacing:12px;color:#c56a3d;text-align:center;padding:24px;background:#fff9f4;border-radius:12px;border:1.5px solid #f0e6df;margin-bottom:24px">
            ${otp}
          </div>
          <p style="color:#84766f;font-size:13px;text-align:center">This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>
      `,
    });

    return successResponse({});
  } catch (err) {
    console.error("OTP send error:", err.message);
    return errorResponse("Failed to send verification code", 500);
  }
}

export async function PUT(req) {
  try {
    const { email: rawEmail, otp } = await req.json();
    const emailErr = validateEmail(rawEmail);
    if (emailErr) return errorResponse(emailErr, 400);
    const otpErr = validateOtp(otp);
    if (otpErr) return errorResponse(otpErr, 400);

    const email = normalizeEmail(rawEmail);
    const stored = otpStore.get(email);

    if (!stored) return errorResponse("Code not found. Please request a new one.", 400);
    if (Date.now() > stored.expires) {
      otpStore.delete(email);
      return errorResponse("Code expired. Please request a new one.", 400);
    }
    if (stored.attempts >= MAX_VERIFY_ATTEMPTS) {
      otpStore.delete(email);
      return errorResponse("Too many incorrect attempts. Please request a new code.", 429);
    }
    if (stored.otp !== otp) {
      stored.attempts += 1;
      return errorResponse(`Incorrect code. ${MAX_VERIFY_ATTEMPTS - stored.attempts} attempt(s) left.`, 400);
    }

    otpStore.delete(email);
    return successResponse({ verified: true });
  } catch (err) {
    console.error("OTP verify error:", err.message);
    return errorResponse("Server error", 500);
  }
}
