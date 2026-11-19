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
    <div className="auth">
      <aside className="hero">
        <img src="/parking-hero.svg" alt="" />
        <h2>Welcome to Parking Reservation</h2>
        <p>Reserve your slot in seconds. Skip the circling and park with confidence.</p>
        <ul>
          <li>See free slots at a glance</li>
          <li>Never double-booked: the server checks every time</li>
          <li>Clear fee shown before you confirm</li>
        </ul>
      </aside>

      <section className="panel">
        <div className="logo">P</div>
        <h1>{mode === 'login' ? 'Log in' : 'Create your account'}</h1>
        <p className="sub">{mode === 'login' ? 'Welcome back. Enter your details to continue.' : 'It takes less than a minute.'}</p>
        <form onSubmit={submit}>
          <label htmlFor="e">Email</label>
          <input id="e" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
          <label htmlFor="p">Password</label>
          <input id="p" type="password" required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} />
          <p style={{ marginTop: '1.1rem' }}><button className="wide" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</button></p>
          {msg && <p role="alert" style={{ color: 'var(--bad)' }}>{msg}</p>}
        </form>
        <p className="switch">
          {mode === 'login' ? 'New here? ' : 'Already have an account? '}
          <a href="#" onClick={e => { e.preventDefault(); setMsg(''); setMode(mode === 'login' ? 'signup' : 'login') }}>
            {mode === 'login' ? 'Create an account' : 'Log in'}
          </a>
        </p>
        {mode === 'signup' && <small>New accounts are drivers. Attendants are set up by an administrator.</small>}
      </section>
    </div>
  )
}
