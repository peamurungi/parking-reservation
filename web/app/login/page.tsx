'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('')
    const { data, error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    setBusy(false)
    if (error) return setMsg(error.message)
    if (data.session) router.replace('/')
    else setMsg('Check your email to confirm your account, then log in.')
  }

  return (
    <main style={{ maxWidth: '26rem' }}>
      <h1>Parking reservation</h1>
      <div className="toggle">
        <button className={mode === 'login' ? '' : 'ghost'} onClick={() => setMode('login')}>Log in</button>
        <button className={mode === 'signup' ? '' : 'ghost'} onClick={() => setMode('signup')}>Sign up</button>
      </div>
      <form onSubmit={submit}>
        <label htmlFor="e">Email</label>
        <input id="e" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        <label htmlFor="p">Password</label>
        <input id="p" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
        <p style={{ marginTop: '1rem' }}><button disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</button></p>
        {msg && <p role="alert" className="err" style={{ color: 'var(--bad)' }}>{msg}</p>}
        {mode === 'signup' && <small>New accounts are drivers. An attendant is promoted by an admin in the database.</small>}
      </form>
    </main>
  )
}
