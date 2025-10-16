import React, { useEffect, useMemo, useState } from 'react'
import ATMFrame from '../components/ATMFrame.jsx'
import { useSession } from '../SessionContext.jsx'
import { apiPost } from '../api.js'
import DenominationSelector from '../components/DenominationSelector.jsx'
import { useNavigate } from 'react-router-dom'

export default function Deposit(){
  const { t, user, balanceInfo, setBalanceInfo, API, token, navigate: sessionNavigate, setError, error, needReceipt } = useSession()
  const noteValues = useMemo(()=>[2000,1000,500,100],[])
  const [denoms, setDenoms] = useState({2000:0,1000:0,500:0,100:0})
  const [amount, setAmount] = useState('')
  const navigate = useNavigate()

  useEffect(()=>{ const total = noteValues.reduce((s,n)=>s+(denoms[n]||0)*n,0); setAmount(total?String(total):'') },[denoms])

  async function submit(){
    setError('')
    const amt = Number(amount)
    if(!Number.isFinite(amt) || amt<=0){ setError('Invalid amount'); return }
    try{
      const r = await apiPost(API, '/tx/deposit', { amount: amt }, token, ()=>sessionNavigate('lang'))
      setBalanceInfo({ ...balanceInfo, balance: r.balance })
      window.__txResult = { type:'deposit', status:'success', amount: amt, balance: r.balance, reference: null, receiptPdf: r.receiptPath || r.receiptURL || r.receiptUrl || r.receipt || '' }
      navigate('/result')
    }catch(e){
      window.__txResult = { type:'deposit', status:'failure', amount: amt, balance: balanceInfo?.balance, reference: null, receiptPdf: '' }
      navigate('/result')
    }
  }

  return (
    <ATMFrame>
      <h2 style={{marginTop:0}}>{t.deposit}</h2>
      <div className="row"><span className="muted">{t.accountType}</span><span>{balanceInfo?.account_type ?? ''}</span></div>
      <div className="row"><span className="muted">{t.balance}</span><span>₹ {balanceInfo?.balance ?? ''}</span></div>
      {error && <div className="error-banner">{error}</div>}
      <input placeholder={t.amount} value={amount} onChange={e=>setAmount(e.target.value.replace(/[^\d]/g,''))} className="btn" style={{width:'100%', marginTop:8}} />
      <DenominationSelector notes={noteValues} values={denoms} setValues={setDenoms} />
      <div className="row" style={{gap:8, marginTop:8}}>
        <button className="btn danger" onClick={()=>navigate('/dashboard')}>Exit</button>
        <button className="btn" onClick={()=>navigate('/dashboard')}>Back</button>
        <button className="btn primary" onClick={submit} disabled={!Number(amount)}>{t.submit}</button>
      </div>
    </ATMFrame>
  )
}
