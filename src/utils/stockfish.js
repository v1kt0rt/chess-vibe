let engine = null;
let engineReady = false;
let bestMoveResolver = null;
let lastEvaluation = null;

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
            const scoreValue = parseInt(scoreMatch[2], 10);
            
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

export function getBestMove(fen, depth = 15) {
  return new Promise((resolve) => {
    if (!engine || !engineReady) {
      console.error('Engine not ready');
      resolve(null);
      return;
    }

    bestMoveResolver = resolve;
    
    engine.postMessage('position fen ' + fen);
    engine.postMessage('go depth ' + depth);
  });
}

export async function makeEngineMove(fen) {
  const result = await getBestMove(fen);
  return result;
}
