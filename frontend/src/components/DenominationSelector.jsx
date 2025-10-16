import React from 'react'

export default function DenominationSelector({ notes = [2000,500,200,100,50,20,10], values, setValues, disabledAbove }){
  return (
    <div className="denom-grid">
      {notes.map(n => {
        const disabled = typeof disabledAbove === 'number' && n > disabledAbove
        const count = values[n] || 0
        const line = count * n
        return (
          <React.Fragment key={n}>
            <div className="pill" style={{opacity: disabled?0.5:1}}>₹{n}</div>
            <div className="segmented" style={{opacity: disabled?0.5:1}}>
              <button disabled={disabled} onClick={()=>setValues(v=>({...v,[n]: Math.max(0,(v[n]||0)-1)}))}>-</button>
              <span>{count}</span>
              <button disabled={disabled} onClick={()=>setValues(v=>({...v,[n]: (v[n]||0)+1}))}>+</button>
            </div>
            <div className="amount-cell" style={{opacity: disabled?0.5:1}}>₹ {line||0}</div>
          </React.Fragment>
        )
      })}
    </div>
  )
}


