import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Reads the signed-in user straight from the Supabase session, so pages
// keep working after a refresh (App's currentUser state resets on reload).
// Returns { loading, user } where user is the Supabase auth user or null.
export function useAuthUser() {
  const [auth, setAuth] = useState({ loading: true, user: null })

  useEffect(() => {
    let active = true
    let authChanged = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authChanged = true
      if (active) setAuth({ loading: false, user: session?.user ?? null })
    })
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (active && !authChanged) setAuth({ loading: false, user: error ? null : data.session?.user ?? null })
      })
      .catch(() => { if (active && !authChanged) setAuth({ loading: false, user: null }) })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  return auth
}
