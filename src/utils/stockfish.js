let engine = null;
let engineReady = false;
let bestMoveResolver = null;
let lastEvaluation = null;
let currentSideToMove = 'w'; // track whose turn it is for score normalization
let skillLevel = 20; // 0-20, default 20 (strongest)
let searchDepth = 15; // default search depth

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
          const scoreMatch = line.match(/score (\w+) (-?\d+)/);
          if (scoreMatch) {
            const scoreType = scoreMatch[1]; // 'cp' for centipawns or 'mate'
            const rawValue = parseInt(scoreMatch[2], 10);
            // Normalize to white's perspective: negate if black is to move
            const scoreValue = currentSideToMove === 'b' ? -rawValue : rawValue;
            
            if (scoreType === 'cp') {
              lastEvaluation = {
                type: 'cp',
                value: scoreValue,
                display: (scoreValue / 100).toFixed(2)
              };
            } else if (scoreType === 'mate') {
              lastEvaluation = {
                type: 'mate',
                value: scoreValue,
                display: `M${scoreValue}`
              };
            }
          }
        }
        
        if (line.includes && line.includes('bestmove') && bestMoveResolver) {
          const parts = line.split(' ');
          const move = parts[1];
          bestMoveResolver({ move, evaluation: lastEvaluation });
          lastEvaluation = null;
          bestMoveResolver = null;
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

    bestMoveResolver = resolve;
    const searchDepthValue = depth !== null ? depth : searchDepth;
    // Extract side to move from FEN (second space-separated field)
    currentSideToMove = fen.split(' ')[1] ?? 'w';
    
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
