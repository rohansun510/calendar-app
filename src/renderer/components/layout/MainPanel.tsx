import { useState } from 'react'
import { Plus } from 'lucide-react'
import EventList from '@/components/events/EventList'
import EventDialog from '@/components/events/EventDialog'
import TodoList from '@/components/todos/TodoList'
import TodoDialog from '@/components/todos/TodoDialog'
import { useEventStore } from '@/stores/eventStore'
import { useTodoStore } from '@/stores/todoStore'
import { formatDateDisplay, getDefaultEventTime } from '@/lib/calendar'
import type { NewCalendarEvent } from '@/types'

interface MainPanelProps {
  selectedDate: string
  eventsHeight: number
  draggingEvents: boolean
  onStartDragEvents: () => void
}

export default function MainPanel({ selectedDate, eventsHeight, draggingEvents, onStartDragEvents }: MainPanelProps) {
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [showTodoDialog, setShowTodoDialog] = useState(false)
  const { create: createEvent } = useEventStore()
  const { create: createTodo } = useTodoStore()

  const defaultEvent = {
    ...getDefaultEventTime(),
    date: selectedDate,
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* 日期标题 */}
      <div className="px-4 py-2 border-b border-[rgba(var(--border-color)/0.2)]">
        <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
          {formatDateDisplay(selectedDate)}
        </h2>
      </div>

      {/* 内容区 — 上下分割 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 日程区域 */}
        <div className="overflow-y-auto px-4 py-2" style={{ height: `${eventsHeight}%` }}>
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                📅 日程
              </h3>
              <button
                onClick={() => setShowEventDialog(true)}
                className="flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-md
                           text-[rgb(var(--text-secondary))] hover:bg-[rgba(var(--glass-bg)/0.5)] transition-colors"
              >
                <Plus size={12} /> 添加
              </button>
            </div>
            <EventList selectedDate={selectedDate} />
          </section>
        </div>

        {/* 水平拖拽手柄 */}
        <div
          className={`resize-handle-h ${draggingEvents ? 'active' : ''}`}
          onMouseDown={onStartDragEvents}
        />

        {/* 待办区域 */}
        <div className="overflow-y-auto px-4 py-2" style={{ flex: 1 }}>
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                ✅ 待办清单
              </h3>
              <button
                onClick={() => setShowTodoDialog(true)}
                className="flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-md
                           text-[rgb(var(--text-secondary))] hover:bg-[rgba(var(--glass-bg)/0.5)] transition-colors"
              >
                <Plus size={12} /> 添加
              </button>
            </div>
            <TodoList />
          </section>
        </div>
      </div>

      {/* 弹窗 */}
      {showEventDialog && (
        <EventDialog
          defaultDate={selectedDate}
          defaultStartTime={defaultEvent.startTime}
          defaultEndTime={defaultEvent.endTime}
          onSave={async (data) => { await createEvent(data); setShowEventDialog(false) }}
          onClose={() => setShowEventDialog(false)}
        />
      )}
      {showTodoDialog && (
        <TodoDialog
          onSave={async (data) => { await createTodo({ ...data, completed: false } as any); setShowTodoDialog(false) }}
          onClose={() => setShowTodoDialog(false)}
        />
      )}
    </main>
  )
}
