import React from 'react'
import { SessionProvider } from './SessionContext.jsx'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Language from './pages/Language.jsx'
import Card from './pages/Card.jsx'
import Pin from './pages/Pin.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Withdraw from './pages/Withdraw.jsx'
import Deposit from './pages/Deposit.jsx'
import Transfer from './pages/Transfer.jsx'
import ChangePin from './pages/ChangePin.jsx'
import MiniStatement from './pages/MiniStatement.jsx'
import TransactionResult from './pages/TransactionResult.jsx'

export default function App(){
  return (
    <SessionProvider>
      <BrowserRouter>
        <AnimatedRoutes/>
      </BrowserRouter>
    </SessionProvider>
  )
}

function AnimatedRoutes(){
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Page><Language/></Page>} />
        <Route path="/card" element={<Page><Card/></Page>} />
        <Route path="/pin" element={<Page><Pin/></Page>} />
        <Route path="/dashboard" element={<Page><Dashboard/></Page>} />
        <Route path="/withdraw" element={<Page><Withdraw/></Page>} />
        <Route path="/deposit" element={<Page><Deposit/></Page>} />
        <Route path="/transfer" element={<Page><Transfer/></Page>} />
        <Route path="/change-pin" element={<Page><ChangePin/></Page>} />
        <Route path="/mini-statement" element={<Page><MiniStatement/></Page>} />
        <Route path="/result" element={<Page><TransactionResult/></Page>} />
        <Route path="*" element={<Navigate to="/" replace/>} />
      </Routes>
    </AnimatePresence>
  )
}

function Page({ children }){
  return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',background:'#0b0f1a',color:'#fff'}}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} style={{ width: '100%', display:'flex', justifyContent:'center' }}>
        {children}
      </motion.div>
    </div>
  )
}

