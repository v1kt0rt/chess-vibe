<script setup>
import { ref } from 'vue'
import '@fortawesome/fontawesome-free/css/all.css'
import { setSkillLevel, setSearchDepth, getSkillLevel, getSearchDepth } from '../utils/stockfish'

const emit = defineEmits(['close'])

const skillLevelInput = ref(getSkillLevel())
const searchDepthInput = ref(getSearchDepth())

const close = () => emit('close')

const save = () => {
  setSkillLevel(skillLevelInput.value)
  setSearchDepth(searchDepthInput.value)
  close()
}
</script>

<template>
  <div class="dialog-overlay" @click.self="close">
    <div class="dialog">
      <div class="dialog-header">
        <h2>Engine Settings</h2>
        <button class="close-btn" @click="close" aria-label="Close settings">
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
        <button class="btn-secondary" @click="close">Cancel</button>
        <button class="btn-primary" @click="save">Save Settings</button>
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
