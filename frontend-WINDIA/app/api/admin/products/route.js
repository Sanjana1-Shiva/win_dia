import { supabase } from "@/src/lib/supabase";
import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { getAuthedUser, isAdmin, errorResponse, successResponse, sanitizeObject } from "@/src/lib/security";

function validateProduct(product = {}) {
  const errors = {};
  if (!product.name || product.name.trim().length < 2) errors.name = "Product name is required";
  if (product.price === undefined || product.price === null || isNaN(product.price) || Number(product.price) <= 0) {
    errors.price = "Enter a valid price greater than 0";
  }
  if (product.count_in_stock === undefined || product.count_in_stock === null || isNaN(product.count_in_stock) || Number(product.count_in_stock) < 0) {
    errors.count_in_stock = "Enter a valid stock quantity (0 or more)";
  }
  return errors;
}

export async function GET(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);
  if (!(await isAdmin(user.id, supabaseAdmin))) return errorResponse("Admin access required", 403);

  const { data, error } = await supabaseAdmin.from("products").select("*").order("created_at", { ascending: false });
  if (error) return errorResponse("Could not load products", 500);
  return successResponse({ products: data });
}

export async function POST(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);
  if (!(await isAdmin(user.id, supabaseAdmin))) return errorResponse("Admin access required", 403);

  const body = sanitizeObject(await req.json().catch(() => ({})), 3000);
  const errors = validateProduct(body);
  if (Object.keys(errors).length > 0) return errorResponse("Invalid product data", 400, { fieldErrors: errors });

  const { data, error } = await supabaseAdmin
    .from("products")
    .insert({
      name: body.name.trim(),
      description: body.description || null,
      short_description: body.short_description || null,
      price: Number(body.price),
      original_price: body.original_price ? Number(body.original_price) : null,
      image: body.image || null,
      image_url: body.image_url || null,
      flavor: body.flavor || null,
      category_id: body.category_id || null,
      variant_group: body.variant_group || null,
      count_in_stock: Number(body.count_in_stock),
      is_low_gi: Boolean(body.is_low_gi),
      is_gluten_free: Boolean(body.is_gluten_free),
      is_vegan: Boolean(body.is_vegan),
      gi_value: body.gi_value ? Number(body.gi_value) : null,
      net_weight: body.net_weight ? Number(body.net_weight) : null,
      is_bestseller: Boolean(body.is_bestseller),
      is_active: body.is_active !== false,
      sku: body.sku || null,
    })
    .select()
    .single();

  if (error) return errorResponse(error.message || "Could not create product", 500);
  return successResponse({ product: data }, 201);
}
