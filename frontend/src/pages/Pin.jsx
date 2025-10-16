// src/pages/Pin.jsx
import React, { useEffect, useState } from 'react'
import { useSession } from '../SessionContext.jsx'
import Navbar from '../components/Navbar.jsx'
import { apiGet, apiPost } from '../api.js'
import { useNavigate } from 'react-router-dom'

export default function Pin(){
  const {
    API, t,
    cardNumber,
    setToken, setError, error,
    setBalanceInfo, clearMessages,
  } = useSession()

  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const cleanCard = (cardNumber || '').replace(/\D/g, '')
    if (cleanCard.length !== 16) {
      setError?.(t?.cardRequired || 'Please enter your card number first.')
      navigate('/card')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function submit(){
    clearMessages()
    try{
      const cleanPin  = pin.replace(/\D/g,'')
      const cleanCard = (cardNumber || '').replace(/\D/g,'')

      if (cleanPin.length !== 4 && cleanPin.length !== 6) {
        throw new Error(t?.pinErrorInvalid || 'Invalid PIN. Enter 4 or 6 digits.')
      }
      if (cleanCard.length !== 16) {
        throw new Error(t?.cardErrorInvalid || 'Invalid card number. Please re-enter.')
      }

      setLoading(true)
      const r = await apiPost(API, '/auth/pin/verify', { cardNumber: cleanCard, pin: cleanPin })
      setToken(r.token)
      const b = await apiGet(API, '/tx/balance', r.token)
      setBalanceInfo(b)
      navigate('/dashboard')
    }catch(e){
      const msg = (e?.message || '').toLowerCase()
      if (msg.includes('card')) {
        setError(t?.pinVerifyFailed || 'PIN verification failed. Please try again.')
      } else {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }

  function clearOne(){
    if (pin.length > 0) setPin(pin.slice(0, -1))
  }

  function cancel(){
    navigate(-1)
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center">
      <Navbar/>

      <main className="flex-1 w-full flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.25)] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl p-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-semibold tracking-wide text-white drop-shadow-sm">
                {t?.enterPin || 'Enter your PIN'}
              </h2>
              <p className="text-white/80 mt-1 text-sm">
                {t?.pinSubtext || 'Please enter your 4–6 digit secure PIN'}
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-500 text-white text-sm px-3 py-2">
                {error}
              </div>
            )}

            <label htmlFor="pinInput" className="block text-white/90 text-sm mb-2">
              {t?.pinLabel || 'PIN'}
            </label>
            <input
              id="pinInput"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              placeholder="••••••"
              value={pin}
              onChange={(e)=> setPin(e.target.value.replace(/\D/g,'').slice(0,6))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
                if (e.key === 'Escape') cancel()
              }}
              className="w-full text-black placeholder-slate-500 bg-white border border-blue-900/70 rounded-xl px-4 py-3 text-lg tracking-widest outline-none focus:ring-4 focus:ring-blue-300 transition"
            />

            <div className="mt-6 grid grid-cols-3 gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={clearOne}
                className="rounded-xl px-4 py-3 font-semibold text-white bg-yellow-500 shadow-[0_6px_0_#a87900] active:translate-y-1 active:shadow-[0_2px_0_#a87900] transition disabled:opacity-60"
                title="Clear / Backspace"
              >
                {t?.btnClear || 'Clear'}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={cancel}
                className="rounded-xl px-4 py-3 font-semibold text-white bg-red-500 shadow-[0_6px_0_#8e1c1c] active:translate-y-1 active:shadow-[0_2px_0_#8e1c1c] transition disabled:opacity-60"
                title="Cancel and go back"
              >
                {t?.btnCancel || 'Cancel'}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={submit}
                className="rounded-xl px-4 py-3 font-semibold text-white bg-green-500 shadow-[0_6px_0_#1e6a2a] active:translate-y-1 active:shadow-[0_2px_0_#1e6a2a] transition disabled:opacity-60"
                title="Enter / Confirm"
              >
                {loading ? (t?.loading || 'Processing…') : (t?.btnEnter || 'Enter')}
              </button>
            </div>

            <p className="mt-4 text-center text-white/80 text-sm">
              {t?.privacyHint || 'Never share your PIN with anyone.'}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
