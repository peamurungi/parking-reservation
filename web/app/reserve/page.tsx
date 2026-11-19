'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Nav from '@/components/Nav'
import { ErrorBox, Loading } from '@/components/States'
import { api, Reservation, Slot } from '@/lib/api'
import { useMe } from '@/lib/useMe'

const RATE = 1000 // display only: the server calculates the real fee

function toLocalInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function Form() {
  const role = useMe()
  const router = useRouter()
  const params = useSearchParams()
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [slot, setSlot] = useState(params.get('slot') || '')
  const [plate, setPlate] = useState('')
  const now = new Date(); now.setMinutes(0, 0, 0)
  const [start, setStart] = useState(toLocalInput(new Date(now.getTime() + 3600e3)))
  const [end, setEnd] = useState(toLocalInput(new Date(now.getTime() + 3 * 3600e3)))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (role) api<Slot[]>('/slots/').then(setSlots).catch(e => setError(e.message)) }, [role])

  if (!role) return <main><Loading /></main>


  const hours = Math.max(0, Math.ceil((+new Date(end) - +new Date(start)) / 3600e3))

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const r = await api<Reservation>('/reservations/', { method: 'POST', body: JSON.stringify({
        slot: Number(slot), plate, start_time: new Date(start).toISOString(), end_time: new Date(end).toISOString() }) })
      router.push('/reservations/' + r.id)
    } catch (err: any) { setError(err.message) } // e.g. the clear overlap message from Django
    setBusy(false)
  }

  return (
    <>
      <Nav role={role} />
      <main style={{ maxWidth: '32rem' }}>
        <h1>Reserve a slot</h1>
        {!slots && !error ? <Loading /> : (
          <form onSubmit={submit}>
            <label htmlFor="s">Slot</label>
            <select id="s" required value={slot} onChange={e => setSlot(e.target.value)}>
              <option value="">Choose…</option>
              {slots?.map(s => <option key={s.id} value={s.id}>{s.code} (zone {s.zone}){s.occupied ? ' – busy now' : ''}</option>)}
            </select>
            <label htmlFor="pl">Number plate</label>
            <input id="pl" required value={plate} onChange={e => setPlate(e.target.value)} placeholder="RAB123A" />
            <label htmlFor="st">From</label>
            <input id="st" type="datetime-local" required value={start} onChange={e => setStart(e.target.value)} />
            <label htmlFor="en">Until</label>
            <input id="en" type="datetime-local" required value={end} onChange={e => setEnd(e.target.value)} />
            <p>Estimated fee: <b>{hours * RATE} RWF</b> <small>({hours} h, final amount set by the server)</small></p>
            <button disabled={busy}>{busy ? 'Reserving…' : 'Reserve'}</button>

            {error && <ErrorBox message={error} />}
          </form>
        )}
      </main>
    </>
  )
}

export default function Reserve() { return <Suspense fallback={<Loading />}><Form /></Suspense> }