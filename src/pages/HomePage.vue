<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import '@fortawesome/fontawesome-free/css/all.css'
import { exampleGames, selectGame, type ExampleGame } from '../utils/examplegames'

const router = useRouter()

const playGame = (game: ExampleGame) => {
  selectGame(game)
  router.push({ name: 'play' })
}

const buildTime = __BUILD_TIME__

onMounted(() => {
  exampleGames.init()
})
</script>

<template>
  <div class="home-container">
    <h1>Chess Vibe</h1>
    <section class="examples" aria-label="Example games">
      <p v-if="exampleGames.loading" class="examples-status">
        <i class="fas fa-spinner fa-spin"></i> Loading…
      </p>
      <p v-else-if="exampleGames.error" class="examples-status">{{ exampleGames.error }}</p>
      <p v-else-if="exampleGames.games.length === 0" class="examples-status">No example games yet.</p>
      <ul v-else class="examples-list">
        <li v-for="game in exampleGames.games" :key="game.fen">
          <span class="game-name">{{ game.label || 'Untitled' }}</span>
          <button
            type="button"
            class="play-btn"
            @click="playGame(game)"
            :aria-label="`Play ${game.label || 'this game'}`"
            :title="`Play ${game.label || 'this game'}`"
          >
            <i class="fas fa-play"></i>
          </button>
        </li>
      </ul>
    </section>

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

.examples {
  width: 100%;
  max-width: 24rem;
}

.examples-status {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
}

.examples-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.examples-list li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.4rem 0.4rem 0.4rem 1rem;
  color: white;
  text-align: left;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.5rem;
}

.game-name {
  flex: 1; /* takes the free space, pushing the button to the right */
  min-width: 0;
  overflow-wrap: anywhere;
}

.play-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem; /* comfortable touch target */
  height: 2.5rem;
  padding: 0;
  font-size: 1rem;
  color: white;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

.play-btn:hover,
.play-btn:focus-visible {
  background: rgba(255, 255, 255, 0.35);
  border-color: rgba(255, 255, 255, 0.7);
}

.build-label {
  margin-top: 1.5rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75rem;
}
</style>
