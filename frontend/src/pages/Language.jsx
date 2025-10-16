import React from 'react'
import { useSession } from '../SessionContext.jsx'
import Navbar from '../components/Navbar.jsx'
import { useNavigate } from 'react-router-dom'

export default function Language(){
  const { t, setLang } = useSession()
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <Navbar/>
      <div className="text-center mt-6">
        <h1 className="text-3xl font-bold brand">{t.title}</h1>
        <p className="text-muted mt-2">{t.selectLanguage}</p>
        <div className="grid gap-3 mt-4 w-64">
          <button className="btn primary" onClick={()=>{setLang('en'); navigate('/card')}}>{t.english}</button>
          <button className="btn" onClick={()=>{setLang('hi'); navigate('/card')}}>{t.hindi}</button>
          <button className="btn" onClick={()=>{setLang('te'); navigate('/card')}}>{t.telugu}</button>
        </div>
      </div>
    </div>
  )
}


