<template>
  <div 
    class="relative w-full h-[calc(100vh-80px)] overflow-hidden select-none transition-colors duration-200"
    :style="{ backgroundColor: canvasBgColor }"
    ref="boardRef"
    tabindex="0"
    @keydown="onKeyDown"
    @mousedown="onCanvasMouseDown"
    @mousemove="onMouseMove"
    @mouseup="onMouseUp"
    @contextmenu.prevent="onCanvasContextMenu"
    @dblclick="onCanvasDblClick"
  >
    <!-- Background subtle grid -->
    <div 
      class="absolute inset-0 pointer-events-none opacity-35"
      :style="{
        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        transform: `translate(${pan.x % 20}px, ${pan.y % 20}px)`
      }"
    ></div>

    <!-- BÔI ĐEN CHỌN NHIỀU (Marquee Selection Box) -->
    <div
      v-if="isMarqueeSelecting && marqueeBoxStyle"
      class="absolute border border-dashed border-sky-500 bg-sky-500/15 pointer-events-none z-50 rounded transition-none"
      :style="marqueeBoxStyle"
    ></div>

    <!-- Canvas Pan/Zoom Layer -->
    <div 
      :class="['absolute origin-top-left', isDraggingCanvas ? 'transition-none' : 'transition-transform duration-75']"
      :style="{
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
      }"
    >
      <!-- SVG Curved Lines with Arrows & Control Handles -->
      <svg class="overflow-visible absolute top-0 left-0 w-1 h-1 z-0">
        <defs>
          <template v-for="edge in store.graph.edges" :key="'defs_' + edge.id">
            <!-- Target arrow -->
            <marker 
              :id="'arrow_target_' + edge.id" 
              viewBox="0 0 10 10" 
              refX="6" 
              refY="5" 
              markerWidth="5" 
              markerHeight="5" 
              orient="auto"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" :fill="edge.color" />
            </marker>

            <!-- Source arrow -->
            <marker 
              :id="'arrow_source_' + edge.id" 
              viewBox="0 0 10 10" 
              refX="4" 
              refY="5" 
              markerWidth="5" 
              markerHeight="5" 
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" :fill="edge.color" />
            </marker>
          </template>
        </defs>

        <!-- Edges Rendering -->
        <g v-for="edge in edgePaths" :key="edge.id">
          <!-- Transparent clickable thick hover hit-box -->
          <path
            :d="edge.d"
            fill="none"
            stroke="transparent"
            stroke-width="20"
            class="cursor-pointer"
            @click.stop="onEdgeClick(edge.id, $event)"
          />

          <!-- Actual Visible Path -->
          <path
            :d="edge.d"
            fill="none"
            :stroke="edge.color"
            :stroke-width="edge.strokeWidth || 1.8"
            :stroke-dasharray="getStrokeDasharray(edge.style)"
            :marker-end="(!edge.arrow || edge.arrow === 'target' || edge.arrow === 'both') ? `url(#arrow_target_${edge.id})` : 'none'"
            :marker-start="(edge.arrow === 'source' || edge.arrow === 'both') ? `url(#arrow_source_${edge.id})` : 'none'"
            stroke-linecap="round"
            :class="[
              'cursor-pointer',
              draggingNode ? 'transition-none' : 'transition-colors',
              relationCustomizerState.edgeId === edge.id ? 'stroke-[3px] filter drop-shadow' : 'hover:opacity-80'
            ]"
            @click.stop="onEdgeClick(edge.id, $event)"
          />

          <!-- INTERACTIVE 2 BÉZIER CONTROL HANDLES ("2 RÂU ĐIỀU HƯỚNG") -->
          <template v-if="relationCustomizerState.edgeId === edge.id">
            <!-- Râu 1: Source Control Line -->
            <line 
              :x1="edge.sx" 
              :y1="edge.sy" 
              :x2="edge.cp1x" 
              :y2="edge.cp1y" 
              stroke="#0284c7" 
              stroke-width="1.2" 
              stroke-dasharray="3,3" 
            />

            <!-- Râu 2: Target Control Line -->
            <line 
              :x1="edge.tx" 
              :y1="edge.ty" 
              :x2="edge.cp2x" 
              :y2="edge.cp2y" 
              stroke="#0284c7" 
              stroke-width="1.2" 
              stroke-dasharray="3,3" 
            />

            <!-- Handle 1 Square (Kéo râu 1) -->
            <rect 
              :x="edge.cp1x - 5" 
              :y="edge.cp1y - 5" 
              width="10" 
              height="10" 
              fill="white" 
              stroke="#0284c7" 
              stroke-width="2" 
              class="cursor-crosshair hover:scale-125 transition-transform"
              @mousedown.stop="startDragControlPoint(edge.id, 1, $event)"
              title="Kéo râu 1 để chỉnh hướng và độ cong đầu nguồn"
            />

            <!-- Handle 2 Square (Kéo râu 2) -->
            <rect 
              :x="edge.cp2x - 5" 
              :y="edge.cp2y - 5" 
              width="10" 
              height="10" 
              fill="white" 
              stroke="#0284c7" 
              stroke-width="2" 
              class="cursor-crosshair hover:scale-125 transition-transform"
              @mousedown.stop="startDragControlPoint(edge.id, 2, $event)"
              title="Kéo râu 2 để chỉnh hướng và độ cong đầu đích"
            />
          </template>
        </g>

        <!-- Active Connecting Line Preview -->
        <path 
          v-if="connectingSource && currentMousePos"
          :d="`M ${connectingSource.x + 50} ${connectingSource.y + 18} L ${currentMousePos.x} ${currentMousePos.y}`"
          fill="none"
          stroke="#0284c7"
          stroke-width="2"
          stroke-dasharray="4,4"
        />
      </svg>

      <!-- EDGE LABELS & LABEL BUTTON HANDLES -->
      <template v-for="edge in edgePaths" :key="'label_group_' + edge.id">
        <!-- 1. Case: Has Label -> Render Pill Badge -->
        <div 
          v-if="edge.label"
          @click.stop="openLabelCustomizer(edge.id, $event)"
          class="absolute px-3 py-0.5 rounded-full text-white text-[11px] font-bold shadow-md cursor-pointer hover:scale-110 transition-transform -translate-x-1/2 -translate-y-1/2 z-20 flex items-center gap-1 group"
          :style="{
            left: `${edge.midX}px`,
            top: `${edge.midY}px`,
            backgroundColor: edge.color
          }"
          title="Nhấp đúp để sửa nhãn nhanh"
        >
          <!-- Inline text edit for label -->
          <input 
            v-if="editingLabelEdgeId === edge.id"
            v-model="editLabelText"
            @blur="saveEdgeLabel(edge.id)"
            @keydown.enter="saveEdgeLabel(edge.id)"
            class="bg-transparent text-white font-bold outline-none text-center w-16"
            autoFocus
          />
          <span v-else @dblclick.stop="startEditEdgeLabel(edge)">
            {{ edge.label }}
          </span>
        </div>

        <!-- 2. Case: Edge is selected but no label yet -> Show handle pill like Mindomo screenshot -->
        <div 
          v-else-if="relationCustomizerState.edgeId === edge.id"
          @click.stop="openLabelCustomizer(edge.id, $event)"
          class="absolute w-5 h-7 rounded-lg bg-emerald-400 border-2 border-sky-500 shadow-md cursor-pointer hover:scale-115 transition-transform -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center text-white"
          :style="{
            left: `${edge.midX}px`,
            top: `${edge.midY}px`
          }"
          title="Thêm nhãn (Add Label)"
        >
          <!-- Blue circle with triangle down like screenshot -->
          <div class="w-3 h-3 rounded-full bg-sky-500 flex items-center justify-center">
            <span class="text-[7px]">▼</span>
          </div>
        </div>
      </template>

      <!-- NODES RENDERING -->
      <div 
        v-for="node in store.graph.nodes"
        :key="node.id"
        @mousedown.stop="startDragNode(node, $event)"
        @click.stop="onNodeClick(node, $event)"
        @dblclick.stop="openNodeEditor(node)"
        :class="[
          'absolute cursor-pointer flex font-semibold text-sm bg-white shadow-sm z-10 select-none group',
          draggingNode ? 'transition-none pointer-events-auto' : 'transition-shadow duration-150',
          node.type === 'text' || node.type === 'image' || node.type === 'video' || node.type === 'card' 
            ? 'rounded-2xl p-3 flex-col' 
            : node.type === 'link' 
              ? 'rounded-2xl p-2.5 flex-col' 
              : 'px-5 py-2 rounded-full items-center justify-center flex-row',
          node.selected 
            ? 'ring-2 ring-[#0284c7] ring-offset-2 ring-offset-white shadow-lg bg-sky-50/30' 
            : 'hover:shadow-md'
        ]"
        :style="{
          left: `${node.x}px`,
          top: `${node.y}px`,
          border: `1.8px solid ${node.border}`,
          width: node.type === 'text' || node.type === 'image' ? '220px' : node.type === 'video' ? '260px' : node.type === 'card' ? '240px' : node.type === 'link' ? '220px' : 'auto'
        }"
      >
        <!-- 1. BOXTEXT -->
        <div v-if="node.type === 'text'" class="w-full space-y-1.5 text-left">
          <div class="flex items-center justify-between border-b border-gray-100 pb-1">
            <div class="flex items-center gap-1.5 text-xs font-bold truncate" :style="{ color: node.border }">
              <FileText class="w-3.5 h-3.5 shrink-0" />
              <span class="truncate">{{ node.label }}</span>
            </div>
            <span class="text-[9px] text-gray-400 font-mono uppercase bg-gray-100 px-1 py-0.5 rounded">Text</span>
          </div>
          <p class="text-xs text-gray-600 font-normal whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto">
            {{ node.content || 'Nhấn đúp để nhập nội dung...' }}
          </p>
        </div>

        <!-- 2. BOX ẢNH -->
        <div v-else-if="node.type === 'image'" class="w-full space-y-1.5 text-left">
          <div class="rounded-xl overflow-hidden bg-gray-100 h-28 w-full border border-gray-100 flex items-center justify-center">
            <img 
              v-if="node.imageUrl" 
              :src="formatImageUrl(node.imageUrl)" 
              :alt="node.label"
              class="w-full h-full object-cover pointer-events-none"
              loading="lazy"
            />
            <div v-else class="text-center text-gray-400 p-2">
              <ImageIcon class="w-6 h-6 mx-auto mb-1 text-gray-300" />
              <span class="text-[10px]">Chưa có ảnh</span>
            </div>
          </div>
          <div class="text-xs font-bold truncate" :style="{ color: node.border }">
            {{ node.label }}
          </div>
          <p v-if="node.caption" class="text-[11px] text-gray-500 font-normal truncate">
            {{ node.caption }}
          </p>
        </div>

        <!-- 3. BOX VIDEO -->
        <div v-else-if="node.type === 'video'" class="w-full space-y-1.5 text-left">
          <div class="flex items-center justify-between border-b border-gray-100 pb-1">
            <div class="flex items-center gap-1.5 text-xs font-bold truncate" :style="{ color: node.border }">
              <Video class="w-3.5 h-3.5 shrink-0" />
              <span class="truncate">{{ node.label }}</span>
            </div>
            <span class="text-[9px] text-rose-500 font-mono uppercase bg-rose-50 px-1 py-0.5 rounded font-bold">
              {{ node.videoUrl && (node.videoUrl.includes('drive.google') || node.videoUrl.includes('docs.google')) ? 'G-Drive' : 'Video' }}
            </span>
          </div>
          <div class="rounded-xl overflow-hidden bg-black h-36 w-full relative">
            <iframe 
              v-if="getVideoEmbedUrl(node.videoUrl)"
              :src="getVideoEmbedUrl(node.videoUrl)"
              class="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
            <div v-else class="w-full h-full flex flex-col items-center justify-center text-gray-400 text-xs">
              <Video class="w-6 h-6 mb-1 text-gray-500" />
              <span>Chưa gắn link video</span>
            </div>
          </div>
        </div>

        <!-- 4. CARD THÔNG TIN ĐA TRƯỜNG -->
        <div v-else-if="node.type === 'card'" class="w-full space-y-2 text-left">
          <!-- Card Header: Title + Status Badge -->
          <div class="flex items-start justify-between gap-1.5">
            <div class="text-xs font-bold truncate" :style="{ color: node.border }">
              {{ node.label }}
            </div>
            <span 
              v-if="node.status"
              class="text-[10px] px-2 py-0.5 rounded-full font-bold text-white shrink-0 shadow-2xs"
              :style="{ backgroundColor: node.statusColor || '#0284c7' }"
            >
              {{ node.status }}
            </span>
          </div>

          <!-- Description -->
          <p v-if="node.description" class="text-[11px] text-gray-500 font-normal leading-tight">
            {{ node.description }}
          </p>

          <!-- Fields Table -->
          <div v-if="node.fields && node.fields.length > 0" class="space-y-1 pt-1 border-t border-gray-100">
            <div 
              v-for="(f, fi) in node.fields" 
              :key="fi"
              class="flex items-center justify-between text-[11px] py-0.5"
            >
              <span class="text-gray-400 font-medium">{{ f.key }}:</span>
              <span class="text-gray-700 font-semibold">{{ f.value }}</span>
            </div>
          </div>
        </div>

        <!-- 5. LINK BOOKMARK -->
        <div v-else-if="node.type === 'link'" class="w-full flex items-center justify-between gap-2 text-left">
          <div class="flex items-center gap-2 overflow-hidden">
            <div class="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
              <ExternalLink class="w-3.5 h-3.5" />
            </div>
            <div class="overflow-hidden">
              <div class="text-xs font-bold truncate" :style="{ color: node.border }">
                {{ node.label }}
              </div>
              <div class="text-[10px] text-gray-400 font-mono truncate">
                {{ formatDomain(node.url) }}
              </div>
            </div>
          </div>
          <button 
            @click.stop="openLink(node.url)" 
            class="p-1 rounded-md text-gray-400 hover:text-sky-600 hover:bg-sky-50 cursor-pointer"
            title="Mở liên kết trên tab mới"
          >
            ↗
          </button>
        </div>

        <!-- 6. DEFAULT TOPIC (PILL) -->
        <div v-else class="flex items-center justify-center w-full">
          <!-- Completed Checkbox if enabled -->
          <input 
            v-if="node.completed !== undefined"
            type="checkbox"
            :checked="node.completed"
            @click.stop="toggleTaskComplete(node.id)"
            class="w-3.5 h-3.5 rounded text-sky-600 mr-2 focus:ring-0 cursor-pointer"
          />

          <!-- Note Badge indicator -->
          <span v-if="node.note" class="mr-1.5 text-xs text-amber-500" title="Có ghi chú">📝</span>

          <!-- Double click to inline edit -->
          <input 
            v-if="editingId === node.id"
            v-model="editLabel"
            @blur="saveEdit(node.id)"
            @keydown.enter="saveEdit(node.id)"
            class="outline-none bg-transparent text-center font-semibold w-24"
            autoFocus
          />
          <span 
            v-else 
            @dblclick="startEdit(node)" 
            :class="['whitespace-nowrap px-1', node.completed ? 'line-through opacity-50' : '']"
            :style="{ color: node.border }"
          >
            {{ node.label }}
          </span>
        </div>

        <!-- Multi-select check icon badge -->
        <div 
          v-if="selectedCount > 1 && node.selected"
          class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center text-[9px] font-bold shadow"
        >
          ✓
        </div>

        <!-- Active Handle dot (Blue circle on right like Mindomo - single select only) -->
        <div 
          v-if="node.selected && selectedCount <= 1"
          @mousedown.stop="startConnect(node)"
          @click.stop="addNodeNearSelected"
          class="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#0284c7] border-2 border-white flex items-center justify-center text-white text-[9px] font-bold shadow cursor-pointer hover:scale-125 transition-transform z-20"
          title="Nhấp để thêm nhánh, hoặc Kéo sang node khác để nối dây"
        >
          +
        </div>
      </div>

      <!-- FLOATING CONTEXT MENU (Below Selected Node or Multi-Selection Toolbar) -->
      <div 
        v-if="selectedNode && !draggingNode"
        @mousedown.stop
        class="absolute bg-white rounded-2xl shadow-xl border border-gray-200 py-1 px-2 flex items-center space-x-1 z-40 transition-none animate-in fade-in"
        :style="{
          left: `${selectedNode.x - 30}px`,
          top: `${selectedNode.y + (getNodeDimensions(selectedNode).height) + 12}px`
        }"
      >
        <!-- Multi-selection badge indicator -->
        <div v-if="selectedCount > 1" class="px-2 py-0.5 mr-1 bg-sky-100 text-sky-700 text-xs font-bold rounded-full flex items-center gap-1">
          <span>Đã chọn {{ selectedCount }}</span>
        </div>

        <!-- Type Switcher Dropdown (Single Node) -->
        <div v-if="selectedCount <= 1" class="relative">
          <button 
            @click.stop="showTypeSwitcher = !showTypeSwitcher" 
            class="p-1.5 text-gray-600 hover:text-sky-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer" 
            title="Đổi kiểu hiển thị node (Topic, Text, Ảnh, Video, Card, Link)"
          >
            <LayoutGrid class="w-3.5 h-3.5" />
            <span class="text-[9px] uppercase font-bold text-sky-600 font-mono">
              {{ selectedNode.type || 'topic' }}
            </span>
          </button>

          <!-- Type Switcher Menu -->
          <div 
            v-if="showTypeSwitcher" 
            @mousedown.stop
            class="absolute left-0 bottom-full mb-2 bg-white rounded-xl shadow-xl border border-gray-200 py-1 min-w-[150px] z-50 animate-in fade-in"
          >
            <button 
              v-for="t in typeOptions" 
              :key="t.value"
              @click="handleNodeTypeChange(t.value)"
              class="w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-sky-50 hover:text-sky-700 cursor-pointer"
              :class="(selectedNode.type || 'topic') === t.value ? 'font-bold text-sky-600 bg-sky-50/50' : 'text-gray-700'"
            >
              <component :is="t.icon" class="w-3.5 h-3.5" />
              <span>{{ t.label }}</span>
            </button>
          </div>
        </div>

        <!-- Edit Properties Button (Modal) -->
        <button 
          v-if="selectedCount <= 1" 
          @click="openNodeEditor(selectedNode)" 
          class="p-1.5 text-gray-600 hover:text-sky-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer" 
          title="Chỉnh sửa chi tiết nội dung / thuộc tính"
        >
          <Sliders class="w-3.5 h-3.5" />
        </button>

        <div v-if="selectedCount <= 1" class="h-4 w-[1px] bg-gray-200 my-auto"></div>

        <!-- 1. Add Subtopic (Tạo - only when 1 node selected) -->
        <button v-if="selectedCount <= 1" @click="addNodeNearSelected" class="p-1.5 text-gray-600 hover:text-sky-600 hover:bg-gray-100 rounded-lg transition-colors" title="Tạo nhánh mới (+)">
          <Plus class="w-3.5 h-3.5" />
        </button>

        <!-- 2. Text Edit (Sửa - single node) -->
        <button v-if="selectedCount <= 1" @click="startEdit(selectedNode)" class="p-1.5 text-gray-600 hover:text-sky-600 hover:bg-gray-100 rounded-lg transition-colors font-serif font-bold text-xs" title="Sửa chữ">
          A
        </button>

        <!-- 3. Notes (Ghi chú - single node) -->
        <button v-if="selectedCount <= 1" @click="openNotePrompt" class="p-1.5 text-gray-600 hover:text-sky-600 hover:bg-gray-100 rounded-lg transition-colors" title="Thêm Ghi chú">
          <FileText class="w-3.5 h-3.5" />
        </button>

        <!-- 4. Duplicate (Nhân bản nhiều hoặc 1) -->
        <button @click="duplicateSelectedNode" class="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-gray-100 rounded-lg transition-colors" :title="selectedCount > 1 ? `Nhân bản cả ${selectedCount} node (Ctrl+D)` : 'Nhân bản node (Ctrl+D)'">
          <Copy class="w-3.5 h-3.5" />
        </button>

        <!-- 5. Emoji / Icons (Single) -->
        <button v-if="selectedCount <= 1" @click="addEmoji" class="p-1.5 text-gray-600 hover:text-sky-600 hover:bg-gray-100 rounded-lg transition-colors" title="Thêm icon">
          <Smile class="w-3.5 h-3.5" />
        </button>

        <!-- 6. Checkbox Task -->
        <button v-if="selectedCount <= 1" @click="toggleTaskComplete(selectedNode.id)" class="p-1.5 text-gray-600 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors" title="Chuyển thành Task To-do">
          <CheckSquare class="w-3.5 h-3.5" />
        </button>

        <!-- 7. Relationship Arrow (Nối dây) -->
        <button v-if="selectedCount <= 1" @click="startConnect(selectedNode)" class="p-1.5 text-gray-600 hover:text-sky-600 hover:bg-gray-100 rounded-lg transition-colors" title="Tạo đường liên kết (Click rồi chọn node đích)">
          <GitBranch class="w-3.5 h-3.5" />
        </button>

        <div class="h-4 w-[1px] bg-gray-200 my-auto"></div>

        <!-- 8. Delete (Xóa 1 hoặc toàn bộ node đã chọn) -->
        <button @click="deleteSelectedNode" class="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-gray-100 rounded-lg transition-colors" :title="selectedCount > 1 ? `Xóa ${selectedCount} node đang chọn (Delete)` : 'Xóa node (Delete)'">
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- RELATIONSHIP CUSTOMIZER POPOVER (Mindomo Line Styling) -->
    <RelationCustomizer />

    <!-- NODE DETAILS & ATTRIBUTES EDITOR MODAL -->
    <NodeEditorModal :is-open="isNodeEditorOpen" :node="editingNode" @close="closeNodeEditor" />

    <!-- MINDOMO-STYLE CANVAS CONTEXT MENU (Chuột phải trên vùng tạo map) -->
    <div
      v-if="canvasContextMenu.isOpen"
      @mousedown.stop
      class="absolute z-50 bg-white rounded-xl shadow-2xl border border-gray-200 py-1.5 min-w-[240px] text-[13px] text-gray-700 animate-in fade-in select-none"
      :style="{
        left: `${canvasContextMenu.x}px`,
        top: `${canvasContextMenu.y}px`
      }"
    >
      <!-- 1. Menu tạo nhanh node với submenu -->
      <div 
        class="relative group/create"
        @mouseenter="showCreateSubmenu = true"
        @mouseleave="showCreateSubmenu = false"
      >
        <button
          class="w-full px-3.5 py-2 flex items-center justify-between hover:bg-sky-50 hover:text-sky-700 transition-colors text-left cursor-pointer"
        >
          <div class="flex items-center gap-2.5">
            <div class="w-5 h-3.5 border-[1.5px] border-gray-600 rounded flex items-center justify-center group-hover:border-sky-600">
              <span class="text-[9px] font-bold leading-none">+</span>
            </div>
            <span class="font-medium">Tạo node mới</span>
          </div>
          <span class="text-gray-400 text-xs">›</span>
        </button>

        <!-- Submenu tạo các loại node -->
        <div
          v-if="showCreateSubmenu"
          class="absolute left-full top-0 ml-1 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 min-w-[170px] z-50 flex flex-col"
        >
          <button 
            @click="createTypedNodeFromContextMenu('topic')" 
            class="px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-sky-50 hover:text-sky-700 cursor-pointer"
          >
            <Type class="w-3.5 h-3.5 text-gray-500" />
            <span>Topic thường</span>
          </button>
          <button 
            @click="createTypedNodeFromContextMenu('text')" 
            class="px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-sky-50 hover:text-sky-700 cursor-pointer"
          >
            <FileText class="w-3.5 h-3.5 text-sky-600" />
            <span>Box văn bản</span>
          </button>
          <button 
            @click="createTypedNodeFromContextMenu('image')" 
            class="px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-sky-50 hover:text-sky-700 cursor-pointer"
          >
            <ImageIcon class="w-3.5 h-3.5 text-emerald-600" />
            <span>Box hình ảnh</span>
          </button>
          <button 
            @click="createTypedNodeFromContextMenu('video')" 
            class="px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-sky-50 hover:text-sky-700 cursor-pointer"
          >
            <Video class="w-3.5 h-3.5 text-rose-600" />
            <span>Box video</span>
          </button>
          <button 
            @click="createTypedNodeFromContextMenu('card')" 
            class="px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-sky-50 hover:text-sky-700 cursor-pointer"
          >
            <CreditCard class="w-3.5 h-3.5 text-purple-600" />
            <span>Card thông tin</span>
          </button>
          <button 
            @click="createTypedNodeFromContextMenu('link')" 
            class="px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-sky-50 hover:text-sky-700 cursor-pointer"
          >
            <ExternalLink class="w-3.5 h-3.5 text-blue-600" />
            <span>Box liên kết (Link)</span>
          </button>
        </div>
      </div>

      <!-- 2. Customize Theme -->
      <button
        @click="openCustomizeTheme"
        class="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-gray-50 transition-colors text-left cursor-pointer"
      >
        <div class="w-5 flex justify-center text-emerald-600">
          <Palette class="w-4 h-4" />
        </div>
        <span>Customize Theme</span>
      </button>

      <!-- 3. Diagram Background with Submenu -->
      <div 
        class="relative group/sub"
        @mouseenter="showBgSubmenu = true"
        @mouseleave="showBgSubmenu = false"
      >
        <button
          class="w-full px-3.5 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors text-left cursor-pointer"
        >
          <div class="flex items-center gap-2.5">
            <div class="w-5 flex justify-center text-gray-500">
              <Paintbrush class="w-4 h-4" />
            </div>
            <span>Diagram Background</span>
          </div>
          <span class="text-gray-400 text-xs">›</span>
        </button>

        <!-- Submenu Background Colors -->
        <div
          v-if="showBgSubmenu"
          class="absolute left-full top-0 ml-1 bg-white rounded-xl shadow-xl border border-gray-200 p-2 min-w-[140px] z-50 flex flex-col gap-1"
        >
          <span class="text-[10px] text-gray-400 uppercase font-bold px-1">Màu nền</span>
          <div class="grid grid-cols-4 gap-1.5 py-1">
            <button
              v-for="c in ['#ffffff', '#f8fafc', '#f1f5f9', '#fef2f2', '#f0fdf4', '#eff6ff', '#faf5ff', '#1e293b']"
              :key="c"
              @click="setCanvasBg(c)"
              class="w-6 h-6 rounded-md border border-gray-300 hover:scale-110 transition-transform shadow-xs"
              :style="{ backgroundColor: c }"
            ></button>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="h-[1px] bg-gray-100 my-1"></div>

      <!-- 4. Fit diagram -->
      <button
        @click="fitDiagram"
        class="w-full px-3.5 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors text-left cursor-pointer"
      >
        <div class="flex items-center gap-2.5">
          <div class="w-5 flex justify-center text-gray-500">
            <Maximize2 class="w-4 h-4" />
          </div>
          <span>Fit diagram</span>
        </div>
        <span class="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
          F8
        </span>
      </button>

      <!-- 5. Export -->
      <button
        @click="exportDiagram"
        class="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-gray-50 transition-colors text-left cursor-pointer"
      >
        <div class="w-5 flex justify-center text-gray-500">
          <Upload class="w-4 h-4" />
        </div>
        <span>Export</span>
      </button>

      <!-- 6. Print -->
      <button
        @click="printDiagram"
        class="w-full px-3.5 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors text-left cursor-pointer"
      >
        <div class="flex items-center gap-2.5">
          <div class="w-5 flex justify-center text-gray-500">
            <Printer class="w-4 h-4" />
          </div>
          <span>Print</span>
        </div>
        <span class="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
          CTRL+P
        </span>
      </button>
    </div>

    <!-- Shortcut hints badge on bottom-left -->
    <div class="absolute bottom-4 left-4 bg-white/80 backdrop-blur-xs border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm flex items-center gap-3 text-[11px] text-gray-500 pointer-events-none select-none z-30">
      <div><span class="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded font-mono font-semibold text-gray-700">Ctrl + Rê chuột</span> Bôi đen chọn nhiều</div>
      <div class="h-3 w-[1px] bg-gray-200"></div>
      <div><span class="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded font-mono font-semibold text-gray-700">Ctrl + Click</span> Chọn ngẫu nhiên</div>
    </div>

    <!-- Bottom Controls -->
    <div class="absolute bottom-4 right-4 bg-white/90 backdrop-blur-xs border border-gray-200 rounded-xl shadow-md p-1 flex items-center space-x-1 select-none z-30">
      <button @click="zoom = Math.max(0.4, zoom - 0.1)" class="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded text-sm font-bold">-</button>
      <span class="text-xs font-semibold px-1 text-gray-700 w-12 text-center">{{ Math.round(zoom * 100) }}%</span>
      <button @click="zoom = Math.min(2.0, zoom + 0.1)" class="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded text-sm font-bold">+</button>
      <button @click="zoom = 1; pan = { x: 40, y: -40 }" class="text-xs text-gray-500 hover:text-gray-800 px-2 py-0.5 hover:bg-gray-100 rounded font-medium">Reset</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { 
  store, selectNode, deselectAll, updateNodePosition, moveSelectedNodes, updateNodeLabel, 
  addNodeNearSelected, addFloatingTopic, addNodeWithType, changeNodeType, updateNodeProps,
  deleteSelectedNode, duplicateSelectedNode, 
  toggleTaskComplete, undo, redo, saveToAPI, selectEdge, 
  relationCustomizerState, closeRelationCustomizer, updateEdgeControlPoint, 
  updateEdgeProps, selectNodesInBox, deleteEdge, exportToJSON
} from '../store/mindmapStore.js'
import RelationCustomizer from './RelationCustomizer.vue'
import NodeEditorModal from './NodeEditorModal.vue'
import { 
  Plus, FileText, Smile, CheckSquare, GitBranch, Trash2, Copy,
  Palette, Paintbrush, Maximize2, Upload, Printer,
  Type, Image as ImageIcon, Video, CreditCard, ExternalLink,
  Sliders, LayoutGrid
} from 'lucide-vue-next'

const boardRef = ref(null)
const zoom = ref(1.0)
const pan = ref({ x: 40, y: -40 })

// Type Switcher & Node Editor Modal state
const showTypeSwitcher = ref(false)
const isNodeEditorOpen = ref(false)
const editingNode = ref(null)
const showCreateSubmenu = ref(false)

const typeOptions = [
  { value: 'topic', label: 'Topic thường', icon: Type },
  { value: 'text', label: 'Box văn bản', icon: FileText },
  { value: 'image', label: 'Box ảnh', icon: ImageIcon },
  { value: 'video', label: 'Box video', icon: Video },
  { value: 'card', label: 'Card thông tin', icon: CreditCard },
  { value: 'link', label: 'Liên kết Web', icon: ExternalLink }
]

// Canvas Context Menu (Chuột phải trên canvas Mindomo)
const canvasContextMenu = reactive({
  isOpen: false,
  x: 0,
  y: 0,
  canvasX: 0,
  canvasY: 0
})
const showBgSubmenu = ref(false)
const canvasBgColor = ref('#ffffff')

// Marquee / Bôi đen chọn nhiều
const isMarqueeSelecting = ref(false)
const marqueeStart = ref({ clientX: 0, clientY: 0, canvasX: 0, canvasY: 0 })
const marqueeCurrent = ref({ clientX: 0, clientY: 0, canvasX: 0, canvasY: 0 })

const marqueeBoxStyle = computed(() => {
  if (!isMarqueeSelecting.value) return null
  const left = Math.min(marqueeStart.value.clientX, marqueeCurrent.value.clientX)
  const top = Math.min(marqueeStart.value.clientY, marqueeCurrent.value.clientY)
  const width = Math.abs(marqueeCurrent.value.clientX - marqueeStart.value.clientX)
  const height = Math.abs(marqueeCurrent.value.clientY - marqueeStart.value.clientY)
  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`
  }
})

const isDraggingCanvas = ref(false)
const dragCanvasStart = ref({ x: 0, y: 0 })

const draggingNode = ref(null)
const dragStartMouse = { clientX: 0, clientY: 0 }
const initialNodePositions = new Map()

const draggingControlPoint = ref(null) // { edgeId, cpIndex }

const editingId = ref(null)
const editLabel = ref('')

const editingLabelEdgeId = ref(null)
const editLabelText = ref('')

const connectingSource = ref(null)
const currentMousePos = ref(null)

const selectedNode = computed(() => {
  return store.graph.nodes.find(n => n.id === store.graph.selectedNodeId)
})

const selectedCount = computed(() => {
  return store.graph.nodes.filter(n => n.selected).length
})

function getStrokeDasharray(style) {
  if (style === 'solid') return 'none'
  if (style === 'dotted') return '2,4'
  if (style === 'long-dash') return '10,4'
  return '5,4'
}

function getNodeDimensions(node) {
  if (!node) return { width: 100, height: 36 }
  switch (node.type) {
    case 'text':
      return { width: 220, height: 110 }
    case 'image':
      return { width: 220, height: 160 }
    case 'video':
      return { width: 260, height: 180 }
    case 'card': {
      const fieldCount = (node.fields && node.fields.length) || 0
      return { width: 240, height: Math.max(90, 80 + fieldCount * 22) }
    }
    case 'link':
      return { width: 220, height: 60 }
    default: // topic
      return { width: 110, height: 36 }
  }
}

function formatDomain(url) {
  if (!url) return ''
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
    return parsed.hostname
  } catch (e) {
    return url
  }
}

function openLink(url) {
  if (!url) return
  const targetUrl = url.startsWith('http') ? url : `https://${url}`
  window.open(targetUrl, '_blank')
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

function openNodeEditor(node) {
  editingNode.value = node || selectedNode.value
  isNodeEditorOpen.value = true
  showTypeSwitcher.value = false
}

function closeNodeEditor() {
  isNodeEditorOpen.value = false
  editingNode.value = null
}

function handleNodeTypeChange(type) {
  if (selectedNode.value) {
    changeNodeType(selectedNode.value.id, type)
    showTypeSwitcher.value = false
  }
}

// Calculate paths with full shapes & control points
const edgePaths = computed(() => {
  const nodeMap = new Map(store.graph.nodes.map(n => [n.id, n]))
  return store.graph.edges.map(edge => {
    const s = nodeMap.get(edge.source)
    const t = nodeMap.get(edge.target)
    if (!s || !t) return null

    const sDim = getNodeDimensions(s)
    const tDim = getNodeDimensions(t)

    const sx = s.x + sDim.width
    const sy = s.y + sDim.height / 2
    const tx = t.x
    const ty = t.y + tDim.height / 2

    let d = ''
    let midX = (sx + tx) / 2
    let midY = (sy + ty) / 2

    // Control points
    let cp1x = edge.cp1 ? edge.cp1.x : (sx + (tx - sx) * 0.5)
    let cp1y = edge.cp1 ? edge.cp1.y : sy
    let cp2x = edge.cp2 ? edge.cp2.x : (tx - (tx - sx) * 0.5)
    let cp2y = edge.cp2 ? edge.cp2.y : ty

    const shape = edge.shape || 'curved'

    if (edge.arc) {
      midY = Math.max(sy, ty) + 140
      if (!edge.cp1) { cp1x = sx - 100; cp1y = midY }
      if (!edge.cp2) { cp2x = tx + 100; cp2y = midY }
      d = `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tx + 20} ${ty + 20}`
      midX = (sx + tx) / 2
    } else if (shape === 'straight') {
      d = `M ${sx} ${sy} L ${tx} ${ty}`
    } else if (shape === 'angled') {
      d = `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ty} L ${tx} ${ty}`
    } else if (shape === 'step') {
      d = `M ${sx} ${sy} L ${midX} ${sy} L ${tx} ${ty}`
    } else if (shape === 'wave') {
      d = `M ${sx} ${sy} Q ${cp1x} ${cp1y}, ${midX} ${midY} T ${tx} ${ty}`
    } else {
      // Curved Bézier (Default Mindomo)
      d = `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tx} ${ty}`
      midX = (cp1x + cp2x) / 2
      midY = (cp1y + cp2y) / 2
    }

    return {
      ...edge,
      d,
      sx,
      sy,
      tx,
      ty,
      cp1x,
      cp1y,
      cp2x,
      cp2y,
      midX,
      midY
    }
  }).filter(Boolean)
})

function onEdgeClick(edgeId, event) {
  store.graph.selectedNodeId = null
  store.graph.nodes.forEach(n => { n.selected = false })
  selectEdge(edgeId, event)
}

function openLabelCustomizer(edgeId, event) {
  selectEdge(edgeId, event)
  relationCustomizerState.activeTab = 'text'
}

function startEditEdgeLabel(edge) {
  editingLabelEdgeId.value = edge.id
  editLabelText.value = edge.label
}

function saveEdgeLabel(edgeId) {
  if (editingLabelEdgeId.value) {
    updateEdgeProps(edgeId, { label: editLabelText.value })
    editingLabelEdgeId.value = null
  }
}

function startDragControlPoint(edgeId, cpIndex, event) {
  draggingControlPoint.value = { edgeId, cpIndex }
}

function onNodeClick(node, event) {
  closeRelationCustomizer()
  if (connectingSource.value) {
    if (connectingSource.value.id !== node.id) {
      store.graph.edges.push({
        id: 'e_' + Date.now().toString(36),
        source: connectingSource.value.id,
        target: node.id,
        color: connectingSource.value.border || '#0284c7',
        style: 'dashed',
        shape: 'curved',
        strokeWidth: 2,
        arrow: 'target'
      })
      saveToAPI()
    }
    connectingSource.value = null
    currentMousePos.value = null
    return
  }

  // If Ctrl/Cmd is pressed, startDragNode (mousedown) already toggled the selection!
  // Do NOT toggle again on click, otherwise true -> false!
  const isCtrl = event?.ctrlKey || event?.metaKey
  if (!isCtrl) {
    selectNode(node.id, false)
  }
}

function startConnect(node) {
  connectingSource.value = node
}

function onCanvasMouseDown(e) {
  closeCanvasContextMenu()

  if (connectingSource.value) {
    connectingSource.value = null
    currentMousePos.value = null
    return
  }

  const isCtrl = e.ctrlKey || e.metaKey

  if (isCtrl) {
    // CHỌN NHIỀU: BÔI ĐEN (Ctrl + rê chuột)
    const boardRect = boardRef.value?.getBoundingClientRect() || { left: 0, top: 0 }
    const cX = e.clientX - boardRect.left
    const cY = e.clientY - boardRect.top
    const canvasX = (cX - pan.value.x) / zoom.value
    const canvasY = (cY - pan.value.y) / zoom.value

    isMarqueeSelecting.value = true
    marqueeStart.value = { clientX: cX, clientY: cY, canvasX, canvasY }
    marqueeCurrent.value = { clientX: cX, clientY: cY, canvasX, canvasY }
    closeRelationCustomizer()
    editingLabelEdgeId.value = null
  } else {
    // Click outside -> dismiss all and start pan
    deselectAll()
    editingLabelEdgeId.value = null
    isDraggingCanvas.value = true
    dragCanvasStart.value = { x: e.clientX - pan.value.x, y: e.clientY - pan.value.y }
  }
}

function startDragNode(node, e) {
  closeRelationCustomizer()
  const isCtrl = e.ctrlKey || e.metaKey

  if (isCtrl) {
    // Ctrl + click on node toggles selection without initiating drag immediately
    selectNode(node.id, true)
    return
  }

  // If node is already part of a multi-selection, keep multi-selection active
  if (!node.selected) {
    selectNode(node.id, false)
  }

  draggingNode.value = node
  dragStartMouse.clientX = e.clientX
  dragStartMouse.clientY = e.clientY

  initialNodePositions.clear()
  const selectedNodes = store.graph.nodes.filter(n => n.selected)
  if (selectedNodes.length > 1) {
    selectedNodes.forEach(n => {
      initialNodePositions.set(n.id, { x: n.x, y: n.y })
    })
  } else {
    initialNodePositions.set(node.id, { x: node.x, y: node.y })
  }
}

function onMouseMove(e) {
  if (isMarqueeSelecting.value) {
    const boardRect = boardRef.value?.getBoundingClientRect() || { left: 0, top: 0 }
    const cX = e.clientX - boardRect.left
    const cY = e.clientY - boardRect.top
    const canvasX = (cX - pan.value.x) / zoom.value
    const canvasY = (cY - pan.value.y) / zoom.value

    marqueeCurrent.value = { clientX: cX, clientY: cY, canvasX, canvasY }

    // Realtime update selected nodes in box
    const box = {
      left: Math.min(marqueeStart.value.canvasX, canvasX),
      right: Math.max(marqueeStart.value.canvasX, canvasX),
      top: Math.min(marqueeStart.value.canvasY, canvasY),
      bottom: Math.max(marqueeStart.value.canvasY, canvasY)
    }
    selectNodesInBox(box, false)
    return
  }

  if (draggingControlPoint.value) {
    const canvasX = (e.clientX - pan.value.x) / zoom.value
    const canvasY = (e.clientY - pan.value.y) / zoom.value
    updateEdgeControlPoint(
      draggingControlPoint.value.edgeId,
      draggingControlPoint.value.cpIndex,
      canvasX,
      canvasY
    )
    return
  }

  if (connectingSource.value) {
    currentMousePos.value = {
      x: (e.clientX - pan.value.x) / zoom.value,
      y: (e.clientY - pan.value.y) / zoom.value
    }
    return
  }

  if (draggingNode.value) {
    const dx = (e.clientX - dragStartMouse.clientX) / zoom.value
    const dy = (e.clientY - dragStartMouse.clientY) / zoom.value

    initialNodePositions.forEach((initPos, id) => {
      const n = store.graph.nodes.find(node => node.id === id)
      if (n) {
        n.x = Math.round(initPos.x + dx)
        n.y = Math.round(initPos.y + dy)
      }
    })
  } 
  else if (isDraggingCanvas.value) {
    pan.value = {
      x: e.clientX - dragCanvasStart.value.x,
      y: e.clientY - dragCanvasStart.value.y
    }
  }
}

function onMouseUp() {
  if (isMarqueeSelecting.value) {
    isMarqueeSelecting.value = false
  }

  if (draggingControlPoint.value) {
    saveToAPI()
    draggingControlPoint.value = null
  }

  if (draggingNode.value) {
    saveToAPI()
    draggingNode.value = null
    initialNodePositions.clear()
  }

  isDraggingCanvas.value = false
}

function startEdit(node) {
  editingId.value = node.id
  editLabel.value = node.label
}

function saveEdit(id) {
  if (editingId.value) {
    updateNodeLabel(id, editLabel.value)
    editingId.value = null
  }
}

function openNotePrompt() {
  if (!selectedNode.value) return
  const note = prompt('Nhập ghi chú cho node này:', selectedNode.value.note || '')
  if (note !== null) {
    selectedNode.value.note = note
    saveToAPI()
  }
}

function addEmoji() {
  if (!selectedNode.value) return
  const emojis = ['🚀', '🎯', '💡', '🔥', '⭐', '🚩', '✅']
  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]
  updateNodeLabel(selectedNode.value.id, `${randomEmoji} ${selectedNode.value.label}`)
}

// CONTEXT MENU HANDLERS (Mindomo Right-Click & Floating Topic)
function onCanvasContextMenu(e) {
  closeRelationCustomizer()
  const boardRect = boardRef.value?.getBoundingClientRect() || { left: 0, top: 0 }
  const clickX = e.clientX - boardRect.left
  const clickY = e.clientY - boardRect.top

  // Calculate canvas coordinates taking zoom and pan into account
  const canvasX = (clickX - pan.value.x) / zoom.value
  const canvasY = (clickY - pan.value.y) / zoom.value

  // Prevent menu overflow outside screen
  const menuWidth = 260
  const menuHeight = 280
  const posX = (clickX + menuWidth > boardRect.width) ? (clickX - menuWidth) : clickX
  const posY = (clickY + menuHeight > boardRect.height) ? (clickY - menuHeight) : clickY

  canvasContextMenu.x = posX
  canvasContextMenu.y = posY
  canvasContextMenu.canvasX = canvasX
  canvasContextMenu.canvasY = canvasY
  canvasContextMenu.isOpen = true
  showBgSubmenu.value = false
}

function closeCanvasContextMenu() {
  canvasContextMenu.isOpen = false
  showBgSubmenu.value = false
  showCreateSubmenu.value = false
}

function createFloatingTopicFromContextMenu() {
  createTypedNodeFromContextMenu('topic')
}

function createTypedNodeFromContextMenu(type) {
  const x = canvasContextMenu.canvasX
  const y = canvasContextMenu.canvasY
  closeCanvasContextMenu()
  addNodeWithType(x, y, type)
}

// CTRL + 2xCLICK shortcut on canvas to create floating topic (Mindomo feature)
function onCanvasDblClick(e) {
  if (e.ctrlKey || e.metaKey) {
    const boardRect = boardRef.value?.getBoundingClientRect() || { left: 0, top: 0 }
    const clickX = e.clientX - boardRect.left
    const clickY = e.clientY - boardRect.top
    const canvasX = (clickX - pan.value.x) / zoom.value
    const canvasY = (clickY - pan.value.y) / zoom.value
    addFloatingTopic(canvasX, canvasY, 'Floating Topic')
  }
}

function openCustomizeTheme() {
  closeCanvasContextMenu()
  store.showColorPicker = true
}

function setCanvasBg(colorHex) {
  canvasBgColor.value = colorHex
  closeCanvasContextMenu()
}

function fitDiagram() {
  closeCanvasContextMenu()
  if (store.graph.nodes.length === 0) return
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  store.graph.nodes.forEach(n => {
    minX = Math.min(minX, n.x)
    maxX = Math.max(maxX, n.x + 120)
    minY = Math.min(minY, n.y)
    maxY = Math.max(maxY, n.y + 40)
  })
  const boardRect = boardRef.value?.getBoundingClientRect() || { width: 1000, height: 700 }
  const padding = 80
  const graphW = maxX - minX + padding * 2
  const graphH = maxY - minY + padding * 2
  const scale = Math.min(1.5, Math.max(0.4, Math.min(boardRect.width / graphW, boardRect.height / graphH)))
  zoom.value = Number(scale.toFixed(2))
  pan.value = {
    x: Math.round((boardRect.width - graphW * scale) / 2 - minX * scale + padding * scale),
    y: Math.round((boardRect.height - graphH * scale) / 2 - minY * scale + padding * scale)
  }
}

function exportDiagram() {
  closeCanvasContextMenu()
  exportToJSON()
}

function printDiagram() {
  closeCanvasContextMenu()
  window.print()
}

function onKeyDown(e) {
  if (editingId.value || editingLabelEdgeId.value) return

  if (e.key === 'Escape') {
    closeCanvasContextMenu()
  }
  else if (e.key === 'F8') {
    e.preventDefault()
    fitDiagram()
  }
  else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
    e.preventDefault()
    printDiagram()
  }
  else if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault()
    if (relationCustomizerState.edgeId) {
      deleteEdge(relationCustomizerState.edgeId)
    } else {
      deleteSelectedNode()
    }
  }
  else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
    e.preventDefault()
    store.graph.nodes.forEach(n => { n.selected = true })
    if (store.graph.nodes.length > 0) {
      store.graph.selectedNodeId = store.graph.nodes[0].id
    }
  }
  else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
    e.preventDefault()
    duplicateSelectedNode()
  }
  else if (e.key === 'Tab' || e.key === 'Enter') {
    e.preventDefault()
    addNodeNearSelected()
  }
  else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    saveToAPI()
  }
  else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault()
    undo()
  }
  else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
    e.preventDefault()
    redo()
  }
}
</script>
