export const dynamic = "force-dynamic";
import { Suspense } from "react";
import AccountPage from "@/src/auth/account-page";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AccountPage/>
    </Suspense>
  );
}