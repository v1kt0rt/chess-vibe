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
const showPgnModal = ref(false);
const pgnText = ref('');
const pgnLoaded = ref(false);
const pgnError = ref('');
const pgnInfo = ref(null);

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

const openPgnModal = () => {
  pgnText.value = '';
  pgnError.value = '';
  showPgnModal.value = true;
};

const loadPgnGame = () => {
  if (!boardAPI || !pgnText.value.trim()) return;
  try {
    boardAPI.loadPgn(pgnText.value.trim());
    pgnInfo.value = boardAPI.getPgnInfo();
    pgnLoaded.value = true;
    evaluation.value = null;
    pgnError.value = '';
    showPgnModal.value = false;
    boardAPI.viewStart();
  } catch {
    pgnError.value = 'Invalid PGN. Please check the format and try again.';
  }
};

const goToStart = () => boardAPI?.viewStart();
const goPrevious = () => boardAPI?.viewPrevious();
const goNext = () => boardAPI?.viewNext();
const goToEnd = () => boardAPI?.stopViewingHistory();

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
        <template v-if="pgnLoaded && pgnInfo">
          <span class="pgn-players">
            {{ pgnInfo.White || '?' }} vs {{ pgnInfo.Black || '?' }}
          </span>
        </template>
        <template v-else>
          Evaluation: {{ evaluation }}
        </template>
      </div>
      <button class="settings-btn" @click="showSettings = true" aria-label="Engine settings">
        <i class="fas fa-cog"></i>
      </button>
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
      <button class="btn" @click="openPgnModal" aria-label="Load PGN">
        <i class="fas fa-file-import"></i>
        <span class="btn-text">Load PGN</span>
      </button>
    </div>

    <div v-if="pgnLoaded" class="nav-controls">
      <button class="nav-btn" @click="goToStart" aria-label="Go to start">
        <i class="fas fa-backward-step"></i>
      </button>
      <button class="nav-btn" @click="goPrevious" aria-label="Previous move">
        <i class="fas fa-backward"></i>
      </button>
      <button class="nav-btn" @click="goNext" aria-label="Next move">
        <i class="fas fa-forward"></i>
      </button>
      <button class="nav-btn" @click="goToEnd" aria-label="Go to end">
        <i class="fas fa-forward-step"></i>
      </button>
    </div>

    <EngineSettings v-if="showSettings" @close="showSettings = false" />

    <div v-if="showPgnModal" class="dialog-overlay" @click.self="showPgnModal = false">
      <div class="dialog">
        <div class="dialog-header">
          <h2>Load PGN</h2>
          <button class="close-btn" @click="showPgnModal = false" aria-label="Close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="dialog-body">
          <label for="pgn-input">Paste PGN below:</label>
          <textarea
            id="pgn-input"
            v-model="pgnText"
            class="pgn-textarea"
            placeholder="[Event &quot;Example&quot;]&#10;[White &quot;Player 1&quot;]&#10;[Black &quot;Player 2&quot;]&#10;&#10;1. e4 e5 2. Nf3 ..."
            rows="10"
            spellcheck="false"
          ></textarea>
          <p v-if="pgnError" class="pgn-error">{{ pgnError }}</p>
        </div>
        <div class="dialog-footer">
          <button class="btn-secondary" @click="showPgnModal = false">Cancel</button>
          <button class="btn-primary" @click="loadPgnGame" :disabled="!pgnText.trim()">Load Game</button>
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

@media (max-width: 480px) {
  .controls {
    margin-top: 1.5rem;
  }

  .btn {
    padding: 0.625rem 1.25rem;
    font-size: 0.9rem;
  }
}

/* Navigation controls */
.nav-controls {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.nav-btn {
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  font-size: 1.1rem;
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

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.6);
  transform: translateY(-2px);
}

.nav-btn:active {
  transform: translateY(0);
  background: rgba(255, 255, 255, 0.25);
}

/* PGN players label */
.pgn-players {
  font-size: 0.95rem;
  font-weight: 600;
}

/* PGN dialog */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  max-width: 480px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.dialog-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #666;
  padding: 0.25rem;
  line-height: 1;
}

.close-btn:hover {
  color: #333;
}

.dialog-body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dialog-body label {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.pgn-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  font-family: monospace;
  font-size: 0.85rem;
  resize: vertical;
  box-sizing: border-box;
  line-height: 1.5;
  color: #333;
}

.pgn-textarea:focus {
  outline: none;
  border-color: #764ba2;
  box-shadow: 0 0 0 2px rgba(118, 75, 162, 0.2);
}

.pgn-error {
  color: #c0392b;
  font-size: 0.875rem;
  margin: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.btn-secondary {
  padding: 0.6rem 1.25rem;
  border: 2px solid #ccc;
  border-radius: 0.5rem;
  background: white;
  color: #555;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  border-color: #999;
  color: #333;
}

.btn-primary {
  padding: 0.6rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}


</style>
