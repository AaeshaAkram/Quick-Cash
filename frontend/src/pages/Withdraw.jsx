import React, { useEffect, useMemo, useState } from 'react'
import ATMFrame from '../components/ATMFrame.jsx'
import { useSession } from '../SessionContext.jsx'
import { apiPost } from '../api.js'
import DenominationSelector from '../components/DenominationSelector.jsx'
import { useNavigate } from 'react-router-dom'

export default function Withdraw(){
  const { t, API, token, balanceInfo, setBalanceInfo, setError, error, needReceipt } = useSession()
  const noteValues = useMemo(()=>[2000,1000,500,100],[])
  const [denoms, setDenoms] = useState({2000:0,1000:0,500:0,100:0})
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(()=>{ const total = noteValues.reduce((s,n)=>s+(denoms[n]||0)*n,0); setAmount(total?String(total):'') },[denoms, noteValues])

  async function submit(){
    if (loading) return
    setError('')
    const amt = Number(String(amount).replace(/[^\d]/g,''))
    if (!Number.isFinite(amt) || amt <= 0) { setError('Invalid amount'); return }
    try{
      setLoading(true)
      const r = await apiPost(API, '/tx/withdraw', { amount: amt }, token)
      if (typeof r?.balance === 'number') setBalanceInfo({ ...balanceInfo, balance: r.balance })
      const receiptPdf = needReceipt ? (r?.receiptUrl || '') : ''
      window.__txResult = { type:'withdraw', status:'success', amount: amt, balance: r?.balance ?? balanceInfo?.balance, reference: r?.referenceId ?? null, receiptPdf }
      navigate('/result')
    }catch(e){
      window.__txResult = { type:'withdraw', status:'failure', amount: amt, balance: balanceInfo?.balance, reference: null, receiptPdf: '' }
      navigate('/result')
    } finally { setLoading(false) }
  }

  return (
    <ATMFrame>
      <h2 style={{marginTop:0}}>{t.withdraw}</h2>
      <div className="row"><span className="muted">{t.accountType}</span><span>{balanceInfo?.account_type ?? ''}</span></div>
      <div className="row"><span className="muted">{t.balance}</span><span>₹ {balanceInfo?.balance ?? ''}</span></div>
      {error && <div className="error-banner">{error}</div>}
      <input placeholder={t.amount} value={amount} onChange={e=>{ setError(''); setAmount(e.target.value.replace(/[^\d]/g,'')) }} onKeyDown={(e)=>{ if(e.key==='Enter') submit() }} className="btn" style={{width:'100%', marginTop:8}} />
      <DenominationSelector notes={noteValues} values={denoms} setValues={setDenoms} />
      <div className="row" style={{gap:8, marginTop:8}}>
        <button type="button" className="btn danger" onClick={()=>navigate('/dashboard')}>Exit</button>
        <button type="button" className="btn" onClick={()=>navigate('/dashboard')}>Back</button>
        <button type="button" className="btn primary" onClick={submit} disabled={loading}>{loading ? (t?.loading || 'Processing…') : t.submit}</button>
      </div>
    </ATMFrame>
  )
}
