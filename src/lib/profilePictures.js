import { supabase } from './supabase'

export const PROFILE_PICTURES_BUCKET = 'profile-pictures'

export function profilePictureUrl(path) {
  return supabase.storage.from(PROFILE_PICTURES_BUCKET).getPublicUrl(path).data.publicUrl
}