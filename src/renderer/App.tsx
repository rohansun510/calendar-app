import { useEffect, useState, useCallback, useRef } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useEventStore } from '@/stores/eventStore'
import { useTodoStore } from '@/stores/todoStore'
import { useCategoryStore } from '@/stores/categoryStore'
import TitleBar from '@/components/layout/TitleBar'
import Sidebar from '@/components/layout/Sidebar'
import MainPanel from '@/components/layout/MainPanel'
import StatusBar from '@/components/layout/StatusBar'
import { getTodayStr } from '@/lib/calendar'

export default function App() {
  const { loaded, load: loadSettings } = useSettingsStore()
  const { loadAll: loadEvents } = useEventStore()
  const { loadAll: loadTodos } = useTodoStore()
  const { loadAll: loadCategories } = useCategoryStore()
  const [selectedDate, setSelectedDate] = useState(getTodayStr())

  // 面板大小（从 localStorage 恢复）
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('panel-sidebar-width')
    return saved ? Number(saved) : 200
  })
  const [eventsHeight, setEventsHeight] = useState(() => {
    const saved = localStorage.getItem('panel-events-height')
    return saved ? Number(saved) : 45 // 百分比
  })

  // 拖拽状态
  const [dragging, setDragging] = useState<'sidebar' | 'events' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function init() {
      await loadSettings()
      await Promise.all([loadEvents(), loadTodos(), loadCategories()])
    }
    init()
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const { settings } = useSettingsStore.getState()
      if (settings.themeMode === 'system') {
        useSettingsStore.getState().applyTheme()
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // 全局鼠标事件处理拖拽
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()

    if (dragging === 'sidebar') {
      const w = Math.max(160, Math.min(350, e.clientX - rect.left))
      setSidebarWidth(w)
    } else if (dragging === 'events') {
      const pct = Math.max(20, Math.min(80, ((e.clientY - rect.top - 120) / (rect.height - 120)) * 100))
      setEventsHeight(pct)
    }
  }, [dragging])

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      localStorage.setItem('panel-sidebar-width', String(sidebarWidth))
      localStorage.setItem('panel-events-height', String(eventsHeight))
      setDragging(null)
    }
  }, [dragging, sidebarWidth, eventsHeight])

  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = dragging === 'sidebar' ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [dragging, handleMouseMove, handleMouseUp])

  if (!loaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-transparent">
        <div className="text-sm text-[rgb(var(--text-tertiary))] animate-pulse">加载中…</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden text-[rgb(var(--text-primary))]
                    glass-window rounded-xl">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden rounded-b-xl" ref={containerRef}>
        {/* 左侧日历 */}
        <div style={{ width: sidebarWidth, flexShrink: 0 }}>
          <Sidebar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </div>

        {/* 垂直拖拽手柄 */}
        <div
          className={`resize-handle-v ${dragging === 'sidebar' ? 'active' : ''}`}
          onMouseDown={() => setDragging('sidebar')}
        />

        {/* 右侧主区域 */}
        <MainPanel
          selectedDate={selectedDate}
          eventsHeight={eventsHeight}
          draggingEvents={dragging === 'events'}
          onStartDragEvents={() => setDragging('events')}
        />
      </div>
      <StatusBar />
    </div>
  )
}
