import ResetPasswordPage from "@/src/auth/reset-password-page";

export const metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ResetPasswordPage />;
}
