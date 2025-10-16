// import React from 'react'
// import ATMFrame from '../components/ATMFrame.jsx'
// import { useSession } from '../SessionContext.jsx'

// export default function TransactionResult(){
//   const { navigate, stage, setError, success, setSuccess, balanceInfo } = useSession()
//   // In this simple session router, the previous page passes state via navigate('result', payload)
//   // We'll store it temporarily on window to keep implementation simple without a URL router
//   const payload = window.__txResult || { type:'', status:'success', amount:0, balance: balanceInfo?.balance, reference:null, receiptPdf:'' }
//   const ok = payload.status === 'success'

//   function download(){ if(!payload.receiptPdf) return; const a=document.createElement('a'); a.href=payload.receiptPdf; a.download=''; document.body.appendChild(a); a.click(); document.body.removeChild(a) }

//   return (
//     <ATMFrame>
//       <div style={{fontSize:48, marginBottom:8}}>{ok ? '✔' : '✖'}</div>
//       <h2 style={{marginTop:0}}>{ok ? 'Transaction successful' : 'Transaction failed'}</h2>
//       <div className="row"><span className="muted">Type</span><span>{payload.type}</span></div>
//       <div className="row"><span className="muted">Amount</span><span>₹ {payload.amount}</span></div>
//       <div className="row"><span className="muted">Balance</span><span>₹ {payload.balance}</span></div>
//       {payload.reference && <div className="row"><span className="muted">Ref</span><span>{payload.reference}</span></div>}
//       <div className="row" style={{gap:8, marginTop:12}}>
//         <button className="btn" onClick={()=>navigate('/dashboard')}>Back to dashboard</button>
//         {payload.receiptPdf && <button className="btn primary" onClick={download}>Download receipt</button>}
//       </div>
//     </ATMFrame>
//   )
// }
// src/pages/TransactionResult.jsx
// src/pages/TransactionResult.jsx




// import React, { useState } from 'react'
// import ATMFrame from '../components/ATMFrame.jsx'
// import { useSession } from '../SessionContext.jsx'
// import { useNavigate } from 'react-router-dom'

// export default function TransactionResult(){
//   const { balanceInfo } = useSession()
//   const navigate = useNavigate()
//   const payload = window.__txResult || { type:'', status:'success', amount:0, balance: balanceInfo?.balance, reference:null, receiptPdf:'' }
//   const ok = payload.status === 'success'
//   const [toast, setToast] = useState('')

//   function handleDownload(){
//     if(!payload.receiptPdf) return
//     const a = document.createElement('a')
//     a.href = payload.receiptPdf
//     a.download = `ATM_Receipt_${payload.reference || payload.type}.pdf`
//     document.body.appendChild(a)
//     a.click()
//     document.body.removeChild(a)
//     setToast('Receipt downloaded successfully.')
//     setTimeout(()=>navigate('/dashboard'), 900)
//   }

//   return (
//     <ATMFrame>
//       {toast && <div className="ok-banner">{toast}</div>}
//       <div style={{fontSize:48, marginBottom:8}}>{ok ? '✔' : '✖'}</div>
//       <h2 style={{marginTop:0}}>{ok ? 'Transaction successful' : 'Transaction failed'}</h2>
//       <div className="row"><span className="muted">Type</span><span>{payload.type}</span></div>
//       <div className="row"><span className="muted">Amount</span><span>₹ {payload.amount}</span></div>
//       <div className="row"><span className="muted">Balance</span><span>₹ {payload.balance}</span></div>
//       {payload.reference && <div className="row"><span className="muted">Ref</span><span>{payload.reference}</span></div>}
//       <div className="row" style={{gap:8, marginTop:12}}>
//         <button className="btn" onClick={()=>navigate('/dashboard')}>Back to dashboard</button>
//         {payload.receiptPdf && <button className="btn primary" onClick={handleDownload}>Download receipt</button>}
//       </div>
//     </ATMFrame>
//   )
// }


import React, { useMemo, useState } from 'react'
import ATMFrame from '../components/ATMFrame.jsx'
import { useSession } from '../SessionContext.jsx'
import { useNavigate } from 'react-router-dom'

export default function TransactionResult(){
  const { balanceInfo, API, token } = useSession()
  const navigate = useNavigate()

  const payload = useMemo(() => (
    window.__txResult || {
      type: '',
      status: 'success',
      amount: 0,
      balance: balanceInfo?.balance,
      reference: null,
      receiptPdf: ''
    }
  ), [balanceInfo?.balance])

  const ok = payload.status === 'success'
  const [toast, setToast] = useState('')
  const [err, setErr] = useState('')

  function buildReceiptUrl() {
    const raw = String(payload?.receiptPdf || '')
    if (!raw) return ''
    if (/^https?:\/\//i.test(raw)) return raw
    const base = String(API || '').replace(/\/+$/,'')
    const path = raw.startsWith('/') ? raw : `/${raw}`
    return `${base}${path}`
  }

  function parseFilenameFromHeaders(res, defName) {
    const cd = res.headers.get('content-disposition') || ''
    const m = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(cd)
    if (m) {
      try { return decodeURIComponent(m[1]) } catch { return m[1] }
    }
    return defName
  }

  async function fetchPdf(url, withCookies = true) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const opts = {
      method: 'GET',
      headers,
      credentials: withCookies ? 'include' : 'omit',
    }
    return fetch(url, opts)
  }

  async function handleDownload(){
    setErr(''); setToast('')
    const url = buildReceiptUrl()
    if (!url) { setErr('No receipt URL provided.'); return }

    try {
      let res
      try {
        res = await fetchPdf(url, true)
      } catch (e1) {
        try {
          res = await fetchPdf(url, false)
        } catch (e2) {
          setErr(`Network error (likely CORS or mixed content). ${e2?.message || ''}`)
          return
        }
      }

      if (!res.ok) {
        let detail = ''
        try { detail = await res.text() } catch {}
        setErr(`Server response ${res.status}. ${detail || 'Could not download receipt.'}`)
        return
      }

      const ct = (res.headers.get('content-type') || '').toLowerCase()
      const blob = await res.blob()
      const looksPdf = ct.includes('application/pdf') || blob.type === 'application/pdf'
      if (!looksPdf) {
        let text = ''
        try { text = await blob.text() } catch {}
        setErr(text || 'The server did not return a valid PDF.')
        return
      }

      const defaultName =
        payload.type === 'withdraw' ? 'Withdrawal_Receipt.pdf' :
        payload.type === 'deposit'  ? 'Deposit_Receipt.pdf'   :
        payload.type === 'transfer' ? 'Transfer_Receipt.pdf'  :
        'Receipt.pdf'

      const fname = parseFilenameFromHeaders(res, defaultName)
      const a = document.createElement('a')
      const objectUrl = URL.createObjectURL(blob)
      a.href = objectUrl
      a.download = fname
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objectUrl)

      setToast('Receipt downloaded successfully.')
      setTimeout(()=>navigate('/dashboard'), 900)
    } catch (e) {
      setErr(`Network error while downloading receipt. ${e?.message || ''}`)
    }
  }

  return (
    <ATMFrame>
      {toast && <div className="ok-banner">{toast}</div>}
      {err && <div className="error-banner" style={{whiteSpace:'pre-wrap'}}>{err}</div>}

      <div style={{fontSize:48, marginBottom:8}}>{ok ? '✔' : '✖'}</div>
      <h2 style={{marginTop:0}}>{ok ? 'Transaction successful' : 'Transaction failed'}</h2>

      <div className="row"><span className="muted">Type</span><span>{(payload.type||'').toUpperCase()}</span></div>
      <div className="row"><span className="muted">Amount</span><span>₹ {Number(payload.amount||0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
      <div className="row"><span className="muted">Balance</span><span>₹ {Number(payload.balance||0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
      {payload.reference && <div className="row"><span className="muted">Ref</span><span>{payload.reference}</span></div>}

      <div className="row" style={{gap:8, marginTop:12}}>
        <button className="btn" onClick={()=>navigate('/dashboard')}>Back to dashboard</button>
        {ok && !!payload.receiptPdf && (
          <button className="btn primary" onClick={handleDownload}>Download receipt</button>
        )}
      </div>
    </ATMFrame>
  )
}
