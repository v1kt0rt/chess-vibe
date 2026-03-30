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
    </div>

    <EngineSettings v-if="showSettings" @close="showSettings = false" />
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


</style>
