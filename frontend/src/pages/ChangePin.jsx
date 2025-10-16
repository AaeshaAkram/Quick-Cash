import React, { useState } from 'react'
import ATMFrame from '../components/ATMFrame.jsx'
import { useSession } from '../SessionContext.jsx'
import { apiPost } from '../api.js'
import { useNavigate } from 'react-router-dom'

const inputStyle = { padding: 10, borderRadius: 8, border: 'none', marginBottom: 8 }
const errorBanner = { background: '#ff6b6b', color: '#fff', padding: 8, borderRadius: 8, marginBottom: 8 }
const successBanner = { background: '#2ecc71', color: '#fff', padding: 8, borderRadius: 8, marginBottom: 8 }

export default function ChangePin() {
  const {
    t, API, token,
    navigate: sessionNavigate,   // <-- rename the session router helper
    setError, error, success, setSuccess,
    balanceInfo
  } = useSession()

  const navigate = useNavigate() // <-- use React Router for real page navigation

  const [oldPin, setOldPin] = useState('')
  const [otp, setOtp] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmNewPin, setConfirmNewPin] = useState('')

  async function requestOtp() {
    setError(''); setSuccess('')
    try {
      const res = await apiPost(API, '/pin/request-otp', {}, token, () => sessionNavigate('/lang'))
      // Show the OTP in simulator to avoid SMS dependency
      if(res?.code){ setSuccess(`OTP: ${res.code}`) } else { setSuccess('OTP sent') }
    } catch (e) {
      setError(e.message)
    }
  }

  async function submit() {
    setError(''); setSuccess('')
    if (!/^\d{4}(\d{2})?$/.test(newPin || '')) { setError(t.pinErrorInvalid); return }
    if (newPin !== confirmNewPin) { setError('PINs do not match'); return }
    try {
      await apiPost(
        API,
        '/pin/change',
        { oldPin, newPin, confirmNewPin, otp },
        token,
        () => sessionNavigate('/lang') // <-- absolute path here too
      )
      setSuccess('PIN updated')
      setTimeout(() => navigate('/dashboard'), 800) // <-- real navigation
    } catch (e) {
      setError(e.message)
    }
  }

  function goDashboard() {
    // Use React Router navigate for the Back button
    navigate('/dashboard')
  }

  return (
    <ATMFrame>
      <h2 style={{ marginTop: 0 }}>{t.changePin}</h2>
      <div className="row"><span className="muted">{t.balance}</span><span>₹ {balanceInfo?.balance ?? ''}</span></div>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="ok-banner">{success}</div>}

      <input
        type="password"
        placeholder={t.changePinOld}
        value={oldPin}
        onChange={e => setOldPin(e.target.value.replace(/\D/g, ''))}
        maxLength={6}
        className="btn"
        style={{ width: '100%', marginTop: 8 }}
      />

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button className="btn" onClick={requestOtp}>{t.changePinOtp}</button>
      </div>

      <input
        placeholder={t.changePinOtp}
        value={otp}
        onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
        maxLength={6}
        className="btn"
        style={{ width: '100%', marginTop: 8 }}
      />

      <input
        type="password"
        placeholder={t.changePinNew}
        value={newPin}
        onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
        maxLength={6}
        className="btn"
        style={{ width: '100%', marginTop: 8 }}
      />

      <input
        type="password"
        placeholder={t.changePinConfirm}
        value={confirmNewPin}
        onChange={e => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
        maxLength={6}
        className="btn"
        style={{ width: '100%', marginTop: 8 }}
      />

      <div className="row" style={{ gap: 8, marginTop: 8 }}>
        <button className="btn" onClick={goDashboard}>Back</button>
        <button className="btn primary" onClick={submit}>{t.submit}</button>
      </div>
    </ATMFrame>
  )
}
