import React from 'react'
import { useSession } from '../SessionContext.jsx'
import { useNavigate } from 'react-router-dom'

export default function Navbar(){
  const { t, token, countdown, logout } = useSession()
  const navigate = useNavigate()
  async function doLogout(){
    await logout()
    navigate('/')
  }
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="brand">QuickCash</div>
      <div className="flex items-center gap-3">
        {token && <span>{t.timer}: {countdown}s</span>}
        {token && <button className="btn danger" onClick={doLogout}>{t.logout}</button>}
      </div>
    </div>
  )
}


