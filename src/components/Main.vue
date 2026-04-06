<script setup>
import { ref, onMounted } from 'vue'
import { TheChessboard } from 'vue3-chessboard'
import 'vue3-chessboard/style.css'
import '@fortawesome/fontawesome-free/css/all.css'
import { initStockfish, makeEngineMove, getBestMove } from '../utils/stockfish'
import EngineSettings from './EngineSettings.vue'

const boardConfig = {
  coordinates: true,
};

let boardAPI = null;
let isEngineMove = false;
const isThinking = ref(false);
const evaluation = ref(null);
const showSettings = ref(false);
const showFenDialog = ref(false);
const fenInput = ref('');
const fenError = ref('');

onMounted(async () => {
  await initStockfish();
});

const onBoardCreated = (api) => {
  boardAPI = api;
};

const onMove = async (moveEvent) => {
  if (isEngineMove) return;
  if (!boardAPI) return;

  const fen = boardAPI.getFen();
  const result = await getBestMove(fen);
  if (result && result.evaluation) {
    evaluation.value = result.evaluation.display;
  }
};

const makeMove = async () => {
  if (isThinking.value || !boardAPI) return;
  
  isThinking.value = true;
  evaluation.value = null;
  
  const fen = boardAPI.getFen();
  const result = await makeEngineMove(fen);
  
  if (result && result.move) {
    // Store evaluation if available
    if (result.evaluation) {
      evaluation.value = result.evaluation.display;
    }
    
    // Convert move to object format (e.g., e2e4 -> {from: 'e2', to: 'e4'})
    const from = result.move.substring(0, 2);
    const to = result.move.substring(2, 4);
    const promotion = result.move.length > 4 ? result.move[4] : undefined;
    
    try {
      const moveData = {
        from,
        to,
      };
      
      if (promotion) {
        moveData.promotion = promotion;
      }
      
      isEngineMove = true;
      boardAPI.move(moveData);
      isEngineMove = false;
    } catch (error) {
      console.error('Invalid move:', error);
    }
  }
  
  isThinking.value = false;
};

const openFenDialog = () => {
  fenInput.value = boardAPI ? boardAPI.getFen() : '';
  fenError.value = '';
  showFenDialog.value = true;
};

const loadFen = () => {
  if (!boardAPI) return;
  const fen = fenInput.value.trim();
  if (!fen) {
    fenError.value = 'Please enter a FEN string.';
    return;
  }
  try {
    boardAPI.setPosition(fen);
    evaluation.value = null;
    showFenDialog.value = false;
  } catch (e) {
    fenError.value = 'Invalid FEN string. Please check and try again.';
  }
};

const flipBoard = () => {
  if (!boardAPI) return;
  boardAPI.toggleOrientation();
};

const undoMove = async () => {
  if (!boardAPI) return;
  isEngineMove = true;
  boardAPI.undoLastMove();
  isEngineMove = false;
  const fen = boardAPI.getFen();
  const result = await getBestMove(fen);
  if (result && result.evaluation) {
    evaluation.value = result.evaluation.display;
  }
};


</script>

<template>
  <div class="chessboard-container">
    <h1>Chess Vibe</h1>
    <div class="board-header">
      <div class="evaluation">
        Evaluation: {{ evaluation }}
      </div>
      <div class="header-buttons">
        <button class="settings-btn" @click="openFenDialog" aria-label="Import FEN">
          <i class="fas fa-file-import"></i>
        </button>
        <button class="settings-btn" @click="showSettings = true" aria-label="Engine settings">
          <i class="fas fa-cog"></i>
        </button>
      </div>
    </div>
    <TheChessboard 
      :board-config="boardConfig" 
      @board-created="onBoardCreated"
      @move="onMove"
    />
    <div class="controls">
      <button class="btn" @click="makeMove" :disabled="isThinking">
        <i class="fas fa-robot"></i>
        <span v-if="isThinking" class="btn-text">Thinking...</span>
        <span v-else class="btn-text">Bot Move</span>
      </button>
      <button class="btn" @click="undoMove" aria-label="Undo last move">
        <i class="fas fa-undo"></i>
        <span class="btn-text">Undo</span>
      </button>
      <button class="btn" @click="flipBoard" aria-label="Flip board">
        <i class="fas fa-repeat"></i>
        <span class="btn-text">Flip</span>
      </button>
    </div>

    <EngineSettings v-if="showSettings" @close="showSettings = false" />

    <div v-if="showFenDialog" class="dialog-overlay" @click.self="showFenDialog = false">
      <div class="dialog">
        <h2>Import FEN</h2>
        <p class="dialog-desc">Paste a FEN string to load a position onto the board.</p>
        <textarea
          v-model="fenInput"
          class="fen-input"
          rows="3"
          placeholder="e.g. rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
          @keydown.enter.prevent="loadFen"
        ></textarea>
        <p v-if="fenError" class="fen-error">{{ fenError }}</p>
        <div class="dialog-actions">
          <button class="btn" @click="loadFen"><i class="fas fa-check"></i><span class="btn-text">Load</span></button>
          <button class="btn" @click="showFenDialog = false"><i class="fas fa-times"></i><span class="btn-text">Cancel</span></button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chessboard-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

h1 {
  color: white;
  margin-bottom: 2rem;
  font-size: 3rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 500px;
  margin-bottom: 0.75rem;
}

@media (max-width: 768px) {
  .board-header {
    max-width: 90vw;
  }
}

@media (max-width: 480px) {
  .board-header {
    max-width: 95vw;
  }
}

.evaluation {
  color: white;
  font-size: 1rem;
  font-weight: 600;
  padding: 0.25rem 0;
  min-height: 1.5rem;
}

/* Fix horizontal coordinates offset */
:deep(.files) {
  transform: translateY(-7px);
}

/* Fix vertical coordinates offset */
:deep(.ranks) {
  transform: translateY(-7px);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .chessboard-container {
    padding: 1rem;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 1rem;
  }
}

@media (max-width: 480px) {
  .chessboard-container {
    padding: 0.5rem;
  }

  h1 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }
}

/* Ensure chessboard is responsive */
:deep(.main-wrap) {
  width: 100%;
  max-width: 500px;
}

@media (max-width: 768px) {
  :deep(.main-wrap) {
    max-width: 90vw;
  }
}

@media (max-width: 480px) {
  :deep(.main-wrap) {
    max-width: 95vw;
  }
}

.header-buttons {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.settings-btn {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  font-size: 1.2rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.6);
  transform: translateY(-2px);
}

.settings-btn:active {
  transform: translateY(0);
  background: rgba(255, 255, 255, 0.25);
}

/* Controls */
.controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}

.btn-text {
  margin-left: 0.5rem;
}

.btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.6);
  transform: translateY(-2px);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
  background: rgba(255, 255, 255, 0.25);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.dialog {
  background: #fff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dialog h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.dialog-desc {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
}

.fen-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.6rem 0.75rem;
  font-size: 0.85rem;
  font-family: monospace;
  border: 1.5px solid #ccc;
  border-radius: 0.5rem;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
}

.fen-input:focus {
  border-color: #764ba2;
}

.fen-error {
  margin: 0;
  font-size: 0.85rem;
  color: #e53e3e;
}

.dialog-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.dialog-actions .btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
}

.dialog-actions .btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a6fd6 0%, #65408e 100%);
  transform: translateY(-1px);
}

@media (max-width: 480px) {
  .controls {
    margin-top: 1.5rem;
  }

  .btn {
    padding: 0.625rem 1.25rem;
    font-size: 0.9rem;
  }
}


</style>
