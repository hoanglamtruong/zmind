<template>
  <div 
    v-if="store.datePickerState.isOpen" 
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-[1px]"
    @click.self="close"
  >
    <div 
      class="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 w-72 select-none relative animate-in fade-in zoom-in duration-150"
      :style="{
        position: 'absolute',
        top: Math.min(store.datePickerState.posY, windowHeight - 340) + 'px',
        left: Math.min(store.datePickerState.posX, windowWidth - 300) + 'px'
      }"
    >
      <!-- Month Navigation -->
      <div class="flex items-center justify-between mb-3 px-1">
        <button @click="changeMonth(-1)" class="p-1 hover:bg-gray-100 rounded-lg text-gray-500">
          <ChevronLeft class="w-4 h-4" />
        </button>
        <span class="font-semibold text-gray-800 text-sm">
          {{ monthNames[currentMonth] }} {{ currentYear }}
        </span>
        <button @click="changeMonth(1)" class="p-1 hover:bg-gray-100 rounded-lg text-gray-500">
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>

      <!-- Days of Week -->
      <div class="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400 mb-2">
        <span v-for="d in ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']" :key="d">{{ d }}</span>
      </div>

      <!-- Calendar Days -->
      <div class="grid grid-cols-7 gap-1 text-center text-xs">
        <span v-for="blank in startDayOfWeek" :key="'b' + blank"></span>
        <button
          v-for="day in daysInMonth"
          :key="day"
          @click="selectDay(day)"
          :class="[
            'h-7 w-7 mx-auto flex items-center justify-center rounded-full font-medium transition-colors',
            isSelected(day)
              ? 'border-2 border-sky-400 text-sky-600 font-bold bg-sky-50/50'
              : 'text-gray-700 hover:bg-gray-100'
          ]"
        >
          {{ day }}
        </button>
      </div>

      <!-- Presence indicator: Alisa cursor hovering on day 11 -->
      <div class="absolute right-4 top-24 pointer-events-none flex items-center space-x-1">
        <svg class="w-4 h-4 text-purple-600 fill-purple-600 drop-shadow" viewBox="0 0 24 24">
          <path d="M4 4l7 18 3-7 7-3L4 4z"/>
        </svg>
        <span class="bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">Alisa</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { store, setTaskDate } from '../store/mindmapStore.js'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const windowWidth = window.innerWidth
const windowHeight = window.innerHeight

const currentYear = ref(2026)
const currentMonth = ref(6) // 0-indexed: 6 is July

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const startDayOfWeek = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 1).getDay()
})

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
})

function isSelected(day) {
  const current = store.datePickerState.currentDate
  if (!current) return false
  const [y, m, d] = current.split('-').map(Number)
  return y === currentYear.value && m === (currentMonth.value + 1) && d === day
}

function changeMonth(delta) {
  currentMonth.value += delta
  if (currentMonth.value > 11) {
    currentMonth.value = 0
    currentYear.value++
  } else if (currentMonth.value < 0) {
    currentMonth.value = 11
    currentYear.value--
  }
}

function selectDay(day) {
  const mStr = String(currentMonth.value + 1).padStart(2, '0')
  const dStr = String(day).padStart(2, '0')
  const dateStr = `${currentYear.value}-${mStr}-${dStr}`

  const { nodeId, field } = store.datePickerState
  if (nodeId && field) {
    setTaskDate(nodeId, field, dateStr)
  }
  close()
}

function close() {
  store.datePickerState.isOpen = false
}
</script>
