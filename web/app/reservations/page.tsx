'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import Nav from '@/components/Nav'
import { Empty, ErrorBox, Loading } from '@/components/States'
import { api, Reservation } from '@/lib/api'
import { useMe } from '@/lib/useMe'

type Page = { count: number; next: string | null; previous: string | null; results: Reservation[] }
const fmt = (s: string) => new Date(s).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })

export default function List() {
  const role = useMe()
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Page | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!role) return
    setData(null)
    api<Page>('/reservations/?page=' + page).then(setData).catch(e => setError(e.message))
  }, [role, page])

  if (!role) return <main><Loading /></main>

  return (
    <>
      <Nav role={role} />
      <main>
        <h1>{role === 'attendant' ? 'All reservations' : 'My reservations'}</h1>
        {error ? <ErrorBox message={error} /> : !data ? <Loading /> : data.count === 0 ? <Empty text="No reservations yet." /> : (
          <>
            <table>
              <thead><tr><th>Slot</th><th>Plate</th><th>From</th><th>Until</th><th>Fee</th><th></th></tr></thead>
              <tbody>{data.results.map(r => (
                <tr key={r.id}><td>{r.slot_code}</td><td>{r.plate}</td><td>{fmt(r.start_time)}</td><td>{fmt(r.end_time)}</td>
                  <td>{Number(r.fee)} RWF</td><td><Link href={'/reservations/' + r.id}>Details</Link></td></tr>))}</tbody>
            </table>
            <div className="pager">
              <button className="ghost" disabled={!data.previous} onClick={() => setPage(page - 1)}>← Prev</button>
              <span>Page {page} · {data.count} total</span>
              <button className="ghost" disabled={!data.next} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          </>
        )}
      </main>
    </>
  )
}