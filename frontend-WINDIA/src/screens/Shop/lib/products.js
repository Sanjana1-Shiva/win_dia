import { supabase } from './supabaseClient';

const toBool = (value) => value === true || value === 'true' || value === 1;

const normalizeImage = (image = '') => {
  if (!image) return '';
  if (image.startsWith('http') || image.startsWith('/')) return image;
  return `/images/${image}`;
};

export const normalizeProduct = (p = {}) => {
  const id = p.id || p._id;
  const image = normalizeImage(p.image || p.image_url || p.imageUrl || p.product_image || p.productImage || '');
  const countInStock = Number(p.countInStock ?? p.count_in_stock ?? p.stock ?? p.quantity ?? 0);
  return {
    ...p,
    id,
    _id: id,
    name: p.name || p.product_name || '',
    image,
    shortDescription: p.shortDescription || p.short_description || p.subtitle || p.description || '',
    description: p.description || p.long_description || p.shortDescription || p.short_description || '',
    price: Number(p.price ?? p.selling_price ?? 0),
    originalPrice: Number(p.originalPrice ?? p.original_price ?? p.mrp ?? p.price ?? 0),
    flavor: p.flavor || p.category || '',
    categoryId: p.category_id || null,
    variantGroup: p.variant_group || null,
    giValue: p.giValue || p.gi_value || p.gi || '',
    netWeight: Number(p.netWeight ?? p.net_weight ?? p.weight ?? 0),
    countInStock,
    count_in_stock: countInStock,
    isLowGI: toBool(p.isLowGI ?? p.is_low_gi),
    isGlutenFree: toBool(p.isGlutenFree ?? p.is_gluten_free),
    isVegan: toBool(p.isVegan ?? p.is_vegan),
    nutritionalInfo: p.nutritionalInfo || p.nutritional_info || null,
    ratingAvg: Number(p.rating_avg ?? p.ratingAvg ?? 0),
    ratingCount: Number(p.rating_count ?? p.ratingCount ?? 0),
  };
};

export const getProducts = async (filters = {}) => {
  let query = supabase.from('products').select('*');

  if (filters.search) {
    const term = filters.search.replace(/[%,]/g, ' ').trim();
    query = query.or(`name.ilike.%${term}%,flavor.ilike.%${term}%,short_description.ilike.%${term}%`);
  }
  if (filters.flavor && filters.flavor.length > 0) query = query.in('flavor', filters.flavor);
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
  if (filters.minPrice) query = query.gte('price', Number(filters.minPrice));
  if (filters.maxPrice) query = query.lte('price', Number(filters.maxPrice));

  if (filters.range === 'gluten-free') query = query.eq('is_gluten_free', true);
  if (filters.range === 'regular') query = query.or('is_gluten_free.eq.false,is_gluten_free.is.null');
  if (filters.dietary?.includes('Gluten-Free')) query = query.eq('is_gluten_free', true);
  if (filters.dietary?.includes('Vegan')) query = query.eq('is_vegan', true);
  if (filters.dietary?.includes('Low GI')) query = query.eq('is_low_gi', true);
  if (filters.inStockOnly) query = query.gt('count_in_stock', 0);

  if (filters.sortBy === 'price-low') query = query.order('price', { ascending: true });
  if (filters.sortBy === 'price-high') query = query.order('price', { ascending: false });
  if (filters.sortBy === 'name') query = query.order('name', { ascending: true });
  if (filters.sortBy === 'newest') query = query.order('created_at', { ascending: false, nullsFirst: false });
  if (filters.sortBy === 'popularity') query = query.order('rating_count', { ascending: false, nullsFirst: false });
  if (filters.sortBy === 'bestseller') query = query.eq('is_bestseller', true);
  if (!filters.sortBy || filters.sortBy === 'featured') query = query.order('created_at', { ascending: false, nullsFirst: false });
  if (filters.limit) query = query.limit(Number(filters.limit));

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(normalizeProduct);
};

export const getProductById = async (id) => {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) throw error;
  return normalizeProduct(data);
};

/** Sibling products sharing the same variant_group — used for the size-switcher on the product page. */
export const getVariantSiblings = async (variantGroup, excludeId) => {
  if (!variantGroup) return [];
  let query = supabase.from('products').select('id, name, price, net_weight, flavor, is_active').eq('variant_group', variantGroup).eq('is_active', true);
  const { data, error } = await query;
  if (error || !data) return [];
  return data.filter((p) => p.id !== excludeId).sort((a, b) => (a.net_weight || 0) - (b.net_weight || 0));
};

/**
 * "You might also like" — recommends products from the same category/flavor
 * as what's already in the user's cart or wishlist, excluding items they
 * already have. Used on the Cart and Wishlist pages.
 */
export const getRecommendedProducts = async ({ categoryIds = [], flavors = [], excludeIds = [], limit = 4 }) => {
  const cleanCategoryIds = [...new Set(categoryIds.filter(Boolean))];
  const cleanFlavors = [...new Set(flavors.filter(Boolean))];
  if (cleanCategoryIds.length === 0 && cleanFlavors.length === 0) return [];

  let query = supabase.from('products').select('*').eq('is_active', true);

  const orClauses = [];
  if (cleanCategoryIds.length > 0) orClauses.push(`category_id.in.(${cleanCategoryIds.join(',')})`);
  if (cleanFlavors.length > 0) orClauses.push(`flavor.in.(${cleanFlavors.map((f) => `"${f}"`).join(',')})`);
  query = query.or(orClauses.join(','));

  if (excludeIds.length > 0) query = query.not('id', 'in', `(${excludeIds.join(',')})`);

  query = query.order('rating_count', { ascending: false }).limit(limit);

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(normalizeProduct);
};
