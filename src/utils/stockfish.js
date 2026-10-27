let engine = null;
let engineReady = false;
let bestMoveResolver = null;
let staleBestMoves = 0; // bestmove replies still expected from stopped searches
let lastEvaluation = null;
let currentSideToMove = 'w'; // track whose turn it is for score normalization
let skillLevel = 20; // 0-20, default 20 (strongest)
let searchDepth = 15; // default search depth

// Extract side to move ('w' or 'b') from a FEN string (second field)
export function sideToMove(fen) {
  return fen.split(' ')[1] === 'b' ? 'b' : 'w';
}

// Parse the score from a UCI info line, normalized to white's perspective.
// Returns null if the line has no score.
export function parseScore(line, sideToMoveColor) {
  const scoreMatch = line.match(/score (cp|mate) (-?\d+)/);
  if (!scoreMatch) return null;

  const scoreType = scoreMatch[1];
  const rawValue = parseInt(scoreMatch[2], 10);
  // Engine scores are from the side to move; negate if black is to move
  const value = sideToMoveColor === 'b' ? -rawValue : rawValue;

  if (scoreType === 'cp') {
    return { type: 'cp', value, display: (value / 100).toFixed(2) };
  }
  return { type: 'mate', value, display: `M${value}` };
}

function detectWasm() {
  try {
    if (typeof WebAssembly === 'object' && WebAssembly.validate) {
      return WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
    }
  } catch (e) {
    return false;
  }
  return false;
}

export function initStockfish() {
  return new Promise((resolve, reject) => {
    try {
      const wasmSupported = detectWasm();
      const workerFile = wasmSupported ? 'stockfish.wasm.js' : 'stockfish.js';
      
      engine = new Worker(`/${workerFile}`);
      
      engine.addEventListener('message', (e) => {
        const line = e.data;
        
        if (line.includes && line.includes('uciok')) {
          engineReady = true;
          resolve();
        }
        
        // Parse evaluation from info lines
        if (line.includes && line.includes('info') && line.includes('score')) {
          const evaluation = parseScore(line, currentSideToMove);
          if (evaluation) lastEvaluation = evaluation;
        }
        
        if (line.includes && line.includes('bestmove')) {
          // A stopped (superseded) search still reports a bestmove; discard it
          if (staleBestMoves > 0) {
            staleBestMoves--;
            lastEvaluation = null;
            return;
          }
          if (bestMoveResolver) {
            const move = line.split(' ')[1];
            const resolve = bestMoveResolver;
            bestMoveResolver = null;
            resolve({ move, evaluation: lastEvaluation });
            lastEvaluation = null;
          }
        }
      });
      
      engine.postMessage('uci');
    } catch (error) {
      console.error('Failed to initialize Stockfish:', error);
      reject(error);
    }
  });
}

export function getBestMove(fen, depth = null) {
  return new Promise((resolve) => {
    if (!engine || !engineReady) {
      console.error('Engine not ready');
      resolve(null);
      return;
    }

    // A search is already running: abandon it so its result can't reach this caller
    if (bestMoveResolver) {
      bestMoveResolver(null);
      staleBestMoves++;
      engine.postMessage('stop');
    }

    bestMoveResolver = resolve;
    lastEvaluation = null;
    const searchDepthValue = depth !== null ? depth : searchDepth;
    currentSideToMove = sideToMove(fen);
    
    engine.postMessage('position fen ' + fen);
    engine.postMessage('go depth ' + searchDepthValue);
  });
}

export async function makeEngineMove(fen) {
  const result = await getBestMove(fen);
  return result;
}

export function setSkillLevel(level) {
  // Set skill level: 0-20 (0=weakest, 20=strongest)
  if (!engine) {
    console.error('Engine not initialized');
    return;
  }
  const validLevel = Math.max(0, Math.min(20, level));
  skillLevel = validLevel;
  engine.postMessage(`setoption name Skill Level value ${validLevel}`);
}

export function setSearchDepth(depth) {
  // Set default search depth for future moves
  if (depth <= 0) {
    console.error('Search depth must be greater than 0');
    return;
  }
  searchDepth = depth;
}

export function getSkillLevel() {
  return skillLevel;
}

export function getSearchDepth() {
  return searchDepth;
}
