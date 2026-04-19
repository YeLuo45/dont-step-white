import React from 'react'
import './Controls.css'

export function Controls({ onLeft, onRight, onStep, onPause, isPaused }) {
  return (
    <div className="controls">
      <div className="control-row">
        <button className="control-btn left" onClick={onLeft}>◀</button>
        <button className="control-btn step" onClick={onStep}>踩</button>
        <button className="control-btn right" onClick={onRight}>▶</button>
      </div>
      <button className="pause-btn" onClick={onPause}>{isPaused ? '继续' : '暂停'}</button>
    </div>
  )
}
