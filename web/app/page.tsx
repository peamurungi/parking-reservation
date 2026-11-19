'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import Nav from '@/components/Nav'
import { Empty, ErrorBox, Loading } from '@/components/States'
import { api, Slot } from '@/lib/api'
import { useMe } from '@/lib/useMe'

// Interactive feature: parking map. Green = free now, red = occupied now.
export default function Home() {
  const role = useMe()
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!role) return
    const load = () => api<Slot[]>('/slots/').then(setSlots).catch(e => setError(e.message))
    load()
    const t = setInterval(load, 15000) // refresh so the map stays current
    return () => clearInterval(t)
  }, [role])

  return (
    <>
      <Nav role={role} />
      <main>
        <h1>Parking map</h1>
        <div className="legend"><span>🟩 free now</span><span>🟥 occupied now</span><span>Click a free slot to reserve it</span></div>
        {error ? <ErrorBox message={error} /> : !slots ? <Loading /> : slots.length === 0 ? <Empty text="No slots yet. An attendant can add some." /> : (
          <div className="map">
            {slots.map(s => s.occupied
              ? <div key={s.id} className="slot busy" title="Occupied">{s.code}<small>until {new Date(s.reserved_until!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></div>
              : <Link key={s.id} href={`/reserve?slot=${s.id}`} className="slot">{s.code}<small>free · zone {s.zone}</small></Link>)}
          </div>
        )}
      </main>
    </>
  )
}
