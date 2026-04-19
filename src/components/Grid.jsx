import React from 'react'
import { Cell } from './Cell'
import { ROWS, COLS } from '../utils/constants'
import './Grid.css'

export function Grid({ grid, pointerCol, onCellClick }) {
  return (
    <div className="grid">
      {grid.map((row, rowIdx) => (
        <div key={rowIdx} className="grid-row">
          {row.map((cellType, colIdx) => (
            <Cell
              key={colIdx}
              type={cellType}
              isPointer={rowIdx === ROWS - 1 && colIdx === pointerCol}
              onClick={() => onCellClick(colIdx)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
