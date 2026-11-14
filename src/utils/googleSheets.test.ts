import { describe, it, expect } from 'vitest'
import { parseSheetResponse } from './googleSheets'

// Shape of a real gviz response: JSON wrapped in a JS callback
const wrap = (obj) => `/*O_o*/\ngoogle.visualization.Query.setResponse(${JSON.stringify(obj)});`

describe('parseSheetResponse', () => {
  it('maps rows to objects keyed by column labels', () => {
    const text = wrap({
      table: {
        cols: [{ id: 'A', label: 'label' }, { id: 'B', label: 'fen' }],
        rows: [
          { c: [{ v: 'Opera Game' }, { v: '8/8/8/8/8/8/8/8 w - - 0 1' }] },
          { c: [{ v: 'Immortal' }, { v: '8/8/8/8/8/8/8/8 b - - 0 1' }] },
        ],
      },
    })

    expect(parseSheetResponse(text)).toEqual([
      { label: 'Opera Game', fen: '8/8/8/8/8/8/8/8 w - - 0 1' },
      { label: 'Immortal', fen: '8/8/8/8/8/8/8/8 b - - 0 1' },
    ])
  })

  it('falls back to column id when a label is empty', () => {
    const text = wrap({ table: { cols: [{ id: 'A', label: '' }], rows: [{ c: [{ v: 1 }] }] } })
    expect(parseSheetResponse(text)).toEqual([{ A: 1 }])
  })

  it('uses null for empty cells', () => {
    const text = wrap({
      table: {
        cols: [{ id: 'A', label: 'a' }, { id: 'B', label: 'b' }],
        rows: [{ c: [null, { v: null }] }],
      },
    })
    expect(parseSheetResponse(text)).toEqual([{ a: null, b: null }])
  })
})
