<template>
  <div 
    v-if="relationCustomizerState.isOpen && currentEdge"
    class="fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-200/90 w-80 select-none text-slate-800 text-xs overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    :style="{
      left: `${relationCustomizerState.posX}px`,
      top: `${relationCustomizerState.posY}px`
    }"
    @mousedown.stop
  >
    <!-- Draggable Header Handle Bar -->
    <div 
      class="w-full py-1 bg-gray-100 hover:bg-gray-200/80 border-b border-gray-200 flex items-center justify-center cursor-move transition-colors group"
      @mousedown="startDragModal"
      title="Giữ chuột và kéo để di chuyển bảng tùy chỉnh"
    >
      <div class="w-8 h-1 rounded-full bg-gray-300 group-hover:bg-gray-400 transition-colors"></div>
    </div>

    <!-- Header: 3 Tabs (Kiểu nét, Nhãn & Link, Nâng cao) -->
    <div class="grid grid-cols-3 border-b border-gray-200 bg-gray-50/50">
      <!-- Tab 1: Line Style -->
      <button 
        @click="relationCustomizerState.activeTab = 'line'"
        :class="[
          'py-2.5 flex items-center justify-center gap-1.5 transition-colors border-r border-gray-200 font-medium text-xs cursor-pointer',
          relationCustomizerState.activeTab === 'line' 
            ? 'bg-white text-sky-600 font-bold border-b-2 border-b-sky-500 shadow-xs' 
            : 'text-gray-500 hover:text-gray-800'
        ]"
        title="Đường nét & Màu sắc"
      >
        <Paintbrush class="w-3.5 h-3.5" />
        <span>Kiểu nét</span>
      </button>

      <!-- Tab 2: Label & Link -->
      <button 
        @click="relationCustomizerState.activeTab = 'text'"
        :class="[
          'py-2.5 flex items-center justify-center gap-1.5 transition-colors border-r border-gray-200 font-medium text-xs cursor-pointer',
          relationCustomizerState.activeTab === 'text' 
            ? 'bg-white text-sky-600 font-bold border-b-2 border-b-sky-500 shadow-xs' 
            : 'text-gray-500 hover:text-gray-800'
        ]"
        title="Nhãn & Liên kết Web"
      >
        <Tag class="w-3.5 h-3.5" />
        <span>Nhãn & Link</span>
      </button>

      <!-- Tab 3: Format -->
      <button 
        @click="relationCustomizerState.activeTab = 'format'"
        :class="[
          'py-2.5 flex items-center justify-center gap-1.5 transition-colors font-medium text-xs cursor-pointer',
          relationCustomizerState.activeTab === 'format' 
            ? 'bg-white text-sky-600 font-bold border-b-2 border-b-sky-500 shadow-xs' 
            : 'text-gray-500 hover:text-gray-800'
        ]"
        title="Tùy chọn khác"
      >
        <Sliders class="w-3.5 h-3.5" />
        <span>Nâng cao</span>
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

    <!-- TAB 2: TEXT LABEL & WEB LINK -->
    <div v-else-if="relationCustomizerState.activeTab === 'text'" class="p-4 space-y-3.5 select-text">
      <!-- Section A: Label -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <label class="font-bold text-gray-700 text-xs flex items-center gap-1.5">
            <Tag class="w-3.5 h-3.5 text-sky-600" />
            <span>Tên nhãn (Label)</span>
          </label>
          <button 
            v-if="currentEdge.label"
            type="button" 
            @click="setLabel('')" 
            class="text-[11px] text-rose-500 hover:text-rose-700 hover:underline font-medium cursor-pointer"
          >
            Xóa nhãn
          </button>
        </div>
        <input 
          ref="labelInputRef"
          type="text" 
          :value="currentEdge.label || ''"
          @input="setLabel($event.target.value)"
          placeholder="Nhập nhãn hiển thị trên đường nối..."
          class="w-full px-3 py-1.5 border border-gray-200 focus:border-sky-500 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-sky-100 bg-white"
          autoFocus
        />

        <!-- Preset quick labels -->
        <div class="flex flex-wrap gap-1 pt-0.5">
          <button 
            type="button"
            v-for="preset in ['discuss', 'liên kết', 'phụ thuộc', 'báo cáo', 'đối tác', 'quy trình']"
            :key="preset"
            @click="setLabel(preset)" 
            class="px-2 py-0.5 bg-gray-100 hover:bg-sky-100 hover:text-sky-700 text-gray-600 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
          >
            {{ preset }}
          </button>
        </div>
      </div>

      <div class="border-t border-gray-100"></div>

      <!-- Section B: Web Link (URL) -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <label class="font-bold text-gray-700 text-xs flex items-center gap-1.5">
            <LinkIcon class="w-3.5 h-3.5 text-emerald-600" />
            <span>Liên kết Web (Link / URL)</span>
          </label>
          <button 
            v-if="currentEdge.link"
            type="button" 
            @click="setLink('')" 
            class="text-[11px] text-rose-500 hover:text-rose-700 hover:underline font-medium cursor-pointer"
          >
            Xóa link
          </button>
        </div>
        <input 
          type="text" 
          :value="currentEdge.link || ''"
          @input="setLink($event.target.value)"
          placeholder="https://facebook.com hoặc link trang web..."
          class="w-full px-3 py-1.5 border border-gray-200 focus:border-emerald-500 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-100 bg-white"
        />

        <!-- Link Preview & Test Open -->
        <div v-if="currentEdge.link" class="flex items-center justify-between bg-emerald-50/80 border border-emerald-200/80 px-2.5 py-1.5 rounded-xl text-xs mt-1">
          <div class="flex items-center gap-1.5 text-emerald-800 text-[11px] font-medium truncate max-w-[190px]">
            <ExternalLink class="w-3 h-3 text-emerald-600 shrink-0" />
            <span class="truncate">{{ currentEdge.link }}</span>
          </div>
          <a 
            :href="formatLinkUrl(currentEdge.link)" 
            target="_blank" 
            rel="noopener noreferrer"
            class="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline shrink-0 ml-1.5"
          >
            Mở thử ↗
          </a>
        </div>
      </div>

      <div class="border-t border-gray-100 pt-1 flex justify-between items-center">
        <button 
          v-if="currentEdge.label || currentEdge.link"
          type="button"
          @click="clearAll" 
          class="text-rose-500 hover:text-rose-700 text-xs font-semibold hover:underline cursor-pointer"
        >
          Xóa cả nhãn & link
        </button>
        <span v-else class="text-[11px] text-gray-400 italic">Nhập nhãn hoặc link ở trên</span>

        <button 
          type="button"
          @click="closeRelationCustomizer" 
          class="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
        >
          Hoàn tất
        </button>
      </div>
    </div>

    <!-- TAB 3: FORMAT (F) -->
    <div v-else-if="relationCustomizerState.activeTab === 'format'" class="p-4 space-y-3.5">
      <div class="text-xs font-semibold text-gray-700">Tùy chọn nâng cao:</div>
      <div class="space-y-2">
        <!-- Toggle Curve Control Handles -->
        <div class="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
          <div class="flex flex-col">
            <span class="text-xs font-semibold text-gray-700">Thanh uốn cong đường nối</span>
            <span class="text-[10px] text-gray-400">Hiện 2 điểm tròn xanh để kéo uốn cong</span>
          </div>
          <button 
            type="button"
            @click="relationCustomizerState.showCurveHandles = !relationCustomizerState.showCurveHandles"
            :class="[
              'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
              relationCustomizerState.showCurveHandles ? 'bg-sky-500' : 'bg-gray-300'
            ]"
            title="Bật/Tắt hiển thị thanh điều khiển uốn cong trên canvas"
          >
            <span 
              :class="[
                'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                relationCustomizerState.showCurveHandles ? 'translate-x-4' : 'translate-x-0'
              ]"
            />
          </button>
        </div>

        <!-- Reset Curve to Default Button -->
        <button 
          @click="resetCurve"
          class="w-full py-2.5 px-3 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl flex items-center justify-between text-xs font-semibold cursor-pointer transition-colors"
          title="Xóa điểm uốn tùy chỉnh, đưa đường nối về độ cong mượt mặc định"
        >
          <div class="flex items-center gap-2">
            <RotateCcw class="w-3.5 h-3.5 text-sky-600" />
            <span>Đặt lại đường cong mặc định</span>
          </div>
          <span class="text-[10px] bg-white text-sky-600 border border-sky-200 px-1.5 py-0.5 rounded font-mono font-bold">↺ Reset</span>
        </button>

        <button 
          @click="flipDirection"
          class="w-full py-2 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-between text-xs font-medium cursor-pointer transition-colors"
        >
          <span>Đảo ngược hướng liên kết</span>
          <span class="text-gray-400 font-bold">⇄</span>
        </button>
      </div>

      <div class="border-t border-gray-100 pt-2 flex items-center justify-between">
        <button 
          @click="resetRelation" 
          class="text-gray-400 hover:text-gray-700 text-xs font-medium hover:underline cursor-pointer"
        >
          Khôi phục gốc
        </button>

        <button 
          @click="removeRelation" 
          class="text-rose-500 hover:text-rose-700 text-xs font-semibold hover:underline cursor-pointer"
        >
          Xóa đường kết nối
        </button>
      </div>
    </div>

    <!-- Close button -->
    <button 
      @click="closeRelationCustomizer" 
      class="absolute top-2 right-2.5 text-gray-400 hover:text-gray-700 text-xs font-bold p-1 rounded-md hover:bg-gray-100 cursor-pointer"
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
  deleteEdge, resetEdge, resetEdgeCurve, closeRelationCustomizer 
} from '../store/mindmapStore.js'
import { Tag, Link as LinkIcon, ExternalLink, Paintbrush, Sliders, RotateCcw } from 'lucide-vue-next'

const labelInputRef = ref(null)

// Modal Dragging State
const isDraggingModal = ref(false)
const modalDragStart = ref({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 })

function startDragModal(e) {
  isDraggingModal.value = true
  modalDragStart.value = {
    mouseX: e.clientX,
    mouseY: e.clientY,
    posX: relationCustomizerState.posX,
    posY: relationCustomizerState.posY
  }
  window.addEventListener('mousemove', onDragModalMove)
  window.addEventListener('mouseup', onDragModalUp)
}

function onDragModalMove(e) {
  if (!isDraggingModal.value) return
  const dx = e.clientX - modalDragStart.value.mouseX
  const dy = e.clientY - modalDragStart.value.mouseY
  relationCustomizerState.posX = Math.max(10, Math.min(window.innerWidth - 320, modalDragStart.value.posX + dx))
  relationCustomizerState.posY = Math.max(50, Math.min(window.innerHeight - 100, modalDragStart.value.posY + dy))
}

function onDragModalUp() {
  isDraggingModal.value = false
  window.removeEventListener('mousemove', onDragModalMove)
  window.removeEventListener('mouseup', onDragModalUp)
}

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

function setLink(url) {
  if (currentEdge.value) {
    updateEdgeProps(currentEdge.value.id, { link: url })
  }
}

function clearAll() {
  if (currentEdge.value) {
    updateEdgeProps(currentEdge.value.id, { label: '', link: '' })
  }
}

function formatLinkUrl(url) {
  if (!url) return '#'
  if (!/^https?:\/\//i.test(url)) {
    return 'https://' + url
  }
  return url
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

function resetCurve() {
  if (currentEdge.value) {
    resetEdgeCurve(currentEdge.value.id)
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
