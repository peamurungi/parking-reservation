'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import Nav from '@/components/Nav'
import { Empty, ErrorBox, Loading } from '@/components/States'
import { api, Slot } from '@/lib/api'
import { useMe } from '@/lib/useMe'

function toLocalInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

// Interactive feature: parking map. Green = free at the chosen time, red = occupied.
export default function Home() {
  const role = useMe()
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [error, setError] = useState('')
  const [at, setAt] = useState('') // empty = right now

  useEffect(() => {
    if (!role) return
    const load = () => {
      const q = at ? '?at=' + encodeURIComponent(new Date(at).toISOString()) : ''
      api<Slot[]>('/slots/' + q).then(setSlots).catch(e => setError(e.message))
    }
    load()
    const t = setInterval(load, 15000) // refresh so the map stays current
    return () => clearInterval(t)
  }, [role, at])

  if (!role) return <main><Loading /></main>


  return (
    <>
      <Nav role={role} />
      <main>
        <h1>Parking map</h1>
        <div className="legend">
          <span>🟩 free</span><span>🟥 occupied</span>
          <label style={{ display: 'inline', margin: 0 }}>Show map at:{' '}
            <input type="datetime-local" style={{ width: 'auto' }} value={at || toLocalInput(new Date())}
              onChange={e => setAt(e.target.value)} />
          </label>
          {at && <button className="ghost" onClick={() => setAt('')}>Now</button>}
        </div>
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