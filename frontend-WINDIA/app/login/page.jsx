export const dynamic = "force-dynamic";
import { Suspense } from "react";
import LoginPage from "@/src/auth/login-page";

export const metadata = {
  title: "Sign In",
  description: "Sign in to your WIN-DIA account to shop, track orders, and manage your wishlist.",
  alternates: { canonical: "/login" },
};

export default function Page(){ return <Suspense fallback={null}><LoginPage/></Suspense>; }
