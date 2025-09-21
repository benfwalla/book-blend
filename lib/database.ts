import { supabase, supabaseAdmin } from './supabase'
import { Friend, UserInfo } from './api'

export interface User {
  id: string
  name: string
  image_url: string | null
  profile_url: string | null
  book_count: number | null
  username: string | null
  slug: string | null
  created_at: string
  updated_at: string
}


export interface Blend {
  id: string
  user1_id: string
  user2_id: string
  blend_data: any
  created_at: string
}

// Helper to ensure consistent user ID ordering
function orderUserIds(id1: string, id2: string): [string, string] {
  return id1 < id2 ? [id1, id2] : [id2, id1]
}

// Generate a human-readable slug from a name
function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

// Find an available slug in users table, adding numeric suffix if needed
async function findAvailableSlugInUsers(baseSlug: string): Promise<string> {
  let slug = baseSlug
  let counter = 0
  
  while (true) {
    const { data } = await supabaseAdmin
      .from('users')
      .select('slug')
      .eq('slug', slug)
      .single()
    
    if (!data) {
      // Slug is available
      return slug
    }
    
    // Try next variant
    counter++
    slug = `${baseSlug}-${counter}`
  }
}

// Cache user data from Goodreads API response
export async function cacheUser(userInfo: UserInfo): Promise<User> {
  // Check if user already exists to preserve existing slug
  const existingUser = await getCachedUser(userInfo.user.id)
  
  // Generate slug if user doesn't have one
  let slug = existingUser?.slug
  if (!slug) {
    const baseSlug = generateSlugFromName(userInfo.user.name)
    slug = await findAvailableSlugInUsers(baseSlug)
  }

  const userData = {
    id: userInfo.user.id,
    name: userInfo.user.name,
    image_url: userInfo.user.image_url,
    profile_url: userInfo.user.profile_url,
    book_count: userInfo.user.book_count ? parseInt(userInfo.user.book_count) : null,
    username: userInfo.user.username || null,
    slug: slug,
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .upsert(userData, { onConflict: 'id' })
    .select()
    .single()

  if (error) throw error
  return data
}

// Get user from cache (returns null if not found or stale)
export async function getCachedUser(userId: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) return null

  // Check if data is stale (older than 24 hours)
  const updatedAt = new Date(data.updated_at)
  const now = new Date()
  const hoursDiff = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60)
  
  if (hoursDiff > 24) return null
  
  return data
}

// Get user by slug
export async function getUserBySlug(slug: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) return null
  return data
}

// Save blend result
export async function saveBlend(user1Id: string, user2Id: string, blendData: any): Promise<Blend> {
  const [orderedId1, orderedId2] = orderUserIds(user1Id, user2Id)
  
  const { data, error } = await supabaseAdmin
    .from('blends')
    .insert({
      user1_id: orderedId1,
      user2_id: orderedId2,
      blend_data: blendData
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Get most recent blend between two users
export async function getLatestBlend(user1Id: string, user2Id: string): Promise<Blend | null> {
  const [orderedId1, orderedId2] = orderUserIds(user1Id, user2Id)
  
  const { data, error } = await supabaseAdmin
    .from('blends')
    .select('*')
    .eq('user1_id', orderedId1)
    .eq('user2_id', orderedId2)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null
  return data
}

// Get blend by ID
export async function getBlendById(blendId: string): Promise<Blend | null> {
  const { data, error } = await supabaseAdmin
    .from('blends')
    .select('*')
    .eq('id', blendId)
    .single()

  if (error || !data) return null
  return data
}
