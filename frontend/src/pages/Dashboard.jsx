import React, { useEffect } from 'react'
import { useSession } from '../SessionContext.jsx'
import ATMFrame from '../components/ATMFrame.jsx'
import { apiGet } from '../api.js'
import { useNavigate } from 'react-router-dom'

function maskCard(card){ return /^\d{16}$/.test(card||'') ? '************'+card.slice(-4) : '' }

const cards = [
  { key:'withdraw', label:'Withdraw', to:'/withdraw', grad:'from-fuchsia-500 to-indigo-500', icon:'💰' },
  { key:'deposit', label:'Deposit', to:'/deposit', grad:'from-emerald-500 to-teal-500', icon:'💵' },
  { key:'transfer', label:'Transfer', to:'/transfer', grad:'from-sky-500 to-cyan-500', icon:'🔁' },
  { key:'mini', label:'Mini Statement', to:'/mini-statement', grad:'from-pink-500 to-rose-500', icon:'📄' },
  { key:'pin', label:'Change PIN', to:'/change-pin', grad:'from-violet-500 to-purple-500', icon:'🔐' },
]

export default function Dashboard(){
  const { t, user, balanceInfo, setBalanceInfo, API, token, navigate: sessionNavigate, cardNumber } = useSession()
  const navigate = useNavigate()

  useEffect(()=>{
    if(!token) return
    apiGet(API, '/tx/balance', token, ()=>sessionNavigate('lang')).then(setBalanceInfo).catch(()=>{})
  },[token])

  return (
    <ATMFrame>
      <h2 className="mt-0 text-xl font-semibold">{t.dashboard}</h2>
      <div className="text-sm text-muted">{t.welcome} {user?.name}</div>
      <div className="grid grid-cols-3 gap-3 mt-3">
        {cards.map(c => (
          <button key={c.key} className={`h-28 rounded-xl text-left p-4 bg-gradient-to-br ${c.grad} text-white shadow-lg hover:shadow-xl transition`} onClick={()=>navigate(c.to)}>
            <div className="text-2xl">{c.icon}</div>
            <div className="font-semibold mt-2">{c.label}</div>
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-1 text-sm">
        <div>{t.accountType}: {balanceInfo?.account_type ?? ''}</div>
        <div>{t.balance}: {balanceInfo?.balance ?? ''}</div>
        <div>{t.maskedCard}: {maskCard(cardNumber)}</div>
      </div>
    </ATMFrame>
  )
}


