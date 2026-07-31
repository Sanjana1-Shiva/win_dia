import RegisterPage from "@/src/auth/register-page";

export const metadata = {
  title: "Create Account",
  description: "Create your free WIN-DIA account to shop, track orders, and save your wishlist.",
  alternates: { canonical: "/register" },
};

export default function Page() {
  return <RegisterPage />;
}
