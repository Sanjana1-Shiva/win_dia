import { supabaseAdmin } from "@/src/lib/supabase-admin";

const STATIC_ROUTES = ["", "shop", "about", "contact", "health-benefits", "recipes", "login", "register"];

export default async function sitemap() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: `${siteUrl}/${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));

  let productEntries = [];
  try {
    const { data: products } = await supabaseAdmin.from("products").select("id, updated_at").eq("is_active", true);
    productEntries = (products || []).map((p) => ({
      url: `${siteUrl}/product/${p.id}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch (err) {
    console.error("Sitemap: could not fetch products", err.message);
  }

  return [...staticEntries, ...productEntries];
}
