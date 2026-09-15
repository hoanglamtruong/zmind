<template>
  <header class="bg-white border-b border-gray-200 px-4 py-1.5 flex items-center justify-between select-none shadow-xs text-slate-700 relative z-50">
    <!-- Left Section: Back, Title, Menu, Undo/Redo, Theme -->
    <div class="flex items-center space-x-3">
      <!-- Back Button -> Opens Project Dashboard -->
      <button 
        @click="openDashboard"
        class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-sky-600 transition-colors flex items-center gap-1" 
        title="Về Dashboard quản lý dự án"
      >
        <ArrowLeft class="w-4 h-4" />
      </button>

      <!-- Map Title & Dropdown -->
      <div class="relative">
        <div 
          @click="showMapDropdown = !showMapDropdown"
          class="flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
        >
          <span class="font-semibold text-slate-800 text-sm tracking-tight">{{ store.graph.title }}</span>
          <ChevronDown class="w-3.5 h-3.5 text-gray-500" />
        </div>

        <!-- Dropdown switch maps / Dashboard / create new -->
        <div 
          v-if="showMapDropdown"
          class="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl py-2 z-50 text-xs font-medium animate-in fade-in zoom-in-95"
        >
          <div class="px-3 py-1 text-gray-400 font-semibold uppercase text-[10px] tracking-wider flex justify-between items-center">
            <span>Dự án của bạn (REST API)</span>
            <span class="text-sky-600 cursor-pointer hover:underline" @click="openDashboard; showMapDropdown = false">Dashboard</span>
          </div>

          <!-- Maps list with click to switch -->
          <div class="max-h-48 overflow-y-auto divide-y divide-gray-50 my-1">
            <div 
              v-for="m in store.mapList" 
              :key="m.id"
              @click="switchMap(m.id)"
              :class="[
                'px-3 py-2 hover:bg-sky-50/60 flex items-center justify-between cursor-pointer transition-colors',
                m.id === store.currentMapId ? 'bg-sky-50 text-sky-700 font-bold' : 'text-gray-700'
              ]"
            >
              <div class="truncate max-w-[150px] flex items-center gap-1.5">
                <span class="text-xs">🗺️</span>
                <span class="truncate">{{ m.title }}</span>
              </div>
              <span class="text-[10px] text-gray-400 font-mono">{{ m.nodeCount }} nodes</span>
            </div>
          </div>

          <!-- Action buttons inside dropdown -->
          <div class="p-2 border-t border-gray-100 space-y-1.5">
            <button 
              @click="openDashboard(); showMapDropdown = false"
              class="w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <FolderKanban class="w-3.5 h-3.5 text-sky-600" /> Quản Lý Trong Dashboard
            </button>

            <button 
              @click="createNewMap"
              class="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus class="w-3.5 h-3.5" /> Tạo Bản Đồ Mới
            </button>
          </div>
        </div>
      </div>

      <!-- Hamburger Menu (File Actions) -->
      <div class="relative">
        <button 
          @click="showMenu = !showMenu"
          class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          title="Menu"
        >
          <Menu class="w-4 h-4" />
        </button>

        <!-- Mindomo Menu Dropdown with Full Actions -->
        <div 
          v-if="showMenu"
          class="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl py-2 z-50 text-xs font-medium animate-in fade-in"
        >
          <div class="px-3 py-1 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">Thao tác & Dữ liệu</div>
          
          <button @click="openDashboard(); showMenu = false" class="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 font-semibold text-slate-800">
            <FolderKanban class="w-3.5 h-3.5 text-sky-600" /> Dashboard Quản Lý Dự Án
          </button>

          <button @click="openJsonEditorForMap(store.currentMapId); showMenu = false" class="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-indigo-600 font-semibold">
            <Code2 class="w-3.5 h-3.5" /> Sửa dự án bằng mã JSON
          </button>

          <button @click="saveManual" class="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center justify-between">
            <span class="flex items-center gap-2"><Save class="w-3.5 h-3.5 text-sky-600" /> Lưu lên API</span>
            <kbd class="text-[10px] text-gray-400 bg-gray-100 px-1 rounded">Ctrl+S</kbd>
          </button>

          <button @click="duplicateMap" class="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2">
            <Copy class="w-3.5 h-3.5 text-purple-600" /> Nhân bản sơ đồ (Make copy)
          </button>

          <button @click="triggerExport" class="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2">
            <Download class="w-3.5 h-3.5 text-emerald-600" /> Sao lưu ra file (.JSON)
          </button>

          <button @click="triggerImport" class="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2">
            <Upload class="w-3.5 h-3.5 text-amber-600" /> Phục hồi từ file (.JSON)
          </button>

          <div class="my-1 border-t border-gray-100"></div>

          <button @click="store.activeTab = 'outline'; showMenu = false" class="w-full text-left px-3 py-1.5 hover:bg-gray-50">View as Outline</button>
          <button @click="store.activeTab = 'gantt'; showMenu = false" class="w-full text-left px-3 py-1.5 hover:bg-gray-50">View as Gantt</button>

          <div class="my-1 border-t border-gray-100"></div>

          <button @click="resetToDefault" class="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 flex items-center gap-2">
            <RotateCcw class="w-3.5 h-3.5" /> Khôi phục mẫu mặc định
          </button>
        </div>
      </div>

      <!-- Action Group: Undo, Redo, Quick Save, JSON Editor, Color Theme -->
      <div class="flex items-center space-x-1 pl-2 border-l border-gray-200">
        <button @click="undo" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors" title="Undo (Hoàn tác)">
          <Undo2 class="w-4 h-4" />
        </button>
        <button @click="redo" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors" title="Redo (Làm lại)">
          <Redo2 class="w-4 h-4" />
        </button>
        <button @click="saveManual" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors ml-1" title="Lưu nhanh">
          <Save class="w-4 h-4 text-slate-700" />
        </button>

        <!-- Quick JSON Code Editor Button on Navbar -->
        <button 
          @click="openJsonEditorForMap(store.currentMapId)"
          class="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-mono font-bold transition-colors ml-1 flex items-center gap-1" 
          title="Xem & Sửa mã JSON trực tiếp"
        >
          <Code2 class="w-3.5 h-3.5 text-indigo-600" />
          <span>JSON</span>
        </button>

        <!-- Color Wheel Theme Palette Popover -->
        <div class="relative">
          <button 
            @click="showPalette = !showPalette"
            class="p-1.5 rounded-lg hover:bg-gray-100 transition-colors ml-1" 
            title="Đổi màu Node đang chọn"
          >
            <div class="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-sky-500 border border-white shadow-xs"></div>
          </button>

          <!-- Palette colors dropdown -->
          <div 
            v-if="showPalette"
            class="absolute left-0 top-full mt-2 p-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 flex items-center space-x-1.5"
          >
            <button 
              v-for="c in colorOptions" 
              :key="c.name"
              @click="applyColor(c)"
              class="w-6 h-6 rounded-full border-2 border-white shadow-xs hover:scale-115 transition-transform"
              :style="{ backgroundColor: c.border }"
              :title="c.name"
            ></button>
          </div>
        </div>
      </div>

      <!-- Tab Switchers (Mind Map / Outline / Gantt) -->
      <div class="flex items-center space-x-2 pl-4 border-l border-gray-200">
        <button
          @click="store.activeTab = 'mindmap'"
          :class="[
            'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
            store.activeTab === 'mindmap' ? 'bg-slate-100 text-slate-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'
          ]"
        >
          Mind Map
        </button>
        <button
          @click="store.activeTab = 'outline'"
          :class="[
            'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
            store.activeTab === 'outline' ? 'bg-slate-100 text-slate-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'
          ]"
        >
          Outline
        </button>
        <button
          @click="store.activeTab = 'gantt'"
          :class="[
            'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
            store.activeTab === 'gantt' ? 'bg-slate-100 text-slate-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'
          ]"
        >
          Gantt
        </button>
      </div>
    </div>

    <!-- Right Section: Auto-save status & Share & Dashboard Button -->
    <div class="flex items-center space-x-3">
      <!-- Dashboard Button -->
      <button 
        @click="openDashboard"
        class="inline-flex items-center space-x-1 px-3 py-1 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
        title="Mở Dashboard quản lý toàn bộ dự án"
      >
        <FolderKanban class="w-3.5 h-3.5" />
        <span>Dự Án</span>
      </button>

      <!-- API Save Status Badge -->
      <div class="flex items-center space-x-1.5 text-xs text-gray-500 font-mono bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
        <span :class="['w-2 h-2 rounded-full', store.isSaving ? 'bg-amber-400 animate-ping' : 'bg-emerald-500']"></span>
        <span>{{ store.isSaving ? 'Đang lưu...' : (store.lastSaved ? 'API: ' + store.lastSaved : 'API Sẵn sàng') }}</span>
      </div>

      <button 
        @click="copyShare"
        class="inline-flex items-center space-x-1.5 px-4 py-1 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-xs active:scale-95"
      >
        <Share2 class="w-3.5 h-3.5 text-gray-500" />
        <span>Share</span>
      </button>

      <span v-if="copied" class="text-xs text-emerald-600 font-medium animate-fade-in">Copied!</span>
    </div>

    <!-- Hidden file input for import -->
    <input type="file" ref="fileInput" @change="onFileChange" accept=".json,.txt" class="hidden" />
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { 
  store, undo, redo, saveToAPI, exportToJSON, importFromJSON, 
  updateNodeColor, createNewMapOnAPI, fetchMapsList, openMap, 
  openDashboard, openJsonEditorForMap 
} from '../store/mindmapStore.js'
import { 
  ArrowLeft, ChevronDown, Menu, Undo2, Redo2, 
  Share2, Save, Download, Upload, Copy, RotateCcw, Plus, 
  FolderKanban, Code2 
} from 'lucide-vue-next'

const showMenu = ref(false)
const showPalette = ref(false)
const showMapDropdown = ref(false)
const copied = ref(false)
const fileInput = ref(null)

const colorOptions = [
  { name: 'Đỏ', border: '#ef4444', color: '#f87171' },
  { name: 'Xanh ngọc', border: '#10b981', color: '#34d399' },
  { name: 'Cam', border: '#f59e0b', color: '#fbbf24' },
  { name: 'Hồng', border: '#ec4899', color: '#f472b6' },
  { name: 'Xanh lam', border: '#0284c7', color: '#38bdf8' },
  { name: 'Tím', border: '#9333ea', color: '#c084fc' },
  { name: 'Nâu', border: '#78350f', color: '#a16207' }
]

onMounted(() => {
  fetchMapsList()
  saveToAPI()
})

function switchMap(id) {
  openMap(id)
  showMapDropdown.value = false
}

function applyColor(c) {
  if (store.graph.selectedNodeId) {
    updateNodeColor(store.graph.selectedNodeId, c.border, c.color)
  }
  showPalette.value = false
}

function saveManual() {
  saveToAPI()
  showMenu.value = false
}

function duplicateMap() {
  fetch(`/api/maps/${store.currentMapId}/duplicate`, { method: 'POST' })
    .then(res => res.json())
    .then(res => {
      if (res.success) {
        store.currentMapId = res.data.id
        store.graph = res.data
        fetchMapsList()
      }
    })
  showMenu.value = false
}

function triggerExport() {
  exportToJSON()
  showMenu.value = false
}

function triggerImport() {
  fileInput.value?.click()
  showMenu.value = false
}

function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (event) => {
    const res = importFromJSON(event.target.result)
    if (!res.success) {
      alert('Lỗi import file: ' + res.message)
    }
  }
  reader.readAsText(file)
}

function createNewMap() {
  const title = prompt('Nhập tên sơ đồ mới:', 'Dự án mới')
  if (title) {
    createNewMapOnAPI(title)
  }
  showMapDropdown.value = false
}

function resetToDefault() {
  if (confirm('Bạn có chắc muốn khôi phục về sơ đồ mẫu Assitand không?')) {
    window.location.reload()
  }
}

function copyShare() {
  navigator.clipboard?.writeText(window.location.href)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}
</script>
