export const dynamic = "force-dynamic";
import Checkout from "@/src/screens/Shop/Checkout/Checkout";
import AuthGuard from "@/src/auth/AuthGuard";
export default function Page(){
  return (
    <AuthGuard pageName="checkout">
      <Checkout />
    </AuthGuard>
  );
}
