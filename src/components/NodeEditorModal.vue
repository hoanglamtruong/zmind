<template>
  <Teleport to="body">
    <div 
      v-if="isOpen" 
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in"
      @click.self="close"
      @keydown.esc="close"
      @mousedown.stop
      @mousemove.stop
      @mouseup.stop
      @pointerdown.stop
      @pointermove.stop
      @pointerup.stop
      @wheel.stop
    >
      <div 
        class="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] select-text"
        @mousedown.stop
        @mousemove.stop
        @mouseup.stop
        @pointerdown.stop
        @pointermove.stop
        @pointerup.stop
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
              <Sliders class="w-4 h-4" />
            </div>
            <div>
              <h3 class="font-bold text-gray-800 text-base">Chỉnh sửa chi tiết Node</h3>
              <p class="text-xs text-gray-500">Tùy biến nội dung, tải ảnh/video từ ổ cứng & thuộc tính</p>
            </div>
          </div>
          <button @click="close" class="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Body / Form Fields -->
        <div class="p-6 overflow-y-auto space-y-4 text-sm">
          <!-- 1. Node Type Selector Tabs -->
          <div>
            <label class="block text-xs font-semibold text-gray-600 uppercase mb-2">Loại Node</label>
            <div class="grid grid-cols-3 gap-2">
              <button 
                type="button"
                v-for="t in typeOptions" 
                :key="t.value"
                @click="localForm.type = t.value"
                :class="[
                  'p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer text-left',
                  localForm.type === t.value 
                    ? 'border-sky-500 bg-sky-50/80 text-sky-700 shadow-xs ring-1 ring-sky-500' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                ]"
              >
                <component :is="t.icon" class="w-4 h-4 shrink-0" />
                <span>{{ t.label }}</span>
              </button>
            </div>
          </div>

          <!-- 2. Title / Label -->
          <div>
            <label class="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Tiêu đề (Label)</label>
            <input 
              v-model="localForm.label" 
              type="text" 
              class="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-gray-800 font-medium"
              placeholder="Nhập tiêu đề node..."
            />
          </div>

          <!-- 3A. TYPE = 'text' (Boxtext / Ghi chú) -->
          <div v-if="localForm.type === 'text'" class="space-y-3 pt-1">
            <label class="block text-xs font-semibold text-gray-600 uppercase">Nội dung văn bản (Boxtext)</label>
            <textarea 
              v-model="localForm.content" 
              rows="4"
              class="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-gray-700 text-xs leading-relaxed font-sans"
              placeholder="Nhập nội dung văn bản chi tiết hoặc danh sách ghi chú..."
            ></textarea>
          </div>

          <!-- 3B. TYPE = 'image' (Box ảnh - Upload hoặc URL) -->
          <div v-if="localForm.type === 'image'" class="space-y-3 pt-1">
            <!-- Hidden file input for image -->
            <input 
              type="file" 
              ref="imageFileInput" 
              accept="image/*" 
              class="hidden" 
              @change="onImageFileSelected" 
            />

            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-semibold text-gray-600 uppercase">Hình ảnh</label>
                <button 
                  type="button" 
                  @click="triggerImageUpload"
                  :disabled="isUploading"
                  class="text-xs font-semibold flex items-center gap-1.5 text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
                >
                  <Loader2 v-if="isUploading" class="w-3.5 h-3.5 animate-spin" />
                  <HardDrive v-else class="w-3.5 h-3.5" />
                  <span>{{ isUploading ? 'Đang tải lên...' : 'Tải ảnh từ ổ cứng' }}</span>
                </button>
              </div>

              <!-- Drag & Drop Dropzone for Image -->
              <div 
                @dragover.prevent
                @drop.prevent="onImageDrop"
                @click="triggerImageUpload"
                class="border-2 border-dashed border-gray-200 hover:border-sky-400 rounded-xl p-3 bg-gray-50/60 hover:bg-sky-50/40 transition-all text-center group cursor-pointer mb-2"
              >
                <div class="flex items-center justify-center gap-2 text-gray-500 group-hover:text-sky-600 text-xs">
                  <Upload class="w-4 h-4" />
                  <span class="font-medium">Kéo thả ảnh hoặc bấm để chọn tệp từ máy tính</span>
                </div>
                <p class="text-[10px] text-gray-400 mt-0.5">Hỗ trợ JPG, PNG, GIF, WebP, SVG (Lưu trực tiếp trên server)</p>
              </div>

              <!-- Direct Link or Google Drive -->
              <div class="mt-2">
                <label class="block text-[11px] font-medium text-gray-500 mb-1">Hoặc dán URL ảnh / link Google Drive:</label>
                <input 
                  v-model="localForm.imageUrl" 
                  type="text" 
                  class="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-xs text-gray-800 font-mono"
                  placeholder="https://... hoặc /uploads/..."
                />
                <p class="text-[11px] text-gray-400 mt-1">💡 Hỗ trợ link ảnh trực tiếp, tệp tải lên hoặc link Google Drive (quyền công khai).</p>
              </div>
            </div>

            <!-- Upload Error Alert -->
            <div v-if="uploadError" class="text-xs text-rose-500 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-100">
              {{ uploadError }}
            </div>

            <!-- Quick Samples -->
            <div>
              <span class="text-[11px] text-gray-400 block mb-1">Ảnh mẫu nhanh:</span>
              <div class="flex gap-2 flex-wrap">
                <button 
                  type="button" 
                  v-for="(img, idx) in sampleImages" 
                  :key="idx"
                  @click="localForm.imageUrl = img.url"
                  class="text-[11px] px-2.5 py-1 bg-gray-100 hover:bg-sky-100 hover:text-sky-700 text-gray-600 rounded-lg transition-colors cursor-pointer"
                >
                  {{ img.name }}
                </button>
              </div>
            </div>

            <!-- Caption -->
            <div>
              <label class="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Chú thích ảnh (Caption)</label>
              <input 
                v-model="localForm.caption" 
                type="text" 
                class="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-xs text-gray-700"
                placeholder="Chú thích dưới ảnh..."
              />
            </div>

            <!-- Image Preview -->
            <div v-if="localForm.imageUrl" class="mt-2 border border-gray-200 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center max-h-48 p-1 relative group">
              <img :src="formatImageUrl(localForm.imageUrl)" alt="Preview" class="max-h-44 object-contain rounded-lg" />
              <button 
                type="button" 
                @click="localForm.imageUrl = ''" 
                class="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-rose-600 text-white rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                title="Xóa ảnh"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- 3C. TYPE = 'video' (Box video - Upload hoặc URL) -->
          <div v-if="localForm.type === 'video'" class="space-y-3 pt-1">
            <!-- Hidden file input for video -->
            <input 
              type="file" 
              ref="videoFileInput" 
              accept="video/*" 
              class="hidden" 
              @change="onVideoFileSelected" 
            />

            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-semibold text-gray-600 uppercase">Video</label>
                <button 
                  type="button" 
                  @click="triggerVideoUpload"
                  :disabled="isUploading"
                  class="text-xs font-semibold flex items-center gap-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
                >
                  <Loader2 v-if="isUploading" class="w-3.5 h-3.5 animate-spin" />
                  <HardDrive v-else class="w-3.5 h-3.5" />
                  <span>{{ isUploading ? 'Đang tải lên...' : 'Tải video từ ổ cứng' }}</span>
                </button>
              </div>

              <!-- Drag & Drop Dropzone for Video -->
              <div 
                @dragover.prevent
                @drop.prevent="onVideoDrop"
                @click="triggerVideoUpload"
                class="border-2 border-dashed border-gray-200 hover:border-rose-400 rounded-xl p-3 bg-gray-50/60 hover:bg-rose-50/40 transition-all text-center group cursor-pointer mb-2"
              >
                <div class="flex items-center justify-center gap-2 text-gray-500 group-hover:text-rose-600 text-xs">
                  <Upload class="w-4 h-4" />
                  <span class="font-medium">Kéo thả video hoặc bấm để chọn tệp từ máy tính</span>
                </div>
                <p class="text-[10px] text-gray-400 mt-0.5">MP4, WebM, MOV, OGG (Tối đa 100MB)</p>
              </div>

              <!-- Direct URL / YouTube / Google Drive -->
              <div class="mt-2">
                <label class="block text-[11px] font-medium text-gray-500 mb-1">Hoặc dán URL YouTube / Google Drive / link video:</label>
                <input 
                  v-model="localForm.videoUrl" 
                  type="text" 
                  class="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-xs text-gray-800 font-mono"
                  placeholder="https://... hoặc /uploads/..."
                />
                <p class="text-[11px] text-gray-400 mt-1">💡 Hỗ trợ video tải lên từ máy tính, YouTube hoặc Google Drive.</p>
              </div>
            </div>

            <!-- Upload Error Alert -->
            <div v-if="uploadError" class="text-xs text-rose-500 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-100">
              {{ uploadError }}
            </div>

            <!-- Quick Samples -->
            <div>
              <span class="text-[11px] text-gray-400 block mb-1">Mẫu video:</span>
              <div class="flex gap-2 flex-wrap">
                <button 
                  type="button" 
                  @click="localForm.videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'"
                  class="text-[11px] px-2.5 py-1 bg-gray-100 hover:bg-sky-100 hover:text-sky-700 text-gray-600 rounded-lg transition-colors cursor-pointer"
                >
                  YouTube Demo
                </button>
                <button 
                  type="button" 
                  @click="localForm.videoUrl = 'https://www.youtube.com/watch?v=LXb3EKWsInQ'"
                  class="text-[11px] px-2.5 py-1 bg-gray-100 hover:bg-sky-100 hover:text-sky-700 text-gray-600 rounded-lg transition-colors cursor-pointer"
                >
                  4K Nature
                </button>
              </div>
            </div>

            <!-- Video Preview -->
            <div v-if="localForm.videoUrl" class="mt-2 border border-gray-200 rounded-xl overflow-hidden bg-black h-40 relative group">
              <video 
                v-if="isDirectVideoUrl(localForm.videoUrl)" 
                :src="localForm.videoUrl" 
                controls 
                class="w-full h-full object-cover"
                preload="metadata"
              ></video>
              <iframe 
                v-else-if="getVideoEmbedUrl(localForm.videoUrl)" 
                :src="getVideoEmbedUrl(localForm.videoUrl)" 
                class="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
              <button 
                type="button" 
                @click="localForm.videoUrl = ''" 
                class="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-rose-600 text-white rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="Xóa video"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- 3D. TYPE = 'card' (Card thông tin) -->
          <div v-if="localForm.type === 'card'" class="space-y-3 pt-1">
            <div>
              <label class="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Mô tả ngắn</label>
              <input 
                v-model="localForm.description" 
                type="text" 
                class="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-xs text-gray-700"
                placeholder="Mô tả mục tiêu, nhiệm vụ..."
              />
            </div>

            <!-- Status Badge -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Trạng thái (Badge)</label>
                <input 
                  v-model="localForm.status" 
                  type="text" 
                  class="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-xs text-gray-800"
                  placeholder="VD: Đang làm, Hoàn thành..."
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Màu trạng thái</label>
                <div class="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    v-for="c in ['#0284c7', '#059669', '#d97706', '#dc2626', '#7c3aed']"
                    :key="c"
                    @click="localForm.statusColor = c"
                    class="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer"
                    :class="localForm.statusColor === c ? 'border-slate-800 scale-110 shadow-xs' : 'border-white'"
                    :style="{ backgroundColor: c }"
                  ></button>
                </div>
              </div>
            </div>

            <!-- Custom Fields List -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-xs font-semibold text-gray-600 uppercase">Các trường thông tin (Fields)</label>
                <button 
                  type="button" 
                  @click="addField" 
                  class="text-xs text-sky-600 font-bold hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                >
                  + Thêm trường
                </button>
              </div>

              <div class="space-y-2 max-h-36 overflow-y-auto pr-1">
                <div 
                  v-for="(f, i) in localForm.fields" 
                  :key="i"
                  class="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200"
                >
                  <input 
                    v-model="f.key" 
                    type="text" 
                    placeholder="Tên trường (VD: Hạn chót)" 
                    class="w-1/3 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-sky-500"
                  />
                  <span class="text-gray-400 font-bold">:</span>
                  <input 
                    v-model="f.value" 
                    type="text" 
                    placeholder="Giá trị (VD: 30/09)" 
                    class="flex-1 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-sky-500"
                  />
                  <button 
                    type="button" 
                    @click="removeField(i)" 
                    class="p-1 text-gray-400 hover:text-rose-500 cursor-pointer"
                    title="Xóa trường"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
                <div v-if="!localForm.fields || localForm.fields.length === 0" class="text-xs text-gray-400 italic text-center py-2">
                  Chưa có trường nào. Nhấn "+ Thêm trường" để tạo.
                </div>
              </div>
            </div>
          </div>

          <!-- 3E. TYPE = 'link' (Box liên kết) -->
          <div v-if="localForm.type === 'link'" class="space-y-3 pt-1">
            <div>
              <label class="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Địa chỉ Web (URL)</label>
              <input 
                v-model="localForm.url" 
                type="text" 
                class="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-xs text-gray-800 font-mono"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Mô tả liên kết</label>
              <input 
                v-model="localForm.description" 
                type="text" 
                class="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-xs text-gray-700"
                placeholder="Mô tả tóm tắt trang web..."
              />
            </div>
          </div>

          <!-- 4. Color & Border Palette -->
          <div class="pt-2 border-t border-gray-100">
            <label class="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Màu sắc chủ đạo</label>
            <div class="flex items-center gap-2">
              <button
                type="button"
                v-for="c in colorPresets"
                :key="c.border"
                @click="localForm.border = c.border; localForm.color = c.color"
                class="w-7 h-7 rounded-xl border-2 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer"
                :class="localForm.border === c.border ? 'border-slate-800 scale-110 shadow-sm' : 'border-white'"
                :style="{ backgroundColor: c.border }"
              >
                <Check v-if="localForm.border === c.border" class="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>

        <!-- Footer Buttons -->
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-2">
          <button 
            type="button"
            @click="close" 
            class="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button 
            type="button"
            @click="save" 
            class="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-sm hover:shadow transition-all cursor-pointer"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { 
  Sliders, X, Type, FileText, Image as ImageIcon, 
  Video, CreditCard, ExternalLink, Trash2, Check,
  Upload, HardDrive, Loader2
} from 'lucide-vue-next'
import { updateNodeProps } from '../store/mindmapStore'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  node: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const imageFileInput = ref(null)
const videoFileInput = ref(null)
const isUploading = ref(false)
const uploadError = ref('')

const typeOptions = [
  { value: 'topic', label: 'Topic thường', icon: Type },
  { value: 'text', label: 'Box văn bản', icon: FileText },
  { value: 'image', label: 'Box ảnh', icon: ImageIcon },
  { value: 'video', label: 'Box video', icon: Video },
  { value: 'card', label: 'Card thông tin', icon: CreditCard },
  { value: 'link', label: 'Liên kết Web', icon: ExternalLink }
]

const colorPresets = [
  { color: '#38bdf8', border: '#0284c7' },
  { color: '#10b981', border: '#059669' },
  { color: '#f59e0b', border: '#d97706' },
  { color: '#ec4899', border: '#db2777' },
  { color: '#a855f7', border: '#7e22ce' },
  { color: '#ef4444', border: '#dc2626' },
  { color: '#64748b', border: '#334155' }
]

const sampleImages = [
  { name: 'Công nghệ', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80' },
  { name: 'Kinh doanh', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80' },
  { name: 'Thiết kế', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80' }
]

const localForm = reactive({
  type: 'topic',
  label: '',
  content: '',
  imageUrl: '',
  caption: '',
  videoUrl: '',
  description: '',
  status: '',
  statusColor: '#0284c7',
  fields: [],
  url: '',
  border: '#0284c7',
  color: '#38bdf8'
})

watch(() => props.node, (newNode) => {
  if (newNode) {
    localForm.type = newNode.type || 'topic'
    localForm.label = newNode.label || ''
    localForm.content = newNode.content || ''
    localForm.imageUrl = newNode.imageUrl || ''
    localForm.caption = newNode.caption || ''
    localForm.videoUrl = newNode.videoUrl || ''
    localForm.description = newNode.description || ''
    localForm.status = newNode.status || ''
    localForm.statusColor = newNode.statusColor || '#0284c7'
    localForm.fields = newNode.fields ? JSON.parse(JSON.stringify(newNode.fields)) : []
    localForm.url = newNode.url || ''
    localForm.border = newNode.border || '#0284c7'
    localForm.color = newNode.color || '#38bdf8'
    uploadError.value = ''
  }
}, { immediate: true })

function triggerImageUpload() {
  imageFileInput.value?.click()
}

function triggerVideoUpload() {
  videoFileInput.value?.click()
}

async function handleFileUpload(file, targetType) {
  if (!file) return
  isUploading.value = true
  uploadError.value = ''
  
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    
    const data = await res.json()
    if (data.success) {
      if (targetType === 'image') {
        localForm.imageUrl = data.url
        if (!localForm.label || localForm.label === 'New Topic' || localForm.label === 'Hình ảnh') {
          localForm.label = file.name.replace(/\.[^/.]+$/, '')
        }
      } else if (targetType === 'video') {
        localForm.videoUrl = data.url
        if (!localForm.label || localForm.label === 'New Topic' || localForm.label === 'Video Demo') {
          localForm.label = file.name.replace(/\.[^/.]+$/, '')
        }
      }
    } else {
      uploadError.value = data.message || 'Lỗi khi tải tệp lên'
    }
  } catch (err) {
    console.error('Upload error:', err)
    uploadError.value = 'Lỗi kết nối máy chủ khi upload tệp'
  } finally {
    isUploading.value = false
  }
}

function onImageFileSelected(e) {
  const file = e.target.files?.[0]
  if (file) handleFileUpload(file, 'image')
  e.target.value = ''
}

function onVideoFileSelected(e) {
  const file = e.target.files?.[0]
  if (file) handleFileUpload(file, 'video')
  e.target.value = ''
}

function onImageDrop(e) {
  const file = e.dataTransfer?.files?.[0]
  if (file) handleFileUpload(file, 'image')
}

function onVideoDrop(e) {
  const file = e.dataTransfer?.files?.[0]
  if (file) handleFileUpload(file, 'video')
}

function addField() {
  if (!localForm.fields) localForm.fields = []
  localForm.fields.push({ key: '', value: '' })
}

function removeField(index) {
  localForm.fields.splice(index, 1)
}

function extractGoogleDriveFileId(url) {
  if (!url) return null
  const matchD = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (matchD) return matchD[1]
  const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (matchId) return matchId[1]
  return null
}

function formatImageUrl(url) {
  if (!url) return ''
  if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
    const fileId = extractGoogleDriveFileId(url)
    if (fileId) {
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`
    }
  }
  return url
}

function isDirectVideoUrl(url) {
  if (!url) return false
  if (url.startsWith('/uploads/') || url.includes('/uploads/')) return true
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url)
}

function getVideoEmbedUrl(url) {
  if (!url) return ''
  if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
    const fileId = extractGoogleDriveFileId(url)
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`
    }
  }
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`
  const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  if (longMatch) return `https://www.youtube.com/embed/${longMatch[1]}`
  if (url.includes('youtube.com/embed/')) return url
  return url
}

function close() {
  emit('close')
}

function save() {
  if (!props.node) return
  updateNodeProps(props.node.id, {
    type: localForm.type,
    label: localForm.label,
    content: localForm.content,
    imageUrl: localForm.imageUrl,
    caption: localForm.caption,
    videoUrl: localForm.videoUrl,
    description: localForm.description,
    status: localForm.status,
    statusColor: localForm.statusColor,
    fields: localForm.fields,
    url: localForm.url,
    border: localForm.border,
    color: localForm.color
  })
  close()
}
</script>
