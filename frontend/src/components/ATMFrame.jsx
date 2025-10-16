import React from 'react'
import '../styles.css'
import Navbar from './Navbar.jsx'
import { useSession } from '../SessionContext.jsx'

export default function ATMFrame({ children }){
  const { t, lang, setLang, needReceipt, setNeedReceipt } = useSession()
  return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>
      <div className="atm-frame">
        <div className="atm-header">
          {/* <div className="brand">Quick Cash</div> */}
          <div className="header-right">
            <select value={lang} onChange={e=>setLang(e.target.value)} className="btn" style={{padding:'6px 8px'}}>
              <option value="en">EN</option>
              <option value="hi">HI</option>
              <option value="te">TE</option>
            </select>
            <label style={{display:'flex',alignItems:'center',gap:6}}>
              <input type="checkbox" checked={needReceipt} onChange={e=>setNeedReceipt(e.target.checked)} />
              <span>I need receipt</span>
            </label>
            <span>12:30</span>
          </div>
        </div>
        <Navbar/>
        {children}
      </div>
    </div>
  )
}


// import React from 'react'
// import '../styles.css'
// import Navbar from './Navbar.jsx'
// import { useSession } from '../SessionContext.jsx'

// export default function ATMFrame({ children }){
//   const { t, lang, setLang, needReceipt, setNeedReceipt } = useSession()
//   return (
//     <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>
//       <div className="atm-frame">
//         <div className="atm-header">
//           {/* <div className="brand">Quick Cash</div> */}
//           <div className="header-right">
//             <select value={lang} onChange={e=>setLang(e.target.value)} className="btn" style={{padding:'6px 8px'}}>
//               <option value="en">EN</option>
//               <option value="hi">HI</option>
//               <option value="te">TE</option>
//             </select>
//             <label style={{display:'flex',alignItems:'center',gap:6}}>
//               <input type="checkbox" checked={needReceipt} onChange={e=>setNeedReceipt(e.target.checked)} />
//               <span>I need receipt</span>
//             </label>
//             <span>12:30</span>
//           </div>
//         </div>
//         <Navbar/>
//         {children}
//       </div>
//     </div>
//   )
// }



