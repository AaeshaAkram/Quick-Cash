// src/pages/Card.jsx
import React, { useState } from 'react'
import { useSession } from '../SessionContext.jsx'
import Navbar from '../components/Navbar.jsx'
import { apiPost } from '../api.js'
import { useNavigate } from 'react-router-dom'

export default function Card() {
  const {
    API,
    t,
    cardNumber,
    setCardNumber,
    setUser,
    setError,
    error,
    clearMessages,
  } = useSession()

  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // format for display: 1234 5678 9012 3456
  const displayCard = cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ').trim()

  async function submit() {
    clearMessages()
    try {
      const raw = cardNumber.replace(/\s/g, '')
      if (!/^\d{16}$/.test(raw)) throw new Error(t.cardErrorInvalid)
      setLoading(true)
      const r = await apiPost(API, '/auth/card/validate', { cardNumber: raw })
      setUser(r.user)
      navigate('/pin')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function onChange(e) {
    // keep only digits, max 16
    const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 16)
    setCardNumber(onlyDigits)
  }

  function clearOne() {
    if (cardNumber.length > 0) setCardNumber(cardNumber.slice(0, -1))
  }

  function cancel() {
    navigate(-1) // go back to previous page (e.g., Language)
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center">
      {/* Navbar shows QuickCash once; do not repeat brand title here */}
      <Navbar />

      <main className="flex-1 w-full flex items-center justify-center p-4">
        {/* 3D card/panel */}
        <div className="w-full max-w-md">
          <div className="rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.25)] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl p-6">
            {/* Heading (no duplicate ATM name) */}
            <div className="text-center mb-4">
              <h2 className="text-2xl font-semibold tracking-wide text-white drop-shadow-sm">
                {t?.enterCard || 'Enter your card number'}
              </h2>
              <p className="text-white/80 mt-1 text-sm">
                {t?.cardSubtext || 'Please type your 16-digit card number to continue'}
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-4 rounded-xl bg-red-500 text-white text-sm px-3 py-2">
                {error}
              </div>
            )}

            {/* Input */}
            <label htmlFor="cardInput" className="block text-white/90 text-sm mb-2">
              {t?.cardLabel || 'Card Number'}
            </label>
            <input
              id="cardInput"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 5678 9012 3456"
              value={displayCard}
              onChange={onChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
                if (e.key === 'Escape') cancel()
              }}
              className="w-full text-black placeholder-slate-500 bg-white border border-blue-900/70 rounded-xl px-4 py-3 text-lg tracking-widest outline-none focus:ring-4 focus:ring-blue-300 transition"
            />

            {/* ATM buttons */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {/* Yellow = Clear/Backspace */}
              <button
                type="button"
                disabled={loading}
                onClick={clearOne}
                className="rounded-xl px-4 py-3 font-semibold text-white bg-yellow-500 shadow-[0_6px_0_#a87900] active:translate-y-1 active:shadow-[0_2px_0_#a87900] transition disabled:opacity-60"
                title="Clear / Backspace"
              >
                {t?.btnClear || 'Clear'}
              </button>

              {/* Red = Cancel */}
              <button
                type="button"
                disabled={loading}
                onClick={cancel}
                className="rounded-xl px-4 py-3 font-semibold text-white bg-red-500 shadow-[0_6px_0_#8e1c1c] active:translate-y-1 active:shadow-[0_2px_0_#8e1c1c] transition disabled:opacity-60"
                title="Cancel and go back"
              >
                {t?.btnCancel || 'Cancel'}
              </button>

              {/* Green = Enter/Confirm */}
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

            {/* Helper text */}
            <p className="mt-4 text-center text-white/80 text-sm">
              {t?.privacyHint || 'Do not share your card number with anyone.'}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
