

// import React, { useState } from 'react'
// import ATMFrame from '../components/ATMFrame.jsx'
// import { useSession } from '../SessionContext.jsx'
// import { apiPost } from '../api.js'
// import { useNavigate } from 'react-router-dom'

// export default function Transfer(){
//   const { t, user, balanceInfo, setBalanceInfo, API, token, navigate: sessionNavigate, setError, error } = useSession()
//   const [recipient, setRecipient] = useState('')
//   const [amount, setAmount] = useState('')
//   const [loading, setLoading] = useState(false)
//   const navigate = useNavigate()

//   async function submit(){
//     if (loading) return
//     setError('')
//     const amt = Number(amount)
//     if(!/^\w{3,}$/.test(recipient||'')){ setError('Invalid account'); return }
//     if(!Number.isFinite(amt) || amt<=0){ setError('Invalid amount'); return }
//     try{
//       setLoading(true)
//       const r = await apiPost(API, '/tx/transfer', { recipientAccount: recipient, amount: amt }, token, ()=>sessionNavigate('lang'))
//       setBalanceInfo({ ...balanceInfo, balance: r.balance })
//       window.__txResult = { type:'transfer', status:'success', amount: amt, balance: r.balance, reference: r.referenceId, receiptPdf: r?.receiptUrl || '' }
//       navigate('/result')
//     }catch(e){
//       window.__txResult = { type:'transfer', status:'failure', amount: amt, balance: balanceInfo?.balance, reference: null, receiptPdf: '' }
//       navigate('/result')
//     } finally { setLoading(false) }
//   }

//   return (
//     <ATMFrame>
//       <h2 style={{marginTop:0}}>{t.transfer}</h2>
//       <div className="row"><span className="muted">{t.accountType}</span><span>{balanceInfo?.account_type ?? ''}</span></div>
//       <div className="row"><span className="muted">{t.balance}</span><span>₹ {balanceInfo?.balance ?? ''}</span></div>
//       {error && <div className="error-banner">{error}</div>}
//       <input placeholder={t.recipient} value={recipient} onChange={e=>setRecipient(e.target.value)} className="btn" style={{width:'100%', marginTop:8}} />
//       <input placeholder={t.amount} value={amount} onChange={e=>setAmount(e.target.value.replace(/[^\d]/g,''))} className="btn" style={{width:'100%', marginTop:8}} />
//       <div className="row" style={{gap:8, marginTop:8}}>
//         <button className="btn danger" onClick={()=>navigate('/dashboard')}>Exit</button>
//         <button className="btn" onClick={()=>navigate('/dashboard')}>Back</button>
//         <button className="btn primary" onClick={submit} disabled={loading}>{loading ? (t?.loading || 'Processing…') : t.submit}</button>
//       </div>
//     </ATMFrame>
//   )
// }



import React, { useEffect, useMemo, useState } from 'react'
import ATMFrame from '../components/ATMFrame.jsx'
import { useSession } from '../SessionContext.jsx'
import { apiPost } from '../api.js'
import { useNavigate } from 'react-router-dom'
import DenominationSelector from '../components/DenominationSelector.jsx' // Import the selector

export default function Transfer(){
  const { t, user, balanceInfo, setBalanceInfo, API, token, navigate: sessionNavigate, setError, error } = useSession()
  const [recipient, setRecipient] = useState('') // Recipient card number
  
  // Denomination state
  const noteValues = useMemo(()=>[2000,1000,500,100,50,20,10],[])
  const initialDenoms = useMemo(() => noteValues.reduce((acc, n) => ({ ...acc, [n]: 0 }), {}), [noteValues])
  const [denoms, setDenoms] = useState(initialDenoms)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Calculate amount based on denominations
  useEffect(()=>{
    const total = noteValues.reduce((s,n)=>s+(denoms[n]||0)*n,0)
    setAmount(total?String(total):'')
  },[denoms, noteValues])

  async function submit(){
    if (loading) return
    setError('')
    const amt = Number(amount)

    // Validation 1: Recipient Card Number (assuming 16 digits)
    if(!/^\d{16}$/.test(recipient||'')){ setError('Invalid 16-digit recipient card number'); return }

    // Validation 2: Amount
    if(!Number.isFinite(amt) || amt<=0){ setError('Invalid amount'); return }

    try{
      setLoading(true)
      const r = await apiPost(API, '/tx/transfer', { recipientCardNumber: recipient, amount: amt }, token, ()=>sessionNavigate('lang'))
      setBalanceInfo({ ...balanceInfo, balance: r.balance })
      window.__txResult = { type:'transfer', status:'success', amount: amt, balance: r.balance, reference: r.referenceId, receiptPdf: r?.receiptUrl || '' }
      navigate('/result')
    }catch(e){
      const errorMsg = e?.error || 'Transfer failed'
      setError(errorMsg)
      window.__txResult = { type:'transfer', status:'failure', amount: amt, balance: balanceInfo?.balance, reference: null, receiptPdf: '' }
      navigate('/result')
    } finally { setLoading(false) }
  }

  return (
    <ATMFrame>
      <h2 style={{marginTop:0}}>{t.transfer}</h2>
      <div className="row"><span className="muted">{t.accountType}</span><span>{balanceInfo?.account_type ?? ''}</span></div>
      <div className="row"><span className="muted">{t.balance}</span><span>₹ {balanceInfo?.balance ?? ''}</span></div>
      {error && <div className="error-banner">{error}</div>}
      {/* Input for Recipient Card Number */}
      <input
        placeholder={t.recipientCardNumber || 'Recipient Card Number'} 
        value={recipient}
        onChange={e=>setRecipient(e.target.value.replace(/[^\d]/g,'').slice(0, 16))} // Allow only digits and limit length to 16
        className="btn"
        style={{width:'100%', marginTop:8}}
      />
      {/* Display calculated amount, read-only */}
      <input
        placeholder={t.amount}
        value={amount}
        readOnly // Amount is determined by the selector
        className="btn"
        style={{width:'100%', marginTop:8}}
      />
      {/* Denomination Selector */}
      <DenominationSelector notes={noteValues} values={denoms} setValues={setDenoms} />
      
      <div className="row" style={{gap:8, marginTop:8}}>
        <button className="btn danger" onClick={()=>navigate('/dashboard')}>Exit</button>
        <button className="btn" onClick={()=>navigate('/dashboard')}>Back</button>
        <button className="btn primary" onClick={submit} disabled={loading || !Number(amount) || !recipient}>{loading ? (t?.loading || 'Processing…') : t.submit}</button>
      </div>
    </ATMFrame>
  )
}
