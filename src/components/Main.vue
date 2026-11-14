<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { TheChessboard, type BoardApi, type BoardConfig, type Move, type Promotion } from 'vue3-chessboard'
import 'vue3-chessboard/style.css'
import '@fortawesome/fontawesome-free/css/all.css'
import { initStockfish, makeEngineMove, getBestMove, getSkillLevel, getSearchDepth, sideToMove } from '../utils/logic'
import EngineSettings from './EngineSettings.vue'
import { takeSelectedGame, type ExampleGame } from '../utils/examplegames'

// The board's Move type is `string | {...}`; Exclude<> keeps just the object form
type MoveObject = Exclude<Move, string>;
// Indexed access: the type of the `from` property (a board square like 'e2')
type Square = MoveObject['from'];

const boardConfig: BoardConfig = {
  coordinates: true,
};

let boardAPI: BoardApi | null = null;
let isEngineMove = false;
let orientation: 'white' | 'black' = 'white';
const isThinking = ref(false);
const evaluation = ref<string | null>(null);
const EVAL_HIDDEN_KEY = 'chess-vibe:evalHidden';
const readEvalHidden = () => {
  try {
    return localStorage.getItem(EVAL_HIDDEN_KEY) === 'true';
  } catch {
    return false;
  }
};
const evalHidden = ref(readEvalHidden());
watch(evalHidden, (hidden) => {
  try {
    localStorage.setItem(EVAL_HIDDEN_KEY, String(hidden));
  } catch {
    // storage unavailable (e.g. private mode); keep in-memory state only
  }
});
const autoPlay = ref(false);
const showSettings = ref(false);
const skillLevel = ref(getSkillLevel());
const searchDepth = ref(getSearchDepth());
const gameLabel = ref('');

onMounted(async () => {
  await initStockfish();
});

const closeSettings = () => {
  showSettings.value = false;
  skillLevel.value = getSkillLevel();
  searchDepth.value = getSearchDepth();
};

const onBoardCreated = (api: BoardApi) => {
  boardAPI = api;
  // A game picked on the start page is loaded as soon as the board exists
  const selected = takeSelectedGame();
  if (selected) loadGame(selected);
};

const onMove = async () => {
  if (isEngineMove) return;
  if (!boardAPI) return;

  const fen = boardAPI.getFen();
  const result = await getBestMove(fen);
  if (result && result.evaluation) {
    evaluation.value = result.evaluation.display;
  }

  if (autoPlay.value) {
    await makeMove();
  }
};

const toggleAutoPlay = () => {
  autoPlay.value = !autoPlay.value;
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
    
    // Convert move to object format (e.g., e2e4 -> {from: 'e2', to: 'e4'}).
    // `as` narrows plain strings to the board's square/piece types; we trust
    // Stockfish to send valid UCI, and an illegal move is caught below.
    const moveData: MoveObject = {
      from: result.move.substring(0, 2) as Square,
      to: result.move.substring(2, 4) as Square,
    };
    if (result.move.length > 4) {
      moveData.promotion = result.move[4] as Promotion;
    }

    try {
      isEngineMove = true;
      boardAPI.move(moveData);
      isEngineMove = false;
    } catch (error) {
      console.error('Invalid move:', error);
    }
  }
  
  isThinking.value = false;
};

const flipToActiveColor = (fen: string) => {
  if (!boardAPI) return;
  const activeColor = sideToMove(fen) === 'b' ? 'black' : 'white';
  if (activeColor !== orientation) {
    boardAPI.toggleOrientation();
    orientation = activeColor;
  }
};

const loadGame = async (game: ExampleGame) => {
  if (!boardAPI) return;
  try {
    boardAPI.setPosition(game.fen);
  } catch (error) {
    console.error('Invalid FEN in example game:', game, error);
    return;
  }
  flipToActiveColor(game.fen);
  evaluation.value = null;
  gameLabel.value = game.label;
  // The board can be ready before the engine is; wait for it (it starts only once)
  await initStockfish();
  const result = await getBestMove(game.fen);
  if (result && result.evaluation) {
    evaluation.value = result.evaluation.display;
  }
};

const flipBoard = () => {
  if (!boardAPI) return;
  boardAPI.toggleOrientation();
  orientation = orientation === 'white' ? 'black' : 'white';
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
    <div v-if="gameLabel" class="game-label">
      {{ gameLabel }}
    </div>
    <div class="board-header">
      <div class="info-group">
        <div class="engine-strength">
          Strength:<br />{{ skillLevel }}/{{ searchDepth }}
        </div>
        <button
          type="button"
          class="evaluation"
          @click="evalHidden = !evalHidden"
          :aria-pressed="evalHidden"
          :aria-label="evalHidden ? 'Show evaluation' : 'Hide evaluation'"
          :title="evalHidden ? 'Show evaluation' : 'Hide evaluation'"
        >
          Eval:<br />
          <i v-if="evalHidden" class="fas fa-eye-slash eval-mask"></i>
          <template v-else>{{ evaluation || '-' }}</template>
        </button>
      </div>
      <div class="header-buttons">
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
      <div class="btn btn-split">
        <button class="btn-segment" @click="makeMove" :disabled="isThinking">
          <i class="fas fa-robot"></i>
          <span class="btn-text">Bot Move</span>
        </button>
        <button
          class="btn-segment btn-segment-auto"
          :class="{ active: autoPlay }"
          @click="toggleAutoPlay"
          aria-label="Toggle automatic mode"
          :aria-pressed="autoPlay"
        >
          <i class="fas fa-bolt"></i>
        </button>
      </div>
      <button class="btn" @click="undoMove" aria-label="Undo last move">
        <i class="fas fa-undo"></i>
        <span class="btn-text">Undo</span>
      </button>
      <button class="btn" @click="flipBoard" aria-label="Flip board">
        <i class="fas fa-repeat"></i>
        <span class="btn-text">Flip</span>
      </button>
    </div>


    <EngineSettings v-if="showSettings" @close="closeSettings" />
  </div>
</template>

<style scoped>
.chessboard-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  min-height: 100dvh;
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

.info-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.evaluation {
  color: white;
  font-size: 1rem;
  font-weight: 600;
  padding: 0.25rem 0;
  min-height: 1.5rem;
  min-width: 3.5rem;
  background: none;
  border: none;
  font-family: inherit;
  line-height: inherit;
  text-align: left;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.evaluation:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.7);
  outline-offset: 2px;
  border-radius: 4px;
}

.eval-mask {
  opacity: 0.85;
}

.engine-strength {
  color: white;
  font-size: 1rem;
  font-weight: 600;
  padding: 0.25rem 0;
}

.game-label {
  color: white;
  font-size: 1rem;
  font-weight: 600;
  padding: 0.25rem 0;
  text-align: center;
  width: 100%;
  max-width: 500px;
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
    justify-content: flex-start;
    padding: 0.75rem 1rem;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .chessboard-container {
    padding: 0.5rem;
  }

  h1 {
    font-size: 1.5rem;
    margin-bottom: 0.25rem;
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
}

.settings-btn:active {
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
  padding: 0.25rem 0.5rem;
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
}

.btn:active:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-split {
  padding: 0;
  gap: 0;
  overflow: hidden;
}

.btn-split:hover {
  transform: none;
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}

.btn-segment {
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}

.btn-segment:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.btn-segment:active:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.btn-segment:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-segment-auto {
  padding: 0.375rem 0.5rem;
}

.btn-segment-auto.active {
  background: rgba(255, 255, 255, 0.35);
  color: #ffd700;
}

@media (max-width: 768px) {
  .controls {
    margin-top: 1rem;
  }
}

@media (max-width: 480px) {
  .controls {
    margin-top: 0.75rem;
  }

  .btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.9rem;
  }
}


</style>
