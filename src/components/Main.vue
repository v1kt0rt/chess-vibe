<script setup>
import { TheChessboard } from 'vue3-chessboard'
import 'vue3-chessboard/style.css'

const boardConfig = {
  coordinates: true,
};
</script>

<template>
  <div class="chessboard-container">
    <h1>Chess Vibe</h1>
    <TheChessboard :board-config="boardConfig" />
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

/* Fix horizontal coordinates offset */
:deep(.files) {
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
</style>
