<template>
  <div 
    v-if="relationCustomizerState.isOpen && currentEdge"
    class="fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-200/90 w-72 select-none text-slate-800 text-xs overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    :style="{
      left: `${relationCustomizerState.posX}px`,
      top: `${relationCustomizerState.posY}px`
    }"
    @mousedown.stop
  >
    <!-- Header: 3 Tabs (Hand/Line, A Text, F Format - EXACT MINDOMO UI) -->
    <div class="grid grid-cols-3 border-b border-gray-200 bg-gray-50/50">
      <!-- Tab 1: Line -->
      <button 
        @click="relationCustomizerState.activeTab = 'line'"
        :class="[
          'py-2.5 flex items-center justify-center transition-colors border-r border-gray-200',
          relationCustomizerState.activeTab === 'line' 
            ? 'bg-white text-sky-600 font-bold border-b-2 border-b-sky-500 shadow-xs' 
            : 'text-gray-500 hover:text-gray-800'
        ]"
        title="Line Style"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
        </svg>
      </button>

      <!-- Tab 2: A Text -->
      <button 
        @click="relationCustomizerState.activeTab = 'text'"
        :class="[
          'py-2.5 flex items-center justify-center transition-colors border-r border-gray-200 font-serif text-sm',
          relationCustomizerState.activeTab === 'text' 
            ? 'bg-white text-sky-600 font-bold border-b-2 border-b-sky-500 shadow-xs underline underline-offset-4' 
            : 'text-gray-500 hover:text-gray-800'
        ]"
        title="Label / Text"
      >
        <span class="underline underline-offset-2">A</span>
      </button>

      <!-- Tab 3: F Format -->
      <button 
        @click="relationCustomizerState.activeTab = 'format'"
        :class="[
          'py-2.5 flex items-center justify-center transition-colors font-serif text-sm',
          relationCustomizerState.activeTab === 'format' 
            ? 'bg-white text-sky-600 font-bold border-b-2 border-b-sky-500 shadow-xs' 
            : 'text-gray-500 hover:text-gray-800'
        ]"
        title="Format"
      >
        F
      </button>
    </div>

    <!-- TAB 1: LINE STYLING -->
    <div v-if="relationCustomizerState.activeTab === 'line'" class="p-3.5 space-y-3.5">
      <!-- 1. Color Grid Swatches -->
      <div class="space-y-1.5">
        <div class="grid grid-cols-8 gap-1.5">
          <button 
            @click="setColor('#64748b')"
            class="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center hover:scale-115 transition-transform text-[9px] text-gray-400 font-bold"
            title="Mặc định"
          >
            ⚪
          </button>
          <button 
            v-for="color in colorPaletteRow1" 
            :key="color"
            @click="setColor(color)"
            :class="[
              'w-5 h-5 rounded-full hover:scale-115 transition-transform shadow-xs',
              currentEdge.color === color ? 'ring-2 ring-sky-500 ring-offset-1' : ''
            ]"
            :style="{ backgroundColor: color }"
          ></button>
        </div>

        <div class="grid grid-cols-8 gap-1.5">
          <button 
            v-for="color in colorPaletteRow2" 
            :key="color"
            @click="setColor(color)"
            :class="[
              'w-5 h-5 rounded-full hover:scale-115 transition-transform shadow-xs',
              currentEdge.color === color ? 'ring-2 ring-sky-500 ring-offset-1' : ''
            ]"
            :style="{ backgroundColor: color }"
          ></button>
        </div>

        <div class="grid grid-cols-8 gap-1.5">
          <button 
            v-for="color in colorPaletteRow3" 
            :key="color"
            @click="setColor(color)"
            :class="[
              'w-5 h-5 rounded-full hover:scale-115 transition-transform shadow-xs',
              currentEdge.color === color ? 'ring-2 ring-sky-500 ring-offset-1' : ''
            ]"
            :style="{ backgroundColor: color }"
          ></button>
        </div>
      </div>

      <div class="border-t border-gray-100"></div>

      <!-- 2. Line Shape (Straight, Angle, Spline, Curved Arc, Step) -->
      <div class="flex items-center justify-between px-1">
        <button 
          @click="setShape('straight')" 
          :class="['p-1.5 rounded-lg border transition-all', currentEdge.shape === 'straight' ? 'border-sky-500 bg-sky-50/50 text-sky-600' : 'border-transparent hover:bg-gray-100 text-gray-600']"
          title="Đường thẳng"
        >
          <svg class="w-5 h-4" viewBox="0 0 20 16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="2" y1="14" x2="18" y2="2" />
          </svg>
        </button>

        <button 
          @click="setShape('angled')" 
          :class="['p-1.5 rounded-lg border transition-all', currentEdge.shape === 'angled' ? 'border-sky-500 bg-sky-50/50 text-sky-600' : 'border-transparent hover:bg-gray-100 text-gray-600']"
          title="Đường gập góc"
        >
          <svg class="w-5 h-4" viewBox="0 0 20 16" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="2,14 12,14 18,2" />
          </svg>
        </button>

        <button 
          @click="setShape('wave')" 
          :class="['p-1.5 rounded-lg border transition-all', currentEdge.shape === 'wave' ? 'border-sky-500 bg-sky-50/50 text-sky-600' : 'border-transparent hover:bg-gray-100 text-gray-600']"
          title="Đường lượn sóng"
        >
          <svg class="w-5 h-4" viewBox="0 0 20 16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2,14 C6,14 6,2 10,2 C14,2 14,14 18,14" />
          </svg>
        </button>

        <button 
          @click="setShape('curved')" 
          :class="['p-1.5 rounded-lg border transition-all', (!currentEdge.shape || currentEdge.shape === 'curved') ? 'border-sky-500 bg-sky-50/50 text-sky-600 shadow-xs' : 'border-transparent hover:bg-gray-100 text-gray-600']"
          title="Đường cong Bézier (Kéo 2 râu xanh trên canvas để uốn)"
        >
          <svg class="w-5 h-4" viewBox="0 0 20 16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2,14 C2,4 10,2 18,2" />
          </svg>
        </button>

        <button 
          @click="setShape('step')" 
          :class="['p-1.5 rounded-lg border transition-all', currentEdge.shape === 'step' ? 'border-sky-500 bg-sky-50/50 text-sky-600' : 'border-transparent hover:bg-gray-100 text-gray-600']"
          title="Đường bậc thang"
        >
          <svg class="w-5 h-4" viewBox="0 0 20 16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2,14 L10,14 L10,2 L18,2" />
          </svg>
        </button>
      </div>

      <div class="border-t border-gray-100"></div>

      <!-- 3. Line Pattern (Solid, Dashed, Dotted) -->
      <div class="flex items-center justify-between px-1">
        <button 
          @click="setStyle('solid')" 
          :class="['p-1.5 rounded-lg border transition-all', currentEdge.style === 'solid' ? 'border-sky-500 bg-sky-50/50 text-sky-600' : 'border-transparent hover:bg-gray-100 text-gray-600']"
          title="Nét liền"
        >
          <svg class="w-7 h-2" viewBox="0 0 28 8">
            <line x1="0" y1="4" x2="28" y2="4" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          </svg>
        </button>

        <button 
          @click="setStyle('dashed')" 
          :class="['p-1.5 rounded-lg border transition-all', (!currentEdge.style || currentEdge.style === 'dashed') ? 'border-sky-500 bg-sky-50/50 text-sky-600 shadow-xs' : 'border-transparent hover:bg-gray-100 text-gray-600']"
          title="Nét đứt vừa"
        >
          <svg class="w-7 h-2" viewBox="0 0 28 8">
            <line x1="0" y1="4" x2="28" y2="4" stroke="currentColor" stroke-width="3" stroke-dasharray="5,4" stroke-linecap="round" />
          </svg>
        </button>

        <button 
          @click="setStyle('dotted')" 
          :class="['p-1.5 rounded-lg border transition-all', currentEdge.style === 'dotted' ? 'border-sky-500 bg-sky-50/50 text-sky-600' : 'border-transparent hover:bg-gray-100 text-gray-600']"
          title="Nét chấm tròn"
        >
          <svg class="w-7 h-2" viewBox="0 0 28 8">
            <line x1="0" y1="4" x2="28" y2="4" stroke="currentColor" stroke-width="3" stroke-dasharray="1.5,4" stroke-linecap="round" />
          </svg>
        </button>

        <button 
          @click="setStyle('long-dash')" 
          :class="['p-1.5 rounded-lg border transition-all', currentEdge.style === 'long-dash' ? 'border-sky-500 bg-sky-50/50 text-sky-600' : 'border-transparent hover:bg-gray-100 text-gray-600']"
          title="Nét gạch dài"
        >
          <svg class="w-7 h-2" viewBox="0 0 28 8">
            <line x1="0" y1="4" x2="28" y2="4" stroke="currentColor" stroke-width="3" stroke-dasharray="10,4" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <div class="border-t border-gray-100"></div>

      <!-- 4. Line Thickness -->
      <div class="flex items-center justify-between px-1">
        <span class="text-gray-500 font-medium">Độ dày:</span>
        <div class="flex items-center space-x-1.5">
          <button 
            v-for="w in [1, 2, 3, 4]" 
            :key="w"
            @click="setThickness(w)"
            :class="[
              'w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] transition-all',
              (currentEdge.strokeWidth || 2) === w 
                ? 'bg-sky-500 text-white shadow-xs' 
                : 'hover:bg-gray-100 text-gray-600'
            ]"
          >
            {{ w }}
          </button>
        </div>
      </div>

      <div class="border-t border-gray-100"></div>

      <!-- 5. Arrow Direction -->
      <div class="flex items-center justify-around px-2">
        <button 
          @click="setArrow('source')" 
          :class="['px-3 py-1 rounded-lg border text-sm font-bold transition-all', currentEdge.arrow === 'source' ? 'border-sky-500 bg-sky-50 text-sky-600' : 'border-gray-200 hover:bg-gray-50 text-gray-600']"
          title="Mũi tên sang trái"
        >
          ←
        </button>

        <button 
          @click="setArrow('none')" 
          :class="['px-3 py-1 rounded-lg border text-sm font-bold transition-all', currentEdge.arrow === 'none' ? 'border-sky-500 bg-sky-50 text-sky-600' : 'border-gray-200 hover:bg-gray-50 text-gray-600']"
          title="Không có mũi tên"
        >
          —
        </button>

        <button 
          @click="setArrow('target')" 
          :class="['px-3 py-1 rounded-lg border text-sm font-bold transition-all', (!currentEdge.arrow || currentEdge.arrow === 'target') ? 'border-sky-500 bg-sky-50 text-sky-600' : 'border-gray-200 hover:bg-gray-50 text-gray-600']"
          title="Mũi tên sang phải"
        >
          →
        </button>

        <button 
          @click="setArrow('both')" 
          :class="['px-3 py-1 rounded-lg border text-sm font-bold transition-all', currentEdge.arrow === 'both' ? 'border-sky-500 bg-sky-50 text-sky-600' : 'border-gray-200 hover:bg-gray-50 text-gray-600']"
          title="Mũi tên hai chiều"
        >
          ↔
        </button>
      </div>

      <div class="border-t border-gray-100"></div>

      <!-- 6. Actions -->
      <div class="flex items-center justify-between pt-1">
        <button 
          @click="resetRelation" 
          class="text-gray-400 hover:text-gray-700 text-xs font-medium hover:underline"
        >
          Reset Relation
        </button>

        <button 
          @click="removeRelation" 
          class="text-rose-500 hover:text-rose-700 text-xs font-semibold hover:underline"
        >
          Xóa đường kết nối
        </button>
      </div>
    </div>

    <!-- TAB 2: TEXT LABEL (EXACT MINDOMO "ADD LABEL" UI) -->
    <div v-else-if="relationCustomizerState.activeTab === 'text'" class="p-6 flex flex-col items-center justify-center min-h-[220px]">
      <!-- Case 1: No label yet -> Show centered blue "Add Label" link like screenshot -->
      <div v-if="!currentEdge.label" class="flex flex-col items-center justify-center space-y-3 py-6">
        <button 
          @click="enableLabel"
          class="text-sky-600 hover:text-sky-700 text-sm font-semibold underline underline-offset-4 hover:opacity-80 transition-all cursor-pointer"
        >
          Add Label
        </button>
        <p class="text-[11px] text-gray-400 text-center max-w-[180px]">
          Nhấp để thêm nhãn ghi chú trực tiếp lên đường liên kết
        </p>
      </div>

      <!-- Case 2: Label already exists -> Editable input with formatting -->
      <div v-else class="w-full space-y-4">
        <div class="space-y-1.5">
          <label class="block text-gray-500 font-medium text-xs">Nội dung nhãn:</label>
          <input 
            ref="labelInputRef"
            type="text" 
            :value="currentEdge.label"
            @input="setLabel($event.target.value)"
            placeholder="Nhập tên nhãn..."
            class="w-full px-3 py-2 border border-sky-400 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-sky-200 bg-sky-50/20"
            autoFocus
          />
        </div>

        <!-- Preset quick labels -->
        <div class="flex flex-wrap gap-1.5">
          <button @click="setLabel('discuss')" class="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg text-[11px] font-bold border border-rose-200 hover:bg-rose-100">discuss</button>
          <button @click="setLabel('liên kết')" class="px-2.5 py-1 bg-sky-50 text-sky-600 rounded-lg text-[11px] font-bold border border-sky-200 hover:bg-sky-100">liên kết</button>
          <button @click="setLabel('phụ thuộc')" class="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[11px] font-bold border border-amber-200 hover:bg-amber-100">phụ thuộc</button>
          <button @click="setLabel('báo cáo')" class="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-[11px] font-bold border border-purple-200 hover:bg-purple-100">báo cáo</button>
        </div>

        <div class="border-t border-gray-100 pt-2 flex justify-between items-center">
          <button 
            @click="setLabel('')" 
            class="text-rose-500 hover:text-rose-700 text-xs font-semibold hover:underline"
          >
            Xóa nhãn
          </button>
          <button 
            @click="closeRelationCustomizer" 
            class="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
          >
            Xong
          </button>
        </div>
      </div>
    </div>

    <!-- TAB 3: FORMAT (F) -->
    <div v-else-if="relationCustomizerState.activeTab === 'format'" class="p-5 space-y-4">
      <div class="text-xs font-semibold text-gray-700">Tùy chọn nâng cao:</div>
      <div class="space-y-2">
        <button 
          @click="flipDirection"
          class="w-full py-2 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-between text-xs font-medium"
        >
          <span>Đảo ngược hướng liên kết</span>
          <span class="text-gray-400 font-bold">⇄</span>
        </button>

        <button 
          @click="resetRelation"
          class="w-full py-2 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-between text-xs font-medium"
        >
          <span>Đặt lại đường cong mặc định</span>
          <span class="text-gray-400">↺</span>
        </button>
      </div>
    </div>

    <!-- Close button -->
    <button 
      @click="closeRelationCustomizer" 
      class="absolute top-2.5 right-2.5 text-gray-400 hover:text-gray-700 text-xs font-bold p-1 rounded-md hover:bg-gray-100"
      title="Đóng"
    >
      ✕
    </button>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { 
  store, relationCustomizerState, updateEdgeProps, 
  deleteEdge, resetEdge, closeRelationCustomizer 
} from '../store/mindmapStore.js'

const labelInputRef = ref(null)

const currentEdge = computed(() => {
  return store.graph.edges.find(e => e.id === relationCustomizerState.edgeId)
})

const colorPaletteRow1 = [
  '#c084fc', '#f472b6', '#fb923c', '#fde047', '#a3e635', '#a5b4fc', '#38bdf8'
]
const colorPaletteRow2 = [
  '#991b1b', '#db2777', '#ea580c', '#ca8a04', '#65a30d', '#16a34a', '#0284c7'
]
const colorPaletteRow3 = [
  '#e11d48', '#c026d3', '#7e22ce', '#c2410c', '#94a3b8', '#10b981', '#78350f'
]

function setColor(c) {
  if (currentEdge.value) {
    updateEdgeProps(currentEdge.value.id, { color: c })
  }
}

function setShape(s) {
  if (currentEdge.value) {
    updateEdgeProps(currentEdge.value.id, { shape: s })
  }
}

function setStyle(st) {
  if (currentEdge.value) {
    updateEdgeProps(currentEdge.value.id, { style: st })
  }
}

function setThickness(w) {
  if (currentEdge.value) {
    updateEdgeProps(currentEdge.value.id, { strokeWidth: w })
  }
}

function setArrow(arr) {
  if (currentEdge.value) {
    updateEdgeProps(currentEdge.value.id, { arrow: arr })
  }
}

function enableLabel() {
  if (currentEdge.value) {
    updateEdgeProps(currentEdge.value.id, { label: 'Label' })
    nextTick(() => {
      labelInputRef.value?.focus()
      labelInputRef.value?.select()
    })
  }
}

function setLabel(lbl) {
  if (currentEdge.value) {
    updateEdgeProps(currentEdge.value.id, { label: lbl })
  }
}

function flipDirection() {
  if (currentEdge.value) {
    const prevSource = currentEdge.value.source
    const prevTarget = currentEdge.value.target
    updateEdgeProps(currentEdge.value.id, {
      source: prevTarget,
      target: prevSource
    })
  }
}

function resetRelation() {
  if (currentEdge.value) {
    resetEdge(currentEdge.value.id)
  }
}

function removeRelation() {
  if (currentEdge.value) {
    deleteEdge(currentEdge.value.id)
  }
}
</script>
