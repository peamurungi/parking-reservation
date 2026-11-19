'use client'
import { useEffect, useState } from 'react'
import Nav from '@/components/Nav'
import { Empty, ErrorBox, Loading } from '@/components/States'
import { api } from '@/lib/api'
import { useMe } from '@/lib/useMe'

type Row = { day: string; revenue: string; reservations: number }

export default function Analytics() {
  const role = useMe()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { if (role === 'attendant') api<Row[]>('/analytics/revenue-per-day/').then(setRows).catch(e => setError(e.message)) }, [role])

  if (!role) return <main><Loading /></main>

  return (
    <>
      <Nav role={role} />
      <main>
        <h1>Revenue per day</h1>
        {role && role !== 'attendant' ? <ErrorBox message="Attendants only." /> : error ? <ErrorBox message={error} /> : !rows ? <Loading /> : rows.length === 0 ? <Empty text="No revenue yet." /> : (
          <table><thead><tr><th>Day</th><th>Reservations</th><th>Revenue</th></tr></thead>
            <tbody>{rows.map(r => <tr key={r.day}><td>{r.day}</td><td>{r.reservations}</td><td>{Number(r.revenue)} RWF</td></tr>)}</tbody></table>
        )}
      </main>
    </>
  )
}