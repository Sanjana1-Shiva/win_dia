export const dynamic = "force-dynamic";
import ProductDetail from "@/src/screens/Shop/ProductDetail/ProductDetail";
import { supabaseAdmin } from "@/src/lib/supabase-admin";

export async function generateMetadata({ params }) {
  try {
    const { data: product } = await supabaseAdmin
      .from("products")
      .select("name, short_description, description, price, image, image_url")
      .eq("id", params.id)
      .single();

    if (!product) return { title: "Product Not Found" };

    const description = product.short_description || product.description || `Buy ${product.name} — a low-GI, healthy khakhra snack from WIN-DIA.`;
    const image = product.image_url || product.image;

    return {
      title: product.name,
      description,
      alternates: { canonical: `/product/${params.id}` },
      openGraph: {
        title: product.name,
        description,
        images: image ? [{ url: image, width: 800, height: 800, alt: product.name }] : undefined,
      },
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function Page({ params }) {
  let product = null;
  let reviewStats = null;
  try {
    const { data } = await supabaseAdmin
      .from("products")
      .select("name, description, price, image, image_url, count_in_stock")
      .eq("id", params.id)
      .single();
    product = data;

    const { data: reviews } = await supabaseAdmin.from("reviews").select("rating").eq("product_id", params.id);
    if (reviews && reviews.length > 0) {
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      reviewStats = { avg: Number(avg.toFixed(1)), count: reviews.length };
    }
  } catch {
    // ProductDetail's own client-side state will show a not-found view
  }

  const jsonLd = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: product.image_url || product.image || undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.price,
      availability: product.count_in_stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(reviewStats ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: reviewStats.avg,
        reviewCount: reviewStats.count,
      },
    } : {}),
  } : null;

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <ProductDetail />
    </>
  );
}
