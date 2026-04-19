import React from 'react'
import { CELL_EMPTY, CELL_WHITE, CELL_BLACK } from '../utils/constants'
import './Cell.css'

export function Cell({ type, isPointer, onClick }) {
  let className = 'cell'
  if (type === CELL_WHITE) className += ' cell-white'
  else if (type === CELL_BLACK) className += ' cell-black'
  else className += ' cell-empty'
  if (isPointer) className += ' cell-pointer'

  return (
    <div className={className} onClick={onClick}>
      {isPointer && <div className="pointer-indicator" />}
    </div>
  )
}
