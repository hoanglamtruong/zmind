<template>
  <div>
    <!-- 1. FULL PROJECT DASHBOARD MODAL -->
    <div 
      v-if="dashboardState.isOpen"
      class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
      @click.self="closeDashboard"
    >
      <div class="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <!-- Dashboard Header -->
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <FolderKanban class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-900">Dashboard Quản Lý Dự Án</h2>
              <p class="text-xs text-gray-500">Xem, sửa, xóa, nhân bản, sao lưu và can thiệp mã JSON</p>
            </div>
          </div>

          <!-- Top Quick Actions -->
          <div class="flex items-center space-x-2">
            <button 
              @click="openJsonEditorForNew"
              class="px-3 py-1.5 rounded-xl border border-sky-300 text-sky-700 bg-sky-50/60 hover:bg-sky-100/80 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Code2 class="w-3.5 h-3.5" /> Tạo bằng mã JSON
            </button>

            <button 
              @click="createNewMapPrompt"
              class="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Plus class="w-3.5 h-3.5" /> Tạo Bản Đồ Mới
            </button>

            <button 
              @click="closeDashboard"
              class="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors ml-2"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Filter & Stats Bar -->
        <div class="px-6 py-3 border-b border-gray-100 bg-white flex items-center justify-between gap-4">
          <div class="relative flex-1 max-w-md">
            <Search class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              v-model="dashboardState.searchQuery"
              type="text" 
              placeholder="Tìm kiếm dự án theo tên..."
              class="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-sky-500 focus:bg-white transition-colors"
            />
          </div>

          <div class="flex items-center space-x-2 text-xs text-gray-500">
            <button 
              @click="downloadFullBackup"
              class="px-2.5 py-1 text-xs font-medium text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-1 transition-colors"
              title="Sao lưu tất cả dự án ra file JSON"
            >
              <Download class="w-3.5 h-3.5 text-emerald-600" /> Tải Full Backup
            </button>

            <button 
              @click="triggerRestoreFile"
              class="px-2.5 py-1 text-xs font-medium text-gray-700 hover:text-amber-700 hover:bg-amber-50 rounded-lg flex items-center gap-1 transition-colors"
              title="Khôi phục toàn bộ từ file backup JSON"
            >
              <Upload class="w-3.5 h-3.5 text-amber-600" /> Khôi phục Backup
            </button>
          </div>
        </div>

        <!-- Project Cards Grid -->
        <div class="p-6 overflow-y-auto flex-1 bg-[#fafbfc]">
          <div v-if="filteredMaps.length === 0" class="text-center py-16 text-gray-400">
            <FolderOpen class="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p class="text-sm font-medium">Không tìm thấy dự án nào phù hợp</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div 
              v-for="map in filteredMaps" 
              :key="map.id"
              :class="[
                'bg-white rounded-2xl border p-4 transition-all duration-150 flex flex-col justify-between group shadow-2xs hover:shadow-md',
                map.id === store.currentMapId ? 'border-sky-400 ring-2 ring-sky-100' : 'border-gray-200 hover:border-gray-300'
              ]"
            >
              <!-- Card Header -->
              <div>
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div class="flex items-center space-x-2">
                    <span class="text-xl">🗺️</span>
                    <h3 class="font-bold text-slate-800 text-sm truncate max-w-[170px]" :title="map.title">
                      {{ map.title }}
                    </h3>
                  </div>
                  <span 
                    v-if="map.id === store.currentMapId" 
                    class="bg-sky-100 text-sky-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0"
                  >
                    Đang mở
                  </span>
                </div>

                <!-- Stats & Time -->
                <div class="flex items-center space-x-3 text-xs text-gray-500 mb-4">
                  <span class="font-medium text-slate-700">{{ map.nodeCount }} nodes</span>
                  <span>•</span>
                  <span>{{ map.edgeCount || 0 }} liên kết</span>
                  <span>•</span>
                  <span class="text-[11px] text-gray-400 truncate">{{ formatDate(map.updatedAt) }}</span>
                </div>
              </div>

              <!-- Card Action Buttons (Xem - Sửa - Xóa - Nhân bản - Sao lưu - Sửa JSON) -->
              <div class="border-t border-gray-100 pt-3 flex items-center justify-between text-xs">
                <!-- Left: Open -->
                <button 
                  @click="openMap(map.id)"
                  class="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                >
                  <ExternalLink class="w-3 h-3" /> Mở
                </button>

                <!-- Right Action Icons -->
                <div class="flex items-center space-x-1">
                  <!-- Sửa mã JSON -->
                  <button 
                    @click="openJsonEditorForMap(map.id)"
                    class="p-1.5 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                    title="Chỉnh sửa mã JSON"
                  >
                    <Code2 class="w-3.5 h-3.5" />
                  </button>

                  <!-- Đổi tên -->
                  <button 
                    @click="renameMapFromDashboard(map.id, map.title)"
                    class="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Đổi tên dự án"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </button>

                  <!-- Nhân bản -->
                  <button 
                    @click="duplicateMapFromDashboard(map.id)"
                    class="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Nhân bản dự án"
                  >
                    <Copy class="w-3.5 h-3.5" />
                  </button>

                  <!-- Sao lưu / Tải JSON -->
                  <button 
                    @click="exportSingleMapJSON(map.id)"
                    class="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Tải file .JSON"
                  >
                    <Download class="w-3.5 h-3.5" />
                  </button>

                  <!-- Xóa -->
                  <button 
                    @click="deleteMapFromDashboard(map.id)"
                    class="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Xóa dự án"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Dashboard Footer -->
        <div class="px-6 py-2.5 border-t border-gray-100 bg-white flex items-center justify-between text-xs text-gray-500">
          <span>Tổng số: <strong>{{ store.mapList.length }}</strong> dự án trên hệ thống REST API</span>
          <span class="text-emerald-600 font-medium">● REST API Server: http://localhost:3001/api/maps</span>
        </div>
      </div>
    </div>

    <!-- 2. JSON CODE EDITOR MODAL -->
    <div 
      v-if="dashboardState.showJsonModal"
      class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
      @click.self="dashboardState.showJsonModal = false"
    >
      <div class="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <!-- Editor Header -->
        <div class="px-6 py-3.5 border-b border-gray-200 flex items-center justify-between bg-slate-900 text-white">
          <div class="flex items-center space-x-2">
            <Code2 class="w-4 h-4 text-sky-400" />
            <h3 class="text-sm font-bold tracking-wide">
              {{ dashboardState.jsonModalMode === 'create' ? 'Tạo Dự Án Mới Bằng Mã JSON' : 'Chỉnh Sửa Mã JSON Dự Án' }}
            </h3>
          </div>

          <!-- Format & Copy Actions -->
          <div class="flex items-center space-x-2">
            <button 
              @click="formatJson"
              class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              Format JSON
            </button>
            <button 
              @click="copyJson"
              class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              {{ copied ? 'Đã chép!' : 'Sao chép' }}
            </button>
            <button 
              @click="dashboardState.showJsonModal = false"
              class="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Error Message Banner -->
        <div v-if="dashboardState.jsonError" class="px-6 py-2 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <span>⚠️</span>
          <span>{{ dashboardState.jsonError }}</span>
        </div>

        <!-- Code Editor Area -->
        <div class="flex-1 p-4 bg-[#1e293b] overflow-hidden flex flex-col">
          <textarea
            v-model="dashboardState.jsonContent"
            class="flex-1 w-full bg-transparent text-emerald-400 font-mono text-xs p-3 outline-none resize-none leading-relaxed select-text"
            placeholder="Dán hoặc nhập mã JSON cấu trúc sơ đồ..."
            spellcheck="false"
          ></textarea>
        </div>

        <!-- Editor Footer -->
        <div class="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <span class="text-[11px] text-gray-400">Hỗ trợ đầy đủ các trường: title, nodes [id, label, color, border, x, y], edges [source, target, color, style, label]</span>
          <div class="flex items-center space-x-2">
            <button 
              @click="dashboardState.showJsonModal = false"
              class="px-4 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold"
            >
              Hủy
            </button>
            <button 
              @click="saveJson"
              class="px-5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save class="w-3.5 h-3.5" /> Lưu & Áp Dụng Ngay
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden file input for restore -->
    <input type="file" ref="restoreFileInput" @change="onRestoreFilePicked" accept=".json" class="hidden" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { 
  store, dashboardState, closeDashboard, openMap, 
  deleteMapFromDashboard, duplicateMapFromDashboard, 
  renameMapFromDashboard, exportSingleMapJSON, 
  openJsonEditorForMap, openJsonEditorForNew, applyJsonEditor, 
  createNewMapOnAPI, fetchMapsList 
} from '../store/mindmapStore.js'
import { 
  FolderKanban, Plus, Code2, X, Search, Download, Upload, 
  FolderOpen, ExternalLink, Pencil, Copy, Trash2, Save 
} from 'lucide-vue-next'

const copied = ref(false)
const restoreFileInput = ref(null)

const filteredMaps = computed(() => {
  const q = dashboardState.searchQuery.trim().toLowerCase()
  if (!q) return store.mapList
  return store.mapList.filter(m => m.title.toLowerCase().includes(q))
})

function formatDate(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function createNewMapPrompt() {
  const title = prompt('Nhập tên sơ đồ mới:', 'Dự án mới')
  if (title) {
    createNewMapOnAPI(title)
  }
}

function downloadFullBackup() {
  window.open('/api/backup', '_blank')
}

function triggerRestoreFile() {
  restoreFileInput.value?.click()
}

function onRestoreFilePicked(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = async (evt) => {
    try {
      const parsed = JSON.parse(evt.target.result)
      const res = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      })
      const json = await res.json()
      if (json.success) {
        alert('Khôi phục cơ sở dữ liệu thành công!')
        fetchMapsList()
      }
    } catch (err) {
      alert('Lỗi khôi phục: ' + err.message)
    }
  }
  reader.readAsText(file)
}

function formatJson() {
  try {
    const parsed = JSON.parse(dashboardState.jsonContent)
    dashboardState.jsonContent = JSON.stringify(parsed, null, 2)
    dashboardState.jsonError = ''
  } catch (err) {
    dashboardState.jsonError = 'Không thể format: JSON không đúng cú pháp!'
  }
}

function copyJson() {
  navigator.clipboard?.writeText(dashboardState.jsonContent)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

async function saveJson() {
  const ok = await applyJsonEditor()
  if (ok) {
    closeDashboard()
  }
}
</script>
