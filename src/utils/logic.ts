// --- Types -----------------------------------------------------------------

// A union of string literals: only 'w' or 'b' are allowed, not any string.
export type Side = 'w' | 'b'

// A "discriminated union": checking `type` tells TypeScript which shape you have.
export type Evaluation =
  | { type: 'cp'; value: number; display: string } // centipawns
  | { type: 'mate'; value: number; display: string } // mate in N

export interface BestMoveResult {
  move: string // UCI notation, e.g. 'e2e4' or 'e7e8q'
  evaluation: Evaluation | null
}

// --- Module state ----------------------------------------------------------

let engine: Worker | null = null
let engineReady = false
let bestMoveResolver: ((result: BestMoveResult | null) => void) | null = null
let staleBestMoves = 0 // bestmove replies still expected from stopped searches
let lastEvaluation: Evaluation | null = null
let currentSideToMove: Side = 'w' // track whose turn it is for score normalization
let skillLevel = 20 // 0-20, default 20 (strongest); type `number` is inferred
let searchDepth = 15 // default search depth

// Extract side to move ('w' or 'b') from a FEN string (second field)
export function sideToMove(fen: string): Side {
  return fen.split(' ')[1] === 'b' ? 'b' : 'w'
}

// Parse the score from a UCI info line, normalized to white's perspective.
// Returns null if the line has no score.
export function parseScore(line: string, sideToMoveColor: Side): Evaluation | null {
  const scoreMatch = line.match(/score (cp|mate) (-?\d+)/)
  if (!scoreMatch) return null

  const scoreType = scoreMatch[1]
  const rawValue = parseInt(scoreMatch[2], 10)
  // Engine scores are from the side to move; negate if black is to move
  const value = sideToMoveColor === 'b' ? -rawValue : rawValue

  if (scoreType === 'cp') {
    return { type: 'cp', value, display: (value / 100).toFixed(2) }
  }
  return { type: 'mate', value, display: `M${value}` }
}

function detectWasm(): boolean {
  try {
    if (typeof WebAssembly === 'object' && WebAssembly.validate) {
      return WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00))
    }
  } catch {
    return false
  }
  return false
}

// Shared by every caller so the worker is only created once, even when the
// chessboard page is opened again after navigating away
let initPromise: Promise<void> | null = null

export function initStockfish(): Promise<void> {
  initPromise ??= startEngine()
  return initPromise
}

function startEngine(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const wasmSupported = detectWasm()
      const workerFile = wasmSupported ? 'stockfish.wasm.js' : 'stockfish.js'

      // A local const keeps the non-null Worker type inside the listener below
      const worker = new Worker(`/${workerFile}`)
      engine = worker

      worker.addEventListener('message', (e: MessageEvent<unknown>) => {
        // The worker should only send strings, but `unknown` forces us to check
        const line = e.data
        if (typeof line !== 'string') return

        if (line.includes('uciok')) {
          engineReady = true
          resolve()
        }

        // Parse evaluation from info lines
        if (line.includes('info') && line.includes('score')) {
          const evaluation = parseScore(line, currentSideToMove)
          if (evaluation) lastEvaluation = evaluation
        }

        if (line.includes('bestmove')) {
          // A stopped (superseded) search still reports a bestmove; discard it
          if (staleBestMoves > 0) {
            staleBestMoves--
            lastEvaluation = null
            return
          }
          if (bestMoveResolver) {
            const move = line.split(' ')[1]
            const resolveMove = bestMoveResolver
            bestMoveResolver = null
            resolveMove({ move, evaluation: lastEvaluation })
            lastEvaluation = null
          }
        }
      })

      worker.postMessage('uci')
    } catch (error) {
      console.error('Failed to initialize Stockfish:', error)
      initPromise = null // allow a retry on the next call
      reject(error)
    }
  })
}

// `depth?: number` makes the parameter optional (it may be undefined)
export function getBestMove(fen: string, depth?: number): Promise<BestMoveResult | null> {
  return new Promise((resolve) => {
    if (!engine || !engineReady) {
      console.error('Engine not ready')
      resolve(null)
      return
    }

    // A search is already running: abandon it so its result can't reach this caller
    if (bestMoveResolver) {
      bestMoveResolver(null)
      staleBestMoves++
      engine.postMessage('stop')
    }

    bestMoveResolver = resolve
    lastEvaluation = null
    const searchDepthValue = depth ?? searchDepth
    currentSideToMove = sideToMove(fen)

    engine.postMessage('position fen ' + fen)
    engine.postMessage('go depth ' + searchDepthValue)
  })
}

export async function makeEngineMove(fen: string): Promise<BestMoveResult | null> {
  return getBestMove(fen)
}

export function setSkillLevel(level: number): void {
  // Set skill level: 0-20 (0=weakest, 20=strongest)
  if (!engine) {
    console.error('Engine not initialized')
    return
  }
  const validLevel = Math.max(0, Math.min(20, level))
  skillLevel = validLevel
  engine.postMessage(`setoption name Skill Level value ${validLevel}`)
}

export const MIN_SEARCH_DEPTH = 1
export const MAX_SEARCH_DEPTH = 50

// Set default search depth for future moves.
// Non-numbers (e.g. NaN from an empty input) are ignored; other values are
// rounded to a whole number and clamped to MIN_SEARCH_DEPTH..MAX_SEARCH_DEPTH.
export function setSearchDepth(depth: number): void {
  if (!Number.isFinite(depth)) {
    console.error('Search depth must be a number')
    return
  }
  searchDepth = Math.max(MIN_SEARCH_DEPTH, Math.min(MAX_SEARCH_DEPTH, Math.round(depth)))
}

export function getSkillLevel(): number {
  return skillLevel
}

export function getSearchDepth(): number {
  return searchDepth
}
