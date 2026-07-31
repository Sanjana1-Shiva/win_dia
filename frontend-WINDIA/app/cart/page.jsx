export const dynamic = "force-dynamic";
import Cart from "@/src/screens/Shop/Cart/Cart";
import AuthGuard from "@/src/auth/AuthGuard";
export default function Page(){
  return (
    <AuthGuard pageName="your cart">
      <Cart />
    </AuthGuard>
  );
}
