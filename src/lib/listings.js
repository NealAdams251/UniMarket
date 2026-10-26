// Data layer for listings. Pages only call getListings() and getListing(),
// so the data API team can replace the mock code below with Supabase
// without touching any page or component.
import { MOCK_LISTINGS, CATEGORIES, CONDITIONS } from '../data/mockListings'

const SORTS = {
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
}

/**
 * filters: { q, category, condition, minPrice, maxPrice, sort }
 * Empty strings mean "no filter".
 */
export async function getListings(filters = {}) {
  const { q = '', category = '', condition = '', minPrice = '', maxPrice = '', sort = '' } = filters
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean)

  const rows = MOCK_LISTINGS.filter((l) => {
    const text = `${l.title} ${l.description}`.toLowerCase()
    if (words.length && !words.every((w) => text.includes(w))) return false
    if (category && l.category !== category) return false
    if (condition && l.condition !== condition) return false
    if (minPrice !== '' && l.price < Number(minPrice)) return false
    if (maxPrice !== '' && l.price > Number(maxPrice)) return false
    return true
  })

  return rows.sort(SORTS[sort] || SORTS.newest)

  /* ---- Supabase version (use once the database is ready) ----
  import { supabase } from './supabase'

  let query = supabase
    .from('listings')
    .select(`id, title, price, category, condition, meetup_spot, description, created_at,
             seller:profiles(display_name),
             images:listing_images(storage_path, sort_order)`)
    .eq('status', 'active')

  if (q) query = query.textSearch('search', q, { type: 'websearch' })
  if (category) query = query.eq('category', category)
  if (condition) query = query.eq('condition', condition)
  if (minPrice !== '') query = query.gte('price', minPrice)
  if (maxPrice !== '') query = query.lte('price', maxPrice)

  const [column, ascending] = {
    newest: ['created_at', false],
    price_asc: ['price', true],
    price_desc: ['price', false],
  }[sort || 'newest']
  query = query.order(column, { ascending })

  const { data, error } = await query
  if (error) throw error
  return data.map(toListing)
  ------------------------------------------------------------- */
}

export async function getListing(id) {
  return MOCK_LISTINGS.find((l) => l.id === String(id)) ?? null

  /* ---- Supabase version ----
  const { data, error } = await supabase
    .from('listings')
    .select(`*, seller:profiles(display_name),
             images:listing_images(storage_path, sort_order)`)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? toListing(data) : null
  --------------------------- */
}

/* Converts a Supabase row into the shape the pages use.
function toListing(row) {
  return {
    id: row.id,
    title: row.title,
    price: Number(row.price),
    category: row.category,
    condition: row.condition,
    meetupSpot: row.meetup_spot,
    description: row.description,
    seller: row.seller?.display_name ?? 'Student',
    createdAt: row.created_at,
    images: (row.images ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((img) => supabase.storage.from('listing-images').getPublicUrl(img.storage_path).data.publicUrl),
  }
}
*/

// ---- Display helpers ----
export const categoryLabel = (value) => CATEGORIES.find((c) => c.value === value)?.label ?? value
export const conditionLabel = (value) => CONDITIONS.find((c) => c.value === value)?.label ?? value

export function formatPrice(price) {
  if (Number(price) === 0) return 'Free'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: Number.isInteger(Number(price)) ? 0 : 2,
  }).format(price)
}

export function timeAgo(dateString) {
  const days = Math.floor((Date.now() - new Date(dateString)) / 86_400_000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
