<script setup>
import { TheChessboard } from 'vue3-chessboard'
import 'vue3-chessboard/style.css'
</script>

<template>
  <div class="chessboard-container">
    <h1>Chess Vibe</h1>
    <TheChessboard />
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
</style>
