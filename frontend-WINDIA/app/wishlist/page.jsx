export const dynamic = "force-dynamic";
import Wishlist from "@/src/screens/Shop/Wishlist/Wishlist";
import AuthGuard from "@/src/auth/AuthGuard";
export default function Page(){
  return (
    <AuthGuard pageName="your wishlist">
      <Wishlist />
    </AuthGuard>
  );
}
