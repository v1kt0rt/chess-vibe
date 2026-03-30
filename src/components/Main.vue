<script setup>
import { ref, onMounted } from 'vue'
import { TheChessboard } from 'vue3-chessboard'
import 'vue3-chessboard/style.css'
import '@fortawesome/fontawesome-free/css/all.css'
import { 
  initStockfish, 
  makeEngineMove, 
  setSkillLevel, 
  setSearchDepth,
  getSkillLevel,
  getSearchDepth
} from '../utils/stockfish'

const boardConfig = {
  coordinates: true,
};

let boardAPI = null;
const isThinking = ref(false);
const evaluation = ref(null);
const showSettingsDialog = ref(false);
const skillLevelInput = ref(20);
const searchDepthInput = ref(15);

onMounted(async () => {
  await initStockfish();
});

const onBoardCreated = (api) => {
  boardAPI = api;
};

const onMove = (moveEvent) => {
  // A move was made on the board, we could trigger the AI automatically if needed
  console.log('Move made:', moveEvent);
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
      
      boardAPI.move(moveData);
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

const undoMove = () => {
  if (!boardAPI) return;
  boardAPI.undoLastMove();
};

const openSettings = () => {
  skillLevelInput.value = getSkillLevel();
  searchDepthInput.value = getSearchDepth();
  showSettingsDialog.value = true;
};

const closeSettings = () => {
  showSettingsDialog.value = false;
};

const saveSettings = () => {
  setSkillLevel(skillLevelInput.value);
  setSearchDepth(searchDepthInput.value);
  closeSettings();
};
</script>

<template>
  <div class="chessboard-container">
    <h1>Chess Vibe</h1>
    <div class="board-header">
      <div class="evaluation">
        Evaluation: {{ evaluation }}
      </div>
      <button class="settings-btn" @click="openSettings" aria-label="Engine settings">
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

    <!-- Settings Dialog -->
    <div v-if="showSettingsDialog" class="dialog-overlay" @click.self="closeSettings">
      <div class="dialog">
        <div class="dialog-header">
          <h2>Engine Settings</h2>
          <button class="close-btn" @click="closeSettings" aria-label="Close settings">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="dialog-body">
          <div class="setting-group">
            <label for="skill-level">Skill Level: {{ skillLevelInput }}/20</label>
            <input 
              id="skill-level"
              v-model.number="skillLevelInput" 
              type="range" 
              min="0" 
              max="20" 
              class="setting-slider"
            />
            <div class="slider-labels">
              <span>Weak</span>
              <span>Strong</span>
            </div>
          </div>

          <div class="setting-group">
            <label for="search-depth">Search Depth: {{ searchDepthInput }}</label>
            <input 
              id="search-depth"
              v-model.number="searchDepthInput" 
              type="number" 
              min="1" 
              max="50"
              class="setting-input"
            />
            <div class="input-hint">Higher = stronger but slower (1-50)</div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-secondary" @click="closeSettings">Cancel</button>
          <button class="btn-primary" @click="saveSettings">Save Settings</button>
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

/* Dialog overlay */
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
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.dialog-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.dialog-body {
  padding: 1.5rem;
}

.setting-group {
  margin-bottom: 1.5rem;
}

.setting-group label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
}

.setting-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #ddd;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.setting-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
  transition: background 0.2s ease;
}

.setting-slider::-webkit-slider-thumb:hover {
  background: #764ba2;
}

.setting-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
  border: none;
  transition: background 0.2s ease;
}

.setting-slider::-moz-range-thumb:hover {
  background: #764ba2;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #999;
  margin-top: 0.5rem;
}

.setting-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  font-size: 1rem;
  box-sizing: border-box;
}

.setting-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-hint {
  font-size: 0.8rem;
  color: #999;
  margin-top: 0.5rem;
}

.dialog-footer {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
  justify-content: flex-end;
}

.btn-primary,
.btn-secondary {
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #764ba2;
  transform: translateY(-2px);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover {
  background: #d0d0d0;
  transform: translateY(-2px);
}

.btn-secondary:active {
  transform: translateY(0);
}

@media (max-width: 480px) {
  .dialog {
    width: 95%;
  }

  .dialog-header h2 {
    font-size: 1.25rem;
  }

  .setting-group {
    margin-bottom: 1rem;
  }

  .dialog-footer {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}
</style>
