import React, { useEffect, useMemo, useState } from 'react'
import ATMFrame from '../components/ATMFrame.jsx'
import { useSession } from '../SessionContext.jsx'
import { apiGet } from '../api.js'
import { useNavigate } from 'react-router-dom'

export default function MiniStatement() {
  const { API, token, navigate: sessionNavigate } = useSession()
  const [rows, setRows] = useState([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [ok, setOk] = useState('')
  const navigate = useNavigate()

  async function load() {
    const qs = new URLSearchParams()
    if (from) qs.set('from', from)
    if (to) qs.set('to', to)
    const data = await apiGet(API, `/mini?${qs.toString()}`, token, () => sessionNavigate('lang'))
    setRows(data)
  }

  useEffect(() => { load().catch(() => { }) }, [])

  const totals = useMemo(() => {
    let dep = 0, wd = 0
    rows.forEach(r => {
      // Add DEPOSIT and TRANSFER_IN to the credit/deposit total
      if (['DEPOSIT', 'TRANSFER_IN', 'TRANSFER'].includes(r.type)) {
        dep += Number(r.amount || 0)
      }

      // Add WITHDRAW, TRANSFER_OUT, and generic TRANSFER to the debit/withdrawal total
      if (['WITHDRAW', 'TRANSFER_OUT'].includes(r.type)) {
        wd += Number(r.amount || 0)
      }
    })
    return { dep, wd }
  }, [rows])

  async function downloadPdf() {
    const qs = new URLSearchParams()
    if (from) qs.set('from', from)
    if (to) qs.set('to', to)
    const url = `${API}/api/mini/atm/mini-statement/pdf?${qs.toString()}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) { setOk(''); return }
    const blob = await res.blob()
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'Mini_Statement.pdf'; document.body.appendChild(a); a.click(); document.body.removeChild(a)
    setOk('Receipt downloaded');
    setTimeout(() => navigate('/dashboard'), 800)
  }

  return (
    <ATMFrame>
      {ok && <div className="ok-banner">{ok}</div>}
      <div className="row gap-2">
        <input type="date" className="btn" value={from} onChange={e => setFrom(e.target.value)} />
        <input type="date" className="btn" value={to} onChange={e => setTo(e.target.value)} />
        <button className="btn primary" onClick={load}>Apply</button>
        <button className="btn" onClick={downloadPdf}>Download PDF</button>
      </div>
      <div className="mt-2 max-h-[420px] overflow-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th><th>Type</th><th>Amount</th><th>Status</th><th>Ref</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>{new Date(r.created_at).toLocaleString()}</td>
                <td>{r.type}</td>
                <td>₹ {Number(r.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>{r.status}</td>
                <td>{r.id}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="2">Totals</td>
              <td>+₹ {totals.dep.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / -₹ {totals.wd.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td colSpan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="row mt-2">
        <button className="btn" onClick={() => navigate('/dashboard')}>Back</button>
      </div>
    </ATMFrame>
  )
}


