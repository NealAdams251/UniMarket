// Data layer for listings. Pages only call getListings() and getListing(),
// so the data API team can make changes without touching any page or component.
import { supabase } from './supabase'
import { CATEGORIES } from '../data/categories'
import { CONDITIONS } from '../data/conditions'

export const LISTING_IMAGES_BUCKET = 'listing-images'

const LISTING_COLUMNS = `id, title, price, category, condition, meetup_spot, description, created_at,
  seller:profiles(id, display_name),
  images:listing_images(storage_path, sort_order)`

const SORTS = {
  newest: ['created_at', false],
  price_asc: ['price', true],
  price_desc: ['price', false],
}

/**
 * filters: { q, castegory, condition, minPrice, maxPrice, sort }
 * Empty strings mean "no filter".
 */
export async function getListings(filters = {}) {
  const { q = '', category = '', condition = '', minPrice = '', maxPrice = '', sort = '' } = filters
  
  let query = supabase
    .from('listings')
    .select(LISTING_COLUMNS)
    .eq('status', 'active')

  // Every word must appear somewhere in title or desctiption
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
  for (const word of words) {
    query = query.ilike('search_text', `%${escapeLike(word)}%`)
  }

  if (category) query = query.eq('category', category)
  if (condition) query = query.eq('condition', condition)
  if (minPrice !== '') query = query.gte('price', Number(minPrice))
  if (maxPrice !== '') query = query.lte('price', Number(maxPrice))

  const [column, ascending] = SORTS[sort] || SORTS.newest
  query = query.order(column, { ascending })

  const { data, error } = await query
  if (error) throw error
  return data.map(toListing)
}

export async function getListing(id) {
  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_COLUMNS)
    .eq('id', id)
    .maybeSingle()
  
  if (error?.code === '22P02') return null
  if (error) throw error
  return data ? toListing(data) : null
}

export async function createListing(fields, files = []) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be signed in to create a listing.')
 
  const { data: listing, error } = await supabase
    .from('listings')
    .insert({
      title: fields.title,
      price: fields.price,
      category: fields.category,
      condition: fields.condition,
      meetup_spot: fields.meetupSpot,
      description: fields.description ?? '',
    })
    .select('id')
    .single()
  if (error) throw error
 
  for (const [index, file] of files.entries()) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`
 
    const { error: uploadError } = await supabase.storage
      .from(LISTING_IMAGES_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false })
    if (uploadError) throw uploadError
 
    const { error: rowError } = await supabase
      .from('listing_images')
      .insert({ listing_id: listing.id, storage_path: path, sort_order: index })
    if (rowError) throw rowError
  }
 
  return listing.id
}

// One public profile by user id or null if user id doesn't exist
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, school, bio, created_at')
    .eq('id', userId)
    .maybeSingle()
 
  if (error?.code === '22P02') return null
  if (error) throw error
  if (!data) return null
  return {
    id: data.id,
    displayName: data.display_name,
    school: data.school,
    bio: data.bio,
    createdAt: data.created_at,
  }
}

// A seller's active listings
export async function getListingsBySeller(sellerId) {
  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_COLUMNS)
    .eq('seller_id', sellerId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
 
  if (error?.code === '22P02') return []
  if (error) throw error
  return data.map(toListing)
}
 
// Converts a Supabase row into the shape the pages use
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
    sellerId: row.seller?.id ?? null,
    createdAt: row.created_at,
    images: [...(row.images ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((img) => supabase.storage.from(LISTING_IMAGES_BUCKET).getPublicUrl(img.storage_path).data.publicUrl),
  }
}

function escapeLike(text) {
  return text.replace(/[\\%_]/g, (ch) => `\\${ch}`)
}

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
