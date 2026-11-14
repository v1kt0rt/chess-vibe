<script setup lang="ts">
import '@fortawesome/fontawesome-free/css/all.css'

const buildTime = __BUILD_TIME__
</script>

<template>
  <div class="home-container">
    <h1>Chess Vibe</h1>
    <!-- RouterLink renders an <a> and switches pages without a full reload -->
    <RouterLink :to="{ name: 'play' }" class="btn">
      <i class="fas fa-chess-board"></i>
      <span>Play</span>
    </RouterLink>
    <div class="build-label">Build: {{ buildTime }}</div>
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 2rem;
  box-sizing: border-box;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

h1 {
  color: white;
  margin: 0 0 2rem;
  font-size: 3rem;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-width: 12rem;
  padding: 0.75rem 1.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

.build-label {
  margin-top: 1.5rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75rem;
}

.btn:hover,
.btn:focus-visible {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.6);
}
</style>
