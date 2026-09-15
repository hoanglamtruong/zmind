<template>
  <div class="flex flex-col h-screen w-screen overflow-hidden bg-white">
    <!-- Top Navigation Bar -->
    <Navbar />

    <!-- Main Content Area with View Transitions -->
    <main class="flex-1 relative overflow-hidden">
      <KeepAlive>
        <MindMapView v-if="store.activeTab === 'mindmap'" />
        <OutlineView v-else-if="store.activeTab === 'outline'" />
        <GanttView v-else-if="store.activeTab === 'gantt'" />
      </KeepAlive>
    </main>

    <!-- Bottom Status Bar: Collaborator Presence -->
    <footer class="h-9 border-t border-gray-200 bg-white px-6 flex items-center justify-between z-30 select-none">
      <div class="flex items-center space-x-2">
        <div class="flex -space-x-1.5 items-center">
          <div class="w-3.5 h-3.5 rounded-full bg-sky-400 ring-2 ring-white"></div>
          <div class="w-3.5 h-3.5 rounded-full bg-amber-500 ring-2 ring-white"></div>
          <div class="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white"></div>
        </div>
        <span class="text-xs font-semibold text-gray-600">3 collaborators online</span>
      </div>

      <div class="flex items-center space-x-4 text-xs text-gray-400">
        <span>Bấm <kbd class="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] text-gray-600">Space</kbd> hoặc Kéo để di chuyển Canvas</span>
        <span class="text-emerald-600 font-medium flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Auto-saved to REST API
        </span>
      </div>
    </footer>

    <!-- Interactive Date Picker Modal (for Gantt) -->
    <DatePickerModal />

    <!-- Project Management Dashboard & JSON Code Editor Modals -->
    <ProjectDashboardModal />
  </div>
</template>

<script setup>
import { store } from './store/mindmapStore.js'
import Navbar from './components/Navbar.vue'
import MindMapView from './components/MindMapView.vue'
import OutlineView from './components/OutlineView.vue'
import GanttView from './components/GanttView.vue'
import DatePickerModal from './components/DatePickerModal.vue'
import ProjectDashboardModal from './components/ProjectDashboardModal.vue'
</script>
