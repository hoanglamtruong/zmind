<template>
  <div 
    v-if="isOpen" 
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs select-none p-4 animate-in fade-in"
    @click.self="close"
    @keydown.esc="close"
  >
    <div class="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
            <Sliders class="w-4 h-4" />
          </div>
          <div>
            <h3 class="font-bold text-gray-800 text-base">Chỉnh sửa chi tiết Node</h3>
            <p class="text-xs text-gray-500">Tùy biến nội dung, loại hiển thị & thuộc tính</p>
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

        <!-- 3B. TYPE = 'image' (Box ảnh) -->
        <div v-if="localForm.type === 'image'" class="space-y-3 pt-1">
          <div>
            <label class="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Đường dẫn ảnh (Image URL)</label>
            <input 
              v-model="localForm.imageUrl" 
              type="text" 
              class="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-xs text-gray-800 font-mono"
              placeholder="https://example.com/image.jpg"
            />
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
          <div v-if="localForm.imageUrl" class="mt-2 border border-gray-200 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center max-h-48">
            <img :src="localForm.imageUrl" alt="Preview" class="max-h-44 object-contain" />
          </div>
        </div>

        <!-- 3C. TYPE = 'video' (Box video) -->
        <div v-if="localForm.type === 'video'" class="space-y-3 pt-1">
          <div>
            <label class="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Link Video (YouTube hoặc MP4)</label>
            <input 
              v-model="localForm.videoUrl" 
              type="text" 
              class="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-xs text-gray-800 font-mono"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p class="text-[11px] text-gray-400 mt-1">Hỗ trợ link YouTube (dạng watch?v= hoặc youtu.be/) tự động nhúng player xem trực tiếp.</p>
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
                Rick Astley
              </button>
              <button 
                type="button"
                @click="localForm.videoUrl = 'https://www.youtube.com/watch?v=LXb3EKWsInQ'"
                class="text-[11px] px-2.5 py-1 bg-gray-100 hover:bg-sky-100 hover:text-sky-700 text-gray-600 rounded-lg transition-colors cursor-pointer"
              >
                4K Nature Video
              </button>
            </div>
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
</template>

<script setup>
import { reactive, watch } from 'vue'
import { 
  Sliders, X, Type, FileText, Image as ImageIcon, 
  Video, CreditCard, ExternalLink, Trash2, Check 
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
  }
}, { immediate: true })

function addField() {
  if (!localForm.fields) localForm.fields = []
  localForm.fields.push({ key: '', value: '' })
}

function removeField(index) {
  localForm.fields.splice(index, 1)
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
