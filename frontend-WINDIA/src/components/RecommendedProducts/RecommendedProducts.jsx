"use client";
import { useEffect, useState } from "react";
import ProductCard from "@/src/components/ProductCard/ProductCard";
import { getRecommendedProducts } from "@/src/screens/Shop/lib/products";
import "./RecommendedProducts.css";

/**
 * Shows personalized "You might also like" picks based on what's already
 * in the cart or wishlist (same category/flavor), excluding items the
 * user already has. Renders nothing if there's not enough signal yet.
 */
export default function RecommendedProducts({ items = [], title = "You might also like" }) {
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!items || items.length === 0) { setLoading(false); return; }

    const categoryIds = items.map((p) => p.categoryId).filter(Boolean);
    const flavors = items.map((p) => p.flavor).filter(Boolean);
    const excludeIds = items.map((p) => p._id || p.id).filter(Boolean);

    setLoading(true);
    getRecommendedProducts({ categoryIds, flavors, excludeIds, limit: 4 })
      .then(setRecommended)
      .finally(() => setLoading(false));
  }, [items]);

  if (loading || recommended.length === 0) return null;

  return (
    <section className="recommended-section">
      <h3 className="recommended-title">{title}</h3>
      <div className="recommended-grid">
        {recommended.map((product, i) => (
          <ProductCard key={product._id || product.id} product={product} index={i} />
        ))}
      </div>
    </section>
  );
}
