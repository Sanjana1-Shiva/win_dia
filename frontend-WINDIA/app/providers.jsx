"use client";
import { useEffect, useRef } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { AuthProvider } from "@/src/hooks/useAuth";
import store from "@/src/redux/store";
import { setCart } from "@/src/redux/slices/cartSlice";
import { setWishlist } from "@/src/redux/slices/wishlistSlice";
import { Toaster } from "react-hot-toast";

function ReduxPersistence() {
  const dispatch = useDispatch();
  const hydrated = useRef(false);
  const cartItems = useSelector((state) => state.cart.cartItems);
  const wishlistItems = useSelector((state) => state.wishlist.wishlistItems);

  useEffect(() => {
    try {
      const savedCart = JSON.parse(localStorage.getItem("cartItems") || "[]");
      const savedWishlist = JSON.parse(localStorage.getItem("wishlistItems") || "[]");
      dispatch(setCart(savedCart));
      dispatch(setWishlist(savedWishlist));
    } catch {
      dispatch(setCart([]));
      dispatch(setWishlist([]));
    } finally {
      hydrated.current = true;
    }
  }, [dispatch]);

  useEffect(() => {
    if (hydrated.current) localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (hydrated.current) localStorage.setItem("wishlistItems", JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  return null;
}

export default function Providers({ children }) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <ReduxPersistence />
        {children}
        <Toaster position="top-right" />
      </AuthProvider>
    </Provider>
  );
}
