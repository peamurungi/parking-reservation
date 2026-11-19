'use client'
import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import Splash from '@/components/Splash'
import { ErrorBox, Loading } from '@/components/States'
import { api, ApiError, Reservation } from '@/lib/api'
import { useMe } from '@/lib/useMe'

export default function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const role = useMe()
  const router = useRouter()
  const [r, setR] = useState<Reservation | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (role) api<Reservation>('/reservations/' + id + '/').then(setR)
      .catch((e: ApiError) => setError(e.status === 404 ? 'Reservation not found.' : e.message))
  }, [role, id])

  if (!role) return <Splash />

  async function cancel() {
    if (!confirm('Cancel this reservation?')) return
    try { await api('/reservations/' + id + '/', { method: 'DELETE' }); router.push('/reservations') }
    catch (e: any) { setError(e.message) }
  }

  return (
    <>
      <Nav role={role} />
      <main style={{ maxWidth: '32rem' }}>
        <h1>Reservation #{id}</h1>
        {error ? <ErrorBox message={error} /> : !r ? <Loading /> : (
          <div className="card">
            <p><b>Slot:</b> {r.slot_code}</p>
            <p><b>Plate:</b> {r.plate}</p>
            <p><b>From:</b> {new Date(r.start_time).toLocaleString()}</p>
            <p><b>Until:</b> {new Date(r.end_time).toLocaleString()}</p>
            <p><b>Fee:</b> {Number(r.fee)} RWF</p>
            <button className="danger" onClick={cancel}>Cancel reservation</button>
          </div>
        )}
      </main>
    </>
  )
}
