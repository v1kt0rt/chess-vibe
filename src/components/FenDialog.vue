<script setup>
import { ref } from 'vue'
import { EXAMPLE_GAMES } from '../utils/examplegames'

const props = defineProps({
  initialFen: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['load', 'close'])

const fenInput = ref(props.initialFen)
const fenError = ref('')

const onSelectExample = (e) => {
  if (e.target.value) {
    fenInput.value = e.target.value
    fenError.value = ''
  }
}

const loadFen = () => {
  const fen = fenInput.value.trim()
  if (!fen) {
    fenError.value = 'Please enter a FEN string.'
    return
  }
  emit('load', fen)
}

const setError = (msg) => {
  fenError.value = msg
}

defineExpose({ setError })
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('close')">
    <div class="dialog">
      <h2>Import FEN</h2>
      <p class="dialog-desc">Paste a FEN string or pick an example position.</p>
      <select class="fen-select" @change="onSelectExample">
        <option value="">— Example positions —</option>
        <option v-for="game in EXAMPLE_GAMES" :key="game.label" :value="game.fen">
          {{ game.label }}
        </option>
      </select>
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
        <button class="btn" @click="emit('close')"><i class="fas fa-times"></i><span class="btn-text">Cancel</span></button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.fen-select {
  width: 100%;
  box-sizing: border-box;
  padding: 0.6rem 0.75rem;
  font-size: 0.9rem;
  border: 1.5px solid #ccc;
  border-radius: 0.5rem;
  outline: none;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s;
}

.fen-select:focus {
  border-color: #764ba2;
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

.btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}

.btn-text {
  margin-left: 0.5rem;
}

.btn:hover {
  background: linear-gradient(135deg, #5a6fd6 0%, #65408e 100%);
  transform: translateY(-1px);
}

.btn:active {
  transform: translateY(0);
}
</style>
