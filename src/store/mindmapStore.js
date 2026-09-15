import { reactive } from 'vue'

const DEFAULT_MAP_ID = 'assitand_default'

export const store = reactive({
  activeTab: 'mindmap', // 'mindmap' | 'outline' | 'gantt'
  currentMapId: DEFAULT_MAP_ID,
  isSaving: false,
  lastSaved: null,
  mapList: [],
  
  graph: {
    title: 'Assitand',
    selectedNodeId: 'assitand',
    nodes: [
      { id: 'assitand', label: 'Assitand', color: '#f87171', border: '#ef4444', x: 120, y: 350, selected: true },
      { id: 'biz', label: 'Biz', color: '#10b981', border: '#059669', x: 380, y: 190 },
      { id: 'hr', label: 'HR', color: '#f59e0b', border: '#d97706', x: 380, y: 350 },
      { id: 'fin', label: 'Fin', color: '#ec4899', border: '#db2777', x: 380, y: 490 },
      { id: 'cooker', label: 'Cooker', color: '#34d399', border: '#10b981', x: 570, y: 200 },
      { id: 'marketer', label: 'Marketer', color: '#38bdf8', border: '#0284c7', x: 640, y: 290 },
      { id: 'seller', label: 'Seller', color: '#c084fc', border: '#9333ea', x: 710, y: 390 },
      { id: 'operator', label: 'Operator', color: '#f87171', border: '#e11d48', x: 780, y: 520 },
      { id: 'customer', label: 'Customer', color: '#a16207', border: '#78350f', x: 920, y: 380 }
    ],
    edges: [
      { id: 'e1', source: 'assitand', target: 'biz', color: '#10b981', style: 'dashed' },
      { id: 'e2', source: 'assitand', target: 'hr', color: '#f59e0b', style: 'dashed' },
      { id: 'e3', source: 'assitand', target: 'fin', color: '#ec4899', style: 'dashed' },
      { id: 'e4', source: 'biz', target: 'cooker', color: '#10b981', style: 'dashed' },
      { id: 'e5', source: 'biz', target: 'marketer', color: '#0284c7', style: 'dashed' },
      { id: 'e6', source: 'hr', target: 'marketer', color: '#f59e0b', style: 'dashed' },
      { id: 'e7', source: 'hr', target: 'seller', color: '#f59e0b', style: 'dashed' },
      { id: 'e8', source: 'hr', target: 'operator', color: '#f59e0b', style: 'dashed' },
      { id: 'e9', source: 'fin', target: 'seller', color: '#ec4899', style: 'dashed' },
      { id: 'e10', source: 'fin', target: 'operator', color: '#ec4899', style: 'dashed' },
      { id: 'e11', source: 'cooker', target: 'customer', color: '#10b981', style: 'dashed' },
      { id: 'e12', source: 'marketer', target: 'customer', color: '#0284c7', style: 'dashed' },
      { id: 'e13', source: 'seller', target: 'customer', color: '#9333ea', style: 'dashed' },
      { id: 'e14', source: 'operator', target: 'customer', color: '#ef4444', style: 'dashed' },
      { id: 'e15', source: 'customer', target: 'assitand', color: '#78350f', style: 'solid', strokeWidth: 3, arc: -120 }
    ]
  },

  // Modal states
  showColorPicker: false,
  showNotesModal: false,
  activeNoteText: '',
  datePickerState: {
    isOpen: false,
    nodeId: null,
    field: null,
    currentDate: '2026-07-01',
    posX: 0,
    posY: 0
  }
})

// UNDO / REDO HISTORY
const undoStack = []
const redoStack = []

function snapshot() {
  if (undoStack.length > 30) undoStack.shift()
  undoStack.push(JSON.stringify(store.graph))
  redoStack.length = 0
}

export function undo() {
  if (undoStack.length === 0) return
  redoStack.push(JSON.stringify(store.graph))
  const previous = JSON.parse(undoStack.pop())
  store.graph = previous
}

export function redo() {
  if (redoStack.length === 0) return
  undoStack.push(JSON.stringify(store.graph))
  const next = JSON.parse(redoStack.pop())
  store.graph = next
}

// 1. SELECT NODE & MULTI-SELECTION
export function selectNode(id, isMulti = false) {
  if (isMulti) {
    // Ctrl + Click: toggle random/multiple selection
    const target = store.graph.nodes.find(n => n.id === id)
    if (target) {
      target.selected = !target.selected
      if (target.selected) {
        store.graph.selectedNodeId = id
      } else {
        const remaining = store.graph.nodes.find(n => n.selected)
        store.graph.selectedNodeId = remaining ? remaining.id : null
      }
    }
  } else {
    // Single select
    store.graph.selectedNodeId = id
    store.graph.nodes.forEach(n => {
      n.selected = n.id === id
    })
  }
}

export function toggleNodeSelection(id) {
  selectNode(id, true)
}

export function selectNodesInBox(box, additive = false) {
  // box: { left, top, right, bottom } in canvas coordinates
  // Node is selected if its center or bounds intersect with the box
  let firstSelectedId = null
  store.graph.nodes.forEach(n => {
    // Approximate node bounding box (width ~ 100, height ~ 36)
    const nodeLeft = n.x
    const nodeTop = n.y
    const nodeRight = n.x + 100
    const nodeBottom = n.y + 36

    const intersects = !(
      nodeRight < box.left ||
      nodeLeft > box.right ||
      nodeBottom < box.top ||
      nodeTop > box.bottom
    )

    if (intersects) {
      n.selected = true
      if (!firstSelectedId) firstSelectedId = n.id
    } else if (!additive) {
      n.selected = false
    }
  })

  const anySelected = store.graph.nodes.find(n => n.selected)
  store.graph.selectedNodeId = anySelected ? anySelected.id : null
}

export function getSelectedNodes() {
  return store.graph.nodes.filter(n => n.selected)
}

// 2. TẠO (CREATE)
export function addFloatingTopic(x, y, label = 'Floating Topic') {
  snapshot()
  const newId = 'node_' + Date.now().toString(36)
  const colors = [
    { color: '#38bdf8', border: '#0284c7' },
    { color: '#10b981', border: '#059669' },
    { color: '#f59e0b', border: '#d97706' },
    { color: '#ec4899', border: '#db2777' },
    { color: '#a855f7', border: '#7e22ce' }
  ]
  const randomColor = colors[Math.floor(Math.random() * colors.length)]

  const newNode = {
    id: newId,
    label: label,
    color: randomColor.color,
    border: randomColor.border,
    x: Math.round(x),
    y: Math.round(y),
    selected: true
  }

  store.graph.nodes.push(newNode)
  selectNode(newId)
  autoSave()
  return newNode
}

export function addNodeNearSelected() {
  snapshot()
  const selected = store.graph.nodes.find(n => n.id === store.graph.selectedNodeId)
  const baseNode = selected || store.graph.nodes[0]
  const newId = 'node_' + Date.now().toString(36)
  
  const colors = [
    { color: '#38bdf8', border: '#0284c7' },
    { color: '#10b981', border: '#059669' },
    { color: '#f59e0b', border: '#d97706' },
    { color: '#ec4899', border: '#db2777' },
    { color: '#a855f7', border: '#7e22ce' }
  ]
  const randomColor = colors[Math.floor(Math.random() * colors.length)]

  const newNode = {
    id: newId,
    label: 'New Topic',
    color: randomColor.color,
    border: randomColor.border,
    x: baseNode.x + 180,
    y: baseNode.y + (Math.random() * 80 - 40),
    selected: true
  }

  store.graph.nodes.push(newNode)
  store.graph.edges.push({
    id: 'e_' + Date.now().toString(36),
    source: baseNode.id,
    target: newId,
    color: randomColor.border,
    style: 'dashed'
  })

  selectNode(newId)
  autoSave()
}

// 3. SỬA (EDIT)
export function updateNodePosition(id, x, y) {
  const node = store.graph.nodes.find(n => n.id === id)
  if (node) {
    node.x = x
    node.y = y
  }
}

export function moveSelectedNodes(deltaX, deltaY) {
  store.graph.nodes.forEach(n => {
    if (n.selected) {
      n.x += deltaX
      n.y += deltaY
    }
  })
}

export function updateNodeLabel(id, newLabel) {
  snapshot()
  const node = store.graph.nodes.find(n => n.id === id)
  if (node) {
    node.label = newLabel
    autoSave()
  }
}

export function updateNodeColor(id, borderHex, colorHex) {
  snapshot()
  const selectedNodes = store.graph.nodes.filter(n => n.selected)
  if (selectedNodes.length > 1) {
    // Apply color to all selected nodes
    selectedNodes.forEach(n => {
      n.border = borderHex
      n.color = colorHex || borderHex
      store.graph.edges.forEach(e => {
        if (e.source === n.id) e.color = borderHex
      })
    })
  } else {
    const node = store.graph.nodes.find(n => n.id === id)
    if (node) {
      node.border = borderHex
      node.color = colorHex || borderHex
      store.graph.edges.forEach(e => {
        if (e.source === id) e.color = borderHex
      })
    }
  }
  autoSave()
}

export function toggleTaskComplete(id) {
  snapshot()
  const node = store.graph.nodes.find(n => n.id === id)
  if (node) {
    node.completed = !node.completed
    autoSave()
  }
}

// 4. XÓA (DELETE - Support single or multiple nodes)
export function deleteSelectedNode() {
  const selectedNodes = store.graph.nodes.filter(n => n.selected)
  if (selectedNodes.length === 0) {
    const id = store.graph.selectedNodeId
    if (!id || id === 'assitand') return
    selectedNodes.push(store.graph.nodes.find(n => n.id === id))
  }
  
  // Filter out assitand root if user wants to keep root, or delete
  const deleteIds = new Set(selectedNodes.map(n => n.id).filter(id => id !== 'assitand'))
  if (deleteIds.size === 0) return

  snapshot()
  store.graph.nodes = store.graph.nodes.filter(n => !deleteIds.has(n.id))
  store.graph.edges = store.graph.edges.filter(e => !deleteIds.has(e.source) && !deleteIds.has(e.target))
  
  const remaining = store.graph.nodes[0]
  if (remaining) {
    selectNode(remaining.id)
  } else {
    store.graph.selectedNodeId = null
  }
  autoSave()
}

export function clearMap() {
  snapshot()
  store.graph.nodes = [
    { id: 'root', label: 'Main Topic', color: '#f87171', border: '#ef4444', x: 200, y: 300, selected: true }
  ]
  store.graph.edges = []
  selectNode('root')
  autoSave()
}

// 5. NHÂN BẢN (DUPLICATE - Support single or multiple)
export function duplicateSelectedNode() {
  const selectedNodes = store.graph.nodes.filter(n => n.selected)
  if (selectedNodes.length === 0) return
  snapshot()

  const idMap = new Map()
  const newNodes = []

  selectedNodes.forEach(node => {
    const copyId = 'copy_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 3)
    idMap.set(node.id, copyId)
    const newNode = {
      ...JSON.parse(JSON.stringify(node)),
      id: copyId,
      label: node.label + ' (Copy)',
      x: node.x + 40,
      y: node.y + 40,
      selected: true
    }
    newNodes.push(newNode)
    node.selected = false
  })

  // Duplicate internal connections between selected nodes
  selectedNodes.forEach(node => {
    const internalEdges = store.graph.edges.filter(e => e.source === node.id && idMap.has(e.target))
    internalEdges.forEach(e => {
      store.graph.edges.push({
        ...e,
        id: 'e_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
        source: idMap.get(e.source),
        target: idMap.get(e.target)
      })
    })
  })

  store.graph.nodes.push(...newNodes)
  if (newNodes.length > 0) {
    store.graph.selectedNodeId = newNodes[0].id
  }
  autoSave()
}

// 6. SAO LƯU & KHÔI PHỤC (BACKUP / EXPORT / IMPORT)
export function exportToJSON() {
  const dataStr = JSON.stringify(store.graph, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${store.graph.title || 'mindmap'}_backup.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importFromJSON(fileContent) {
  try {
    const parsed = JSON.parse(fileContent)
    if (parsed.nodes && Array.isArray(parsed.nodes)) {
      snapshot()
      store.graph = parsed
      if (store.graph.nodes.length > 0) {
        selectNode(store.graph.nodes[0].id)
      }
      autoSave()
      return { success: true }
    }
    return { success: false, message: 'Invalid format: missing nodes array' }
  } catch (e) {
    return { success: false, message: e.message }
  }
}

// 7. REST API INTEGRATION
export async function saveToAPI() {
  store.isSaving = true
  try {
    const res = await fetch(`/api/maps/${store.currentMapId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(store.graph)
    })
    const json = await res.json()
    if (json.success) {
      store.lastSaved = new Date().toLocaleTimeString()
    }
  } catch (err) {
    console.warn('API save error (fallback to local):', err)
    localStorage.setItem(`mindmap_${store.currentMapId}`, JSON.stringify(store.graph))
    store.lastSaved = new Date().toLocaleTimeString() + ' (Local)'
  } finally {
    store.isSaving = false
  }
}

export async function fetchMapsList() {
  try {
    const res = await fetch('/api/maps')
    const json = await res.json()
    if (json.success) {
      store.mapList = json.data
    }
  } catch (err) {
    console.warn('Fetch maps error:', err)
  }
}

export async function createNewMapOnAPI(title = 'New Mind Map') {
  try {
    const res = await fetch('/api/maps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    })
    const json = await res.json()
    if (json.success) {
      store.currentMapId = json.data.id
      store.graph = json.data
      fetchMapsList()
    }
  } catch (err) {
    console.error('Create map error:', err)
  }
}

let saveTimeout = null
function autoSave() {
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    saveToAPI()
  }, 1000)
}

// Outline & Gantt Helpers
export function updateNodeTitle(id, newTitle) {
  updateNodeLabel(id, newTitle)
}

export function toggleNodeCollapse() {}

export function setTaskDate(id, field, dateStr) {
  const node = store.graph.nodes.find(n => n.id === id)
  if (node) {
    node[field] = dateStr
    autoSave()
  }
}

export function getFlatNodes() {
  return store.graph.nodes.map((n, idx) => ({
    ...n,
    title: n.label,
    index: idx + 1,
    depth: n.id === 'assitand' ? 0 : (['biz', 'hr', 'fin'].includes(n.id) ? 1 : 2),
    effectiveColor: n.border,
    startDate: n.startDate || ('2026-07-0' + Math.min(9, idx + 1)),
    endDate: n.endDate || ('2026-07-1' + Math.min(9, idx + 2)),
    progress: (idx + 1) * 10
  }))
}

// RELATION CUSTOMIZATION STATE & ACTIONS
export const relationCustomizerState = reactive({
  isOpen: false,
  edgeId: null,
  activeTab: 'line', // 'line' | 'text' | 'format'
  posX: 400,
  posY: 200
})

export function selectEdge(edgeId, event = null) {
  relationCustomizerState.edgeId = edgeId
  relationCustomizerState.isOpen = true
  if (event) {
    relationCustomizerState.posX = Math.min(window.innerWidth - 320, Math.max(20, event.clientX - 140))
    relationCustomizerState.posY = Math.min(window.innerHeight - 450, Math.max(60, event.clientY - 200))
  }
}

export function closeRelationCustomizer() {
  relationCustomizerState.isOpen = false
  relationCustomizerState.edgeId = null
}

export function updateEdgeProps(edgeId, props) {
  const edge = store.graph.edges.find(e => e.id === edgeId)
  if (edge) {
    Object.assign(edge, props)
    saveToAPI()
  }
}

export function deleteEdge(edgeId) {
  store.graph.edges = store.graph.edges.filter(e => e.id !== edgeId)
  closeRelationCustomizer()
  saveToAPI()
}

export function resetEdge(edgeId) {
  const edge = store.graph.edges.find(e => e.id === edgeId)
  if (edge) {
    edge.style = 'dashed'
    edge.shape = 'curved'
    edge.strokeWidth = 2
    edge.arrow = 'target'
    edge.curvature = 0
    saveToAPI()
  }
}

export function deselectAll() {
  store.graph.selectedNodeId = null
  store.graph.nodes.forEach(n => {
    n.selected = false
  })
  closeRelationCustomizer()
}

export function updateEdgeControlPoint(edgeId, cpIndex, x, y) {
  const edge = store.graph.edges.find(e => e.id === edgeId)
  if (edge) {
    if (cpIndex === 1) {
      edge.cp1 = { x: Math.round(x), y: Math.round(y) }
    } else if (cpIndex === 2) {
      edge.cp2 = { x: Math.round(x), y: Math.round(y) }
    }
  }
}

// DASHBOARD & JSON CODE EDITOR STATE & METHODS
export const dashboardState = reactive({
  isOpen: false,
  searchQuery: '',
  showJsonModal: false,
  jsonModalMode: 'edit', // 'edit' | 'create'
  jsonModalMapId: null,
  jsonContent: '',
  jsonError: ''
})

export function openDashboard() {
  dashboardState.isOpen = true
  fetchMapsList()
}

export function closeDashboard() {
  dashboardState.isOpen = false
}

export async function openMap(id) {
  try {
    const res = await fetch(`/api/maps/${id}`)
    const json = await res.json()
    if (json.success) {
      store.currentMapId = id
      store.graph = json.data
      closeDashboard()
    }
  } catch (err) {
    console.error('Open map error:', err)
  }
}

export async function deleteMapFromDashboard(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa dự án này?')) return
  try {
    const res = await fetch(`/api/maps/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.success) {
      fetchMapsList()
      if (store.currentMapId === id) {
        // Switch to default map if available
        if (store.mapList.length > 0) {
          openMap(store.mapList[0].id)
        }
      }
    }
  } catch (err) {
    console.error('Delete map error:', err)
  }
}

export async function duplicateMapFromDashboard(id) {
  try {
    const res = await fetch(`/api/maps/${id}/duplicate`, { method: 'POST' })
    const json = await res.json()
    if (json.success) {
      fetchMapsList()
    }
  } catch (err) {
    console.error('Duplicate map error:', err)
  }
}

export async function renameMapFromDashboard(id, currentTitle) {
  const newTitle = prompt('Nhập tên mới cho dự án:', currentTitle)
  if (!newTitle || newTitle === currentTitle) return
  try {
    const res = await fetch(`/api/maps/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle })
    })
    const json = await res.json()
    if (json.success) {
      if (store.currentMapId === id) {
        store.graph.title = newTitle
      }
      fetchMapsList()
    }
  } catch (err) {
    console.error('Rename map error:', err)
  }
}

export function exportSingleMapJSON(id) {
  fetch(`/api/maps/${id}`)
    .then(res => res.json())
    .then(json => {
      if (json.success) {
        const dataStr = JSON.stringify(json.data, null, 2)
        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${json.data.title || 'mindmap'}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    })
}

// JSON Code Editor Trigger
export async function openJsonEditorForMap(id = null) {
  const targetId = id || store.currentMapId
  dashboardState.jsonModalMapId = targetId
  dashboardState.jsonModalMode = 'edit'
  dashboardState.jsonError = ''

  try {
    const res = await fetch(`/api/maps/${targetId}`)
    const json = await res.json()
    if (json.success) {
      dashboardState.jsonContent = JSON.stringify(json.data, null, 2)
      dashboardState.showJsonModal = true
    }
  } catch (err) {
    console.error('Fetch map for JSON error:', err)
  }
}

export function openJsonEditorForNew() {
  dashboardState.jsonModalMapId = null
  dashboardState.jsonModalMode = 'create'
  dashboardState.jsonError = ''
  
  const template = {
    title: 'Dự án tạo từ JSON',
    nodes: [
      { id: 'node_1', label: 'Chủ đề chính', color: '#f87171', border: '#ef4444', x: 200, y: 300, selected: true },
      { id: 'node_2', label: 'Ý tưởng A', color: '#38bdf8', border: '#0284c7', x: 450, y: 220 },
      { id: 'node_3', label: 'Ý tưởng B', color: '#10b981', border: '#059669', x: 450, y: 380 }
    ],
    edges: [
      { id: 'e1', source: 'node_1', target: 'node_2', color: '#0284c7', style: 'dashed', label: 'nhánh 1' },
      { id: 'e2', source: 'node_1', target: 'node_3', color: '#059669', style: 'dashed', label: 'nhánh 2' }
    ]
  }

  dashboardState.jsonContent = JSON.stringify(template, null, 2)
  dashboardState.showJsonModal = true
}

export async function applyJsonEditor() {
  dashboardState.jsonError = ''
  try {
    const parsed = JSON.parse(dashboardState.jsonContent)
    if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
      dashboardState.jsonError = 'Lỗi cấu trúc: Bắt buộc phải có mảng "nodes"!'
      return false
    }

    if (dashboardState.jsonModalMode === 'create') {
      // POST new map
      const res = await fetch('/api/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      })
      const json = await res.json()
      if (json.success) {
        dashboardState.showJsonModal = false
        openMap(json.data.id)
        fetchMapsList()
      }
    } else {
      // PUT update map
      const res = await fetch(`/api/maps/${dashboardState.jsonModalMapId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      })
      const json = await res.json()
      if (json.success) {
        dashboardState.showJsonModal = false
        if (store.currentMapId === dashboardState.jsonModalMapId) {
          store.graph = json.data
        }
        fetchMapsList()
      }
    }
    return true
  } catch (err) {
    dashboardState.jsonError = 'Cú pháp JSON không hợp lệ: ' + err.message
    return false
  }
}
