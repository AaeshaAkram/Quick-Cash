// import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
// import { messages } from './i18n'
// import './styles.css'

// const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// const SessionCtx = createContext(null)
// export function useSession(){ return useContext(SessionCtx) }

// export function SessionProvider({ children }){
//   const [lang, setLang] = useState('en')
//   const t = useMemo(()=>messages[lang], [lang])
//   const [stage, setStage] = useState('lang')
//   const [cardNumber, setCardNumber] = useState('')
//   const [token, setToken] = useState('')
//   const [user, setUser] = useState(null)
//   const [balanceInfo, setBalanceInfo] = useState(null)
//   const [countdown, setCountdown] = useState(90)
//   const [error, setError] = useState('')
//   const [success, setSuccess] = useState('')
//   const [needReceipt, setNeedReceipt] = useState(true)

//   function clearMessages(){ setError(''); setSuccess('') }

//   function navigate(next, state){ clearMessages(); if(state){ window.__txResult = state } setStage(next) }

//   async function logout(){
//     try{ await fetch(`${API}/api/auth/logout`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token }) }) }catch{}
//     setToken(''); setUser(null); setBalanceInfo(null); setCardNumber(''); setCountdown(60); setStage('lang'); clearMessages()
//   }

//   useEffect(()=>{
//     if(!token) return
//     setCountdown(90)
//     const id = setInterval(()=>{
//       setCountdown(prev=>{
//         if(prev<=1){ clearInterval(id); setError(t.sessionExpired); logout(); return 0 }
//         return prev-1
//       })
//     },1000)
//     return ()=>clearInterval(id)
//   },[token, lang])

//   const value = { API, t, lang, setLang, stage, navigate, cardNumber, setCardNumber, token, setToken, user, setUser, balanceInfo, setBalanceInfo, countdown, error, setError, success, setSuccess, logout, clearMessages, needReceipt, setNeedReceipt }
//   return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>
// }



import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { messages } from './i18n'
import './styles.css'

// For local dev, prefer 4001 (dev server) if available
const API = import.meta.env.VITE_API_URL || 'http://localhost:4001'
const DEFAULT_COUNTDOWN = 90

const SessionCtx = createContext(null)
export function useSession(){ return useContext(SessionCtx) }

export function SessionProvider({ children }){
  const [lang, setLang] = useState('en')
  const t = useMemo(()=>messages[lang], [lang])
  const [stage, setStage] = useState('lang')
  const [cardNumber, setCardNumber] = useState('')
  const [token, setToken] = useState('')
  const [user, setUser] = useState(null)
  const [balanceInfo, setBalanceInfo] = useState(null)
  const [countdown, setCountdown] = useState(DEFAULT_COUNTDOWN)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [needReceipt, setNeedReceipt] = useState(true)

  function clearMessages(){ setError(''); setSuccess('') }
  function navigate(next, state){ clearMessages(); if(state){ window.__txResult = state } setStage(next) }
  function touch(){ setCountdown(DEFAULT_COUNTDOWN) }

  async function logout({ preserveMessages = false, redirectTo = '/' } = {}){
    try{
      await fetch(`${API}/api/auth/logout`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ token })
      })
    }catch{/* ignore */}

    setToken('')
    setUser(null)
    setBalanceInfo(null)
    setCardNumber('')
    setCountdown(DEFAULT_COUNTDOWN)
    setStage('lang')
    if (!preserveMessages) clearMessages()

    // Redirect safely without react-router hook
    if (redirectTo) window.location.replace(redirectTo)
  }

  useEffect(()=>{
    if(!token) return
    setCountdown(DEFAULT_COUNTDOWN)

    const id = setInterval(()=>{
      setCountdown(prev=>{
        if(prev <= 1){
          clearInterval(id)
          setError(t?.sessionExpired || 'Your session has expired.')
          logout({ preserveMessages: true, redirectTo: '/' })
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return ()=>clearInterval(id)
  }, [token, lang, t])

  const value = {
    API, t, lang, setLang,
    stage, navigate,
    cardNumber, setCardNumber,
    token, setToken,
    user, setUser,
    balanceInfo, setBalanceInfo,
    countdown,
    error, setError,
    success, setSuccess,
    logout,
    clearMessages,
    needReceipt, setNeedReceipt,
    touch,
  }

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>
}




