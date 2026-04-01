<script setup>
import { ref } from 'vue'
import '@fortawesome/fontawesome-free/css/all.css'

const emit = defineEmits(['load', 'close'])

const pgnText = ref('')
const pgnError = ref('')

const close = () => emit('close')

const loadGame = () => {
  if (!pgnText.value.trim()) return
  try {
    emit('load', pgnText.value.trim())
  } catch {
    pgnError.value = 'Invalid PGN. Please check the format and try again.'
  }
}

const onLoadError = () => {
  pgnError.value = 'Invalid PGN. Please check the format and try again.'
}

defineExpose({ onLoadError })
</script>

<template>
  <div class="dialog-overlay" @click.self="close">
    <div class="dialog">
      <div class="dialog-header">
        <h2>Load PGN</h2>
        <button class="close-btn" @click="close" aria-label="Close">
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
        <button class="btn-secondary" @click="close">Cancel</button>
        <button class="btn-primary" @click="loadGame" :disabled="!pgnText.trim()">Load Game</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
