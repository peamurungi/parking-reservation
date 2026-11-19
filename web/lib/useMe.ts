'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './supabase'
import { api } from './api'

// Redirects to /login when signed out; otherwise returns the role Django found.
export function useMe() {
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return router.replace('/login')
      try { setRole((await api('/me/')).role) } catch { router.replace('/login') }
    })
  }, [router])
  return role
}
