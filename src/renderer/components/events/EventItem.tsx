import { Pencil, Trash2, RotateCcw } from 'lucide-react'
import type { CalendarEvent } from '@/types'
import { formatTimeDisplay } from '@/lib/calendar'

interface EventItemProps {
  event: CalendarEvent
  onEdit: () => void
  onDelete: () => void
}

export default function EventItem({ event, onEdit, onDelete }: EventItemProps) {
  const timeDisplay = formatTimeDisplay(event.startTime, event.endTime, event.isAllDay)
  const dotColor = event.color || `rgb(var(--theme-color))`

  return (
    <div
      className="group flex items-center gap-3 px-3 py-2.5 rounded-lg
                 hover:bg-[rgba(var(--glass-bg)/0.25)] transition-colors
                 animate-slide-up"
    >
      {/* 左侧色条 */}
      <div
        className="w-1 h-8 rounded-full flex-shrink-0"
        style={{ backgroundColor: dotColor }}
      />

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
          {event.title}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-[rgb(var(--text-tertiary))]">
            {timeDisplay}
          </span>
          {event.recurrence && (
            <span className="text-xs text-[rgb(var(--theme-color))] flex items-center gap-0.5">
              <RotateCcw size={10} />
              重复
            </span>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1 rounded-md text-[rgb(var(--text-tertiary))]
                     hover:text-[rgb(var(--text-primary))]
                     hover:bg-[rgba(var(--glass-bg)/0.2)] transition-colors"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded-md text-[rgb(var(--text-tertiary))]
                     hover:text-red-500
                     hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
