'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import Nav from '@/components/Nav'
import Splash from '@/components/Splash'
import { supabase } from '@/lib/supabase'
import { useMe } from '@/lib/useMe'

export default function Home() {
  const role = useMe()
  const [email, setEmail] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? ''))
  }, [])

  if (!role) return <Splash />

  const name = email.split('@')[0]
  const isAttendant = role === 'attendant'

  return (
    <>
      <Nav role={role} />
      <main>
        <section className="welcome">
          <div>
            <p className="eyebrow">{isAttendant ? 'Attendant dashboard' : 'Driver dashboard'}</p>
            <h1>Welcome back{name ? ', ' + name : ''} 👋</h1>
            <p>{isAttendant
              ? 'See every reservation, check who is parked where and follow the money collected each day.'
              : 'Reserve a parking slot in advance and drive straight in. No more circling the car park.'}</p>
          </div>
          <img src="/parking-hero.svg" alt="" />
        </section>

        <div className="tiles">
          <Link href="/reserve" className="tile"><b>Reserve a slot</b><span>Pick a time and a place</span></Link>
          <Link href="/reservations" className="tile"><b>{isAttendant ? 'All reservations' : 'My reservations'}</b><span>View, check or cancel</span></Link>
          <Link href="/map" className="tile"><b>Parking map</b><span>See free and busy slots</span></Link>
          {isAttendant && <Link href="/analytics" className="tile"><b>Revenue</b><span>Money collected per day</span></Link>}
        </div>
      </main>
    </>
  )
}
