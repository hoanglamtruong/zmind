<template>
  <div class="relative w-full h-[calc(100vh-105px)] overflow-x-auto overflow-y-auto bg-white select-none">
    <div class="min-w-[1050px]">
      <!-- Header Row -->
      <div class="grid grid-cols-[40px_280px_70px_70px_1fr] border-b border-gray-200 bg-gray-50/70 text-[11px] font-bold text-gray-500 uppercase tracking-wider sticky top-0 z-20">
        <div class="py-2.5 px-2 text-center border-r border-gray-200">#</div>
        <div class="py-2.5 px-3 border-r border-gray-200">TASK NAME</div>
        <div class="py-2.5 px-2 text-center border-r border-gray-200">START</div>
        <div class="py-2.5 px-2 text-center border-r border-gray-200">END</div>

        <!-- Timeline Scale -->
        <div class="grid grid-cols-6 text-center py-2.5">
          <div class="border-r border-gray-200 text-gray-600 font-semibold">Jul 1</div>
          <div class="border-r border-gray-200 text-gray-600 font-semibold">Jul 8</div>
          <div class="border-r border-gray-200 text-gray-600 font-semibold">Jul 15</div>
          <div class="border-r border-gray-200 text-gray-600 font-semibold">Jul 22</div>
          <div class="border-r border-gray-200 text-gray-600 font-semibold">Jul 29</div>
          <div class="text-gray-600 font-semibold">Aug 5</div>
        </div>
      </div>

      <!-- Gantt Rows -->
      <div class="relative divide-y divide-gray-100">
        <!-- SVG Grid Background & Dependency Curves -->
        <svg class="absolute inset-0 w-full h-full pointer-events-none z-0">
          <!-- Timeline column grid lines -->
          <line v-for="i in 5" :key="i" :x1="460 + i * ((1050 - 460) / 6)" y1="0" :x2="460 + i * ((1050 - 460) / 6)" y2="100%" stroke="#f1f5f9" stroke-width="1" />
          
          <!-- Dependency line from Meetings to Product Development -->
          <path d="M 520 85 C 530 150, 500 280, 545 320" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="3,3" />
        </svg>

        <div 
          v-for="item in flatList" 
          :key="item.id"
          class="grid grid-cols-[40px_280px_70px_70px_1fr] items-center h-10 hover:bg-slate-50/70 transition-colors relative z-10"
        >
          <!-- 1. Index # -->
          <div class="text-center text-xs text-gray-400 font-medium border-r border-gray-100 h-full flex items-center justify-center">
            {{ item.index }}
          </div>

          <!-- 2. Task Name & Tree indentation -->
          <div 
            class="flex items-center space-x-1.5 px-3 border-r border-gray-100 h-full overflow-hidden"
            :style="{ paddingLeft: `${Math.max(8, item.depth * 18)}px` }"
          >
            <!-- Toggle caret if has children -->
            <button 
              v-if="item.children && item.children.length > 0"
              @click.stop="toggleNodeCollapse(item.id)"
              class="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-700"
            >
              <span class="text-[10px] font-bold">{{ item.collapsed ? '▶' : '▼' }}</span>
            </button>

            <!-- Priority badge -->
            <span 
              v-if="item.priority"
              :class="[
                'text-[9px] font-black px-1.5 py-0.2 rounded-full text-white shrink-0',
                item.priority === 'P0' ? 'bg-[#e11d48]' : (item.priority === 'P1' ? 'bg-[#f59e0b]' : 'bg-[#0284c7]')
              ]"
            >
              {{ item.priority }}
            </span>

            <!-- Flag -->
            <span v-if="item.flag" class="text-xs text-emerald-600 font-bold shrink-0">🚩</span>

            <!-- Arrow -->
            <span v-if="item.hasArrow" class="w-3.5 h-3.5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[8px] font-bold shrink-0">
              →
            </span>

            <!-- Task Label -->
            <span 
              :class="[
                'text-xs truncate font-medium',
                item.id === 'root' ? 'font-black text-slate-900 uppercase' : '',
                item.depth === 1 ? 'font-bold text-slate-800' : 'text-slate-600',
                item.id.startsWith('n3') ? 'text-rose-700 font-bold' : ''
              ]"
            >
              {{ item.title }}
            </span>
          </div>

          <!-- 3. Start Date (Clickable to open DatePicker) -->
          <div 
            @click="openDatePicker(item.id, 'startDate', item.startDate, $event)"
            class="text-center text-xs font-mono text-gray-500 hover:text-sky-600 hover:bg-sky-50 cursor-pointer h-full flex items-center justify-center border-r border-gray-100 transition-colors"
          >
            {{ formatShortDate(item.startDate) }}
          </div>

          <!-- 4. End Date (Clickable to open DatePicker) -->
          <div 
            @click="openDatePicker(item.id, 'endDate', item.endDate, $event)"
            class="text-center text-xs font-mono text-gray-500 hover:text-sky-600 hover:bg-sky-50 cursor-pointer h-full flex items-center justify-center border-r border-gray-100 transition-colors"
          >
            {{ formatShortDate(item.endDate) }}
          </div>

          <!-- 5. Gantt Timeline Bar -->
          <div class="h-full relative flex items-center px-2">
            <div 
              v-if="item.startDate"
              class="h-4 rounded-md shadow-xs relative flex items-center transition-all cursor-pointer hover:brightness-110"
              :style="getBarStyle(item)"
              :title="`${item.title}: ${item.startDate} to ${item.endDate || item.startDate}`"
            >
              <!-- Shaded inner progress bar -->
              <div 
                v-if="item.progress"
                class="h-full rounded-md bg-black/20"
                :style="{ width: `${item.progress}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { store, getFlatNodes, toggleNodeCollapse } from '../store/mindmapStore.js'

const flatList = computed(() => {
  return getFlatNodes(false)
})

function formatShortDate(dateStr) {
  if (!dateStr) return '-'
  return dateStr.slice(5).replace('-', '/')
}

function openDatePicker(nodeId, field, currentDate, event) {
  const rect = event.currentTarget.getBoundingClientRect()
  store.datePickerState = {
    isOpen: true,
    nodeId,
    field,
    currentDate: currentDate || '2026-07-01',
    posX: rect.left - 50,
    posY: rect.bottom + 5
  }
}

// Calculate bar left & width based on July 1 - August 7 timeline (approx 38 days)
function getBarStyle(item) {
  const timelineStart = new Date('2026-07-01').getTime()
  const timelineEnd = new Date('2026-08-07').getTime()
  const totalDuration = timelineEnd - timelineStart

  const start = new Date(item.startDate).getTime()
  const end = item.endDate ? new Date(item.endDate).getTime() : start + (2 * 24 * 3600 * 1000)

  const leftPercent = Math.max(0, Math.min(100, ((start - timelineStart) / totalDuration) * 100))
  const widthPercent = Math.max(2, Math.min(100 - leftPercent, ((end - start) / totalDuration) * 100))

  let bg = item.effectiveColor || '#0f172a'
  if (item.depth > 1) {
    if (bg === '#0f172a') bg = '#38bdf8'
    if (bg === '#ea580c') bg = '#fb923c'
    if (bg === '#be123c') bg = '#f43f5e'
  }

  return {
    left: `${leftPercent}%`,
    width: `${widthPercent}%`,
    backgroundColor: bg
  }
}
</script>
