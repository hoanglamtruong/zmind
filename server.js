import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001
const DATA_FILE = path.join(__dirname, 'data', 'maps.json')

app.use(cors())
app.use(express.json({ limit: '20mb' }))

const defaultMap = {
  id: 'map_default',
  title: 'Dự án mới',
  updatedAt: new Date().toISOString(),
  nodes: [
    { id: 'node_root', label: 'Chủ đề chính', color: '#38bdf8', border: '#0284c7', x: 400, y: 300, selected: true }
  ],
  edges: []
}

function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([defaultMap], null, 2), 'utf8')
      return [defaultMap]
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    console.error('Read data error:', err)
    return [defaultMap]
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')
    return true
  } catch (err) {
    console.error('Write data error:', err)
    return false
  }
}

// 1. GET /api/maps - Danh sách sơ đồ kèm thống kê chi tiết
app.get('/api/maps', (req, res) => {
  const maps = readData()
  res.json({
    success: true,
    data: maps.map(m => ({ 
      id: m.id, 
      title: m.title || 'Untitled Map', 
      updatedAt: m.updatedAt || new Date().toISOString(), 
      nodeCount: m.nodes?.length || 0,
      edgeCount: m.edges?.length || 0
    }))
  })
})

// 2. GET /api/maps/:id - Lấy chi tiết sơ đồ
app.get('/api/maps/:id', (req, res) => {
  const maps = readData()
  const map = maps.find(m => m.id === req.params.id)
  if (!map) {
    return res.status(404).json({ success: false, message: 'Map not found' })
  }
  res.json({ success: true, data: map })
})

// 3. POST /api/maps - Tạo mới sơ đồ (hoặc import từ JSON)
app.post('/api/maps', (req, res) => {
  const maps = readData()
  const newMap = {
    id: req.body.id || ('map_' + Date.now().toString(36)),
    title: req.body.title || 'Dự án mới',
    nodes: req.body.nodes || [{ id: 'root', label: 'Main Topic', color: '#f87171', border: '#ef4444', x: 200, y: 300, selected: true }],
    edges: req.body.edges || [],
    updatedAt: new Date().toISOString()
  }
  maps.push(newMap)
  writeData(maps)
  res.status(201).json({ success: true, data: newMap })
})

// 4. PUT /api/maps/:id - Sửa / Lưu sơ đồ (bao gồm cập nhật bằng JSON)
app.put('/api/maps/:id', (req, res) => {
  const maps = readData()
  const index = maps.findIndex(m => m.id === req.params.id)
  
  if (index === -1) {
    const createdMap = {
      id: req.params.id,
      title: req.body.title || 'Dự án mới',
      nodes: req.body.nodes || [],
      edges: req.body.edges || [],
      updatedAt: new Date().toISOString()
    }
    maps.push(createdMap)
    writeData(maps)
    return res.json({ success: true, data: createdMap })
  }

  maps[index] = {
    ...maps[index],
    ...req.body,
    id: req.params.id,
    updatedAt: new Date().toISOString()
  }
  writeData(maps)
  res.json({ success: true, data: maps[index] })
})

// 5. DELETE /api/maps/:id - Xóa sơ đồ
app.delete('/api/maps/:id', (req, res) => {
  let maps = readData()
  const exists = maps.some(m => m.id === req.params.id)
  if (!exists) {
    return res.status(404).json({ success: false, message: 'Map not found' })
  }
  maps = maps.filter(m => m.id !== req.params.id)
  writeData(maps)
  res.json({ success: true, message: 'Deleted successfully' })
})

// 6. POST /api/maps/:id/duplicate - Nhân bản sơ đồ
app.post('/api/maps/:id/duplicate', (req, res) => {
  const maps = readData()
  const source = maps.find(m => m.id === req.params.id)
  if (!source) {
    return res.status(404).json({ success: false, message: 'Source map not found' })
  }

  const copy = JSON.parse(JSON.stringify(source))
  copy.id = 'map_' + Date.now().toString(36)
  copy.title = source.title + ' (Bản sao)'
  copy.updatedAt = new Date().toISOString()

  maps.push(copy)
  writeData(maps)
  res.status(201).json({ success: true, data: copy })
})

// 7. GET /api/backup - Tải file backup toàn bộ database
app.get('/api/backup', (req, res) => {
  const maps = readData()
  res.setHeader('Content-disposition', 'attachment; filename=mindmap_full_backup.json')
  res.setHeader('Content-type', 'application/json')
  res.send(JSON.stringify(maps, null, 2))
})

// 8. POST /api/restore - Khôi phục toàn bộ database từ file JSON
app.post('/api/restore', (req, res) => {
  if (!req.body || !Array.isArray(req.body)) {
    return res.status(400).json({ success: false, message: 'Invalid backup format' })
  }
  writeData(req.body)
  res.json({ success: true, message: 'Restored successfully', count: req.body.length })
})

// Serve static build in production
const DIST_DIR = path.join(__dirname, 'dist')
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(DIST_DIR, 'index.html'))
    }
    next()
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mindmap REST API Server is running on http://0.0.0.0:${PORT}`)
})
