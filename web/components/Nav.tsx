'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Nav({ role }: { role: string | null }) {
  const router = useRouter()
  return (
    <nav>
      <Link href="/" className="brand"><span className="logo sm">P</span> Parking</Link>
      <Link href="/">Home</Link>
      <Link href="/map">Map</Link>
      <Link href="/reservations">Reservations</Link>
      <Link href="/reserve">Reserve</Link>
      {role === 'attendant' && <Link href="/analytics">Revenue</Link>}
      <span className="sp" />
      <span className="role">{role}</span>
      <button onClick={async () => { await supabase.auth.signOut(); router.replace('/login') }}>Log out</button>
    </nav>
  )
}
