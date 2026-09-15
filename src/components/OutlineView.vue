<template>
  <div class="relative w-full h-[calc(100vh-105px)] overflow-y-auto bg-white p-8 select-none">
    <div class="max-w-3xl mx-auto">
      
      <!-- Root Node Heading -->
      <div class="flex items-center space-x-3 mb-6 pb-2 border-b border-gray-100">
        <div class="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
          <List class="w-5 h-5" />
        </div>
        <h1 class="text-xl font-bold text-slate-900 tracking-wide">TO DO LIST</h1>
      </div>

      <!-- Recursive / Flat Tree Rendering with Dotted Guidelines -->
      <div class="space-y-1 relative pl-2">
        <!-- Collaborator Joe cursor -->
        <div 
          class="absolute pointer-events-none transition-all duration-300 flex items-center space-x-1 z-30"
          style="left: 65px; top: 18px;"
        >
          <svg class="w-4 h-4 text-sky-600 fill-sky-600 drop-shadow" viewBox="0 0 24 24">
            <path d="M4 4l7 18 3-7 7-3L4 4z"/>
          </svg>
          <span class="bg-sky-600 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow">
            Joe
          </span>
        </div>

        <div 
          v-for="item in flatList" 
          :key="item.id"
          v-show="item.id !== 'root'"
          class="group flex items-center py-1.5 px-2 hover:bg-slate-50/80 rounded-lg transition-colors relative"
          :style="{ paddingLeft: `${item.depth * 28}px` }"
        >
          <!-- Vertical Dotted Guidelines for Nested Depth -->
          <div 
            v-for="d in item.depth" 
            :key="d" 
            class="absolute top-0 bottom-0 border-l border-dashed border-gray-200 pointer-events-none"
            :style="{ left: `${(d - 1) * 28 + 14}px` }"
          ></div>

          <!-- Collapse / Expand Caret -->
          <button 
            v-if="item.children && item.children.length > 0"
            @click.stop="toggleNodeCollapse(item.id)"
            class="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-700 mr-1"
          >
            <ChevronDown v-if="!item.collapsed" class="w-3.5 h-3.5" />
            <ChevronRight v-else class="w-3.5 h-3.5" />
          </button>
          <span v-else class="w-5 mr-1 flex items-center justify-center">
            <span class="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
          </span>

          <!-- Status Icon / Checkbox / Clock -->
          <div class="flex items-center space-x-2 mr-2">
            <!-- Clock icon for main sections -->
            <Clock v-if="item.depth === 1" class="w-4 h-4 text-slate-700" />
            
            <!-- Checkbox for leaf tasks -->
            <input 
              v-if="item.completed !== undefined"
              type="checkbox" 
              :checked="item.completed"
              @change="toggleTaskComplete(item.id)"
              class="w-4 h-4 rounded text-sky-600 border-gray-300 focus:ring-0 cursor-pointer" 
            />

            <!-- Progress Pie Indicator -->
            <span v-if="item.progress && item.depth > 1" class="text-xs">
              {{ item.progress >= 75 ? '🟢' : (item.progress >= 50 ? '🌓' : '⏱️') }}
            </span>

            <!-- Priority Badge -->
            <span 
              v-if="item.priority" 
              :class="[
                'text-[10px] font-black px-1.5 py-0.5 rounded-full text-white shadow-xs',
                item.priority === 'P0' ? 'bg-[#e11d48]' : (item.priority === 'P1' ? 'bg-[#f59e0b]' : 'bg-[#0284c7]')
              ]"
            >
              {{ item.priority }}
            </span>

            <!-- Flag Icon -->
            <span v-if="item.flag" class="text-xs text-emerald-600 font-bold">🚩</span>

            <!-- Arrow indicator -->
            <span v-if="item.hasArrow" class="w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px] font-bold">
              →
            </span>
          </div>

          <!-- Item Text Title (Double click to edit) -->
          <div class="flex-1 flex items-center space-x-2">
            <input
              v-if="editingId === item.id"
              v-model="editTitle"
              @blur="saveEdit(item.id)"
              @keydown.enter="saveEdit(item.id)"
              class="text-sm border-b border-sky-500 outline-none px-1 py-0.5 bg-white font-medium"
              autoFocus
            />
            <span 
              v-else
              @dblclick="startEdit(item)"
              :class="[
                'text-sm font-medium transition-colors cursor-text',
                item.id.startsWith('n3') ? 'text-rose-700 font-bold' : (item.depth === 1 ? 'font-bold text-slate-900' : 'text-slate-700'),
                item.completed ? 'line-through text-gray-400' : ''
              ]"
            >
              {{ item.title }}
            </span>

            <!-- Special Icons for Strategy in Outline -->
            <span v-if="item.id === 'n3'" class="flex items-center space-x-1 text-gray-400 text-xs">
              <MessageSquare class="w-3.5 h-3.5" />
              <span>1</span>
              <ExternalLink class="w-3.5 h-3.5 ml-1" />
            </span>
          </div>

          <!-- Date preview on hover -->
          <div v-if="item.startDate" class="text-xs text-gray-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity pr-2">
            {{ item.startDate.slice(5).replace('-', '/') }} - {{ item.endDate ? item.endDate.slice(5).replace('-', '/') : '' }}
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { store, getFlatNodes, toggleNodeCollapse, toggleTaskComplete, updateNodeTitle } from '../store/mindmapStore.js'
import { List, ChevronDown, ChevronRight, Clock, MessageSquare, ExternalLink } from 'lucide-vue-next'

const editingId = ref(null)
const editTitle = ref('')

const flatList = computed(() => {
  return getFlatNodes(false)
})

function startEdit(item) {
  editingId.value = item.id
  editTitle.value = item.title
}

function saveEdit(id) {
  if (editingId.value) {
    updateNodeTitle(id, editTitle.value)
    editingId.value = null
  }
}
</script>
