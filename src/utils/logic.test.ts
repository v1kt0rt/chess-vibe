import { describe, it, expect, beforeEach, vi } from 'vitest'
import { parseScore, sideToMove } from './logic'

describe('sideToMove', () => {
  it('reads white to move', () => {
    expect(sideToMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')).toBe('w')
  })

  it('reads black to move', () => {
    expect(sideToMove('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1')).toBe('b')
  })

  it('defaults to white for a FEN without a side field', () => {
    expect(sideToMove('8/8/8/8/8/8/8/8')).toBe('w')
  })
})

describe('parseScore', () => {
  const cpLine = (cp: number) => `info depth 15 seldepth 20 multipv 1 score cp ${cp} nodes 12345 pv e2e4 e7e5`
  const mateLine = (n: number) => `info depth 15 score mate ${n} nodes 999 pv d1h5`

  it('returns null for lines without a score', () => {
    expect(parseScore('info depth 1 currmove e2e4 currmovenumber 1', 'w')).toBeNull()
  })

  it('keeps centipawn score as-is when white is to move', () => {
    expect(parseScore(cpLine(35), 'w')).toEqual({ type: 'cp', value: 35, display: '0.35' })
  })

  it('negates centipawn score when black is to move', () => {
    expect(parseScore(cpLine(35), 'b')).toEqual({ type: 'cp', value: -35, display: '-0.35' })
  })

  it('formats negative centipawns from white perspective', () => {
    expect(parseScore(cpLine(-120), 'w')!.display).toBe('-1.20')
  })

  it('handles a zero score for black without producing -0.00', () => {
    expect(parseScore(cpLine(0), 'b')!.display).toBe('0.00')
  })

  it('parses mate scores for white', () => {
    expect(parseScore(mateLine(3), 'w')).toEqual({ type: 'mate', value: 3, display: 'M3' })
  })

  it('negates mate scores when black is to move', () => {
    expect(parseScore(mateLine(2), 'b')).toEqual({ type: 'mate', value: -2, display: 'M-2' })
  })

  it('ignores score bound qualifiers after the value', () => {
    expect(parseScore('info depth 10 score cp 50 lowerbound nodes 1', 'w')!.value).toBe(50)
  })
})

// Minimal stand-in for the Stockfish web worker: records commands and lets
// tests push engine output lines back to the listener.
type Listener = (e: { data: string }) => void

class FakeWorker {
  // Class fields must be declared in TS (JS let you just assign them in the constructor)
  static instance: FakeWorker
  sent: string[] = []
  listeners: Listener[] = []

  constructor() {
    FakeWorker.instance = this
  }
  addEventListener(_type: string, fn: Listener) {
    this.listeners.push(fn)
  }
  postMessage(msg: string) {
    this.sent.push(msg)
    if (msg === 'uci') queueMicrotask(() => this.emit('uciok'))
  }
  emit(line: string) {
    this.listeners.forEach(fn => fn({ data: line }))
  }
}

describe('getBestMove', () => {
  let engine: FakeWorker
  // typeof import('...') = the type of the whole module's exports
  let logic: typeof import('./logic')

  beforeEach(async () => {
    vi.resetModules()
    vi.stubGlobal('Worker', FakeWorker)
    logic = await import('./logic')
    await logic.initStockfish()
    engine = FakeWorker.instance
  })

  const WHITE_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  const BLACK_FEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'

  it('resolves with the best move and white-perspective evaluation', async () => {
    const pending = logic.getBestMove(BLACK_FEN)
    engine.emit('info depth 15 score cp 40 pv e7e5')
    engine.emit('bestmove e7e5 ponder g1f3')

    expect(await pending).toEqual({
      move: 'e7e5',
      evaluation: { type: 'cp', value: -40, display: '-0.40' },
    })
  })

  it('reuses the same engine when initialized again', async () => {
    await logic.initStockfish()
    expect(FakeWorker.instance).toBe(engine)
  })

  it('sends position and depth to the engine', () => {
    logic.getBestMove(WHITE_FEN, 8)
    expect(engine.sent).toContain(`position fen ${WHITE_FEN}`)
    expect(engine.sent).toContain('go depth 8')
  })

  it('resolves a superseded search with null and stops the engine', async () => {
    const first = logic.getBestMove(WHITE_FEN)
    logic.getBestMove(BLACK_FEN)

    expect(await first).toBeNull()
    expect(engine.sent).toContain('stop')
  })

  it('does not hand the stopped search result to the new caller', async () => {
    logic.getBestMove(WHITE_FEN)
    const second = logic.getBestMove(BLACK_FEN)

    // Engine finishes the stopped search first, then the new one
    engine.emit('info depth 5 score cp 900 pv e2e4')
    engine.emit('bestmove e2e4')
    engine.emit('info depth 15 score cp 20 pv e7e5')
    engine.emit('bestmove e7e5')

    expect(await second).toEqual({
      move: 'e7e5',
      evaluation: { type: 'cp', value: -20, display: '-0.20' },
    })
  })
})

describe('setSearchDepth', () => {
  let logic: typeof import('./logic')

  beforeEach(async () => {
    vi.resetModules() // fresh module state (default depth) per test
    logic = await import('./logic')
  })

  it('accepts a whole number in range', () => {
    logic.setSearchDepth(20)
    expect(logic.getSearchDepth()).toBe(20)
  })

  it('rounds fractional values', () => {
    logic.setSearchDepth(7.6)
    expect(logic.getSearchDepth()).toBe(8)
  })

  it('clamps values outside 1-50', () => {
    logic.setSearchDepth(0)
    expect(logic.getSearchDepth()).toBe(1)
    logic.setSearchDepth(-5)
    expect(logic.getSearchDepth()).toBe(1)
    logic.setSearchDepth(999)
    expect(logic.getSearchDepth()).toBe(50)
  })

  it('ignores NaN (e.g. an empty input) and keeps the previous depth', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    logic.setSearchDepth(12)
    logic.setSearchDepth(NaN)
    expect(logic.getSearchDepth()).toBe(12)
    logic.setSearchDepth(Infinity)
    expect(logic.getSearchDepth()).toBe(12)
  })
})
