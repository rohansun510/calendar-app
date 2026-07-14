import { useEffect, useState } from 'react'
import { useEventStore } from '@/stores/eventStore'
import type { CalendarEvent } from '@/types'

export default function StatusBar() {
  const { events } = useEventStore()
  const [nextReminder, setNextReminder] = useState<CalendarEvent | null>(null)

  useEffect(() => {
    // 查找最近的有提醒的日程
    const now = new Date()
    const upcoming = events
      .filter((e) => e.reminder > 0 && new Date(e.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

    setNextReminder(upcoming[0] || null)
  }, [events])

  return (
    <footer className="h-[28px] flex items-center px-4 text-xs border-t border-[rgb(var(--border-color)/0.3)]
                      bg-transparent text-[rgb(var(--text-tertiary))]">
      {nextReminder ? (
        <span>
          💡 下一次提醒：
          {formatNextReminder(nextReminder)}
        </span>
      ) : (
        <span>没有待提醒的日程</span>
      )}
    </footer>
  )
}

function formatNextReminder(event: CalendarEvent): string {
  const start = new Date(event.startTime)
  const now = new Date()

  const diffDays = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  const timeStr = start.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  if (diffDays === 0) {
    return `今天 ${timeStr} — ${event.title}`
  } else if (diffDays === 1) {
    return `明天 ${timeStr} — ${event.title}`
  } else {
    return `${start.getMonth() + 1}月${start.getDate()}日 ${timeStr} — ${event.title}`
  }
}
