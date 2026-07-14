import { useMemo } from 'react'
import DayCell from './DayCell'
import { getMonthGrid, getWeekDayLabels } from '@/lib/calendar'
import { useSettingsStore } from '@/stores/settingsStore'
import { useEventStore } from '@/stores/eventStore'

interface MonthViewProps {
  currentMonth: Date
  selectedDate: string
  onSelectDate: (date: string) => void
  onMonthChange: (date: Date) => void
}

export default function MonthView({
  currentMonth,
  selectedDate,
  onSelectDate,
  onMonthChange,
}: MonthViewProps) {
  const { settings } = useSettingsStore()
  const { events } = useEventStore()

  const weekDayLabels = getWeekDayLabels(settings.weekStartDay)
  const days = useMemo(
    () => getMonthGrid(currentMonth, settings.weekStartDay),
    [currentMonth, settings.weekStartDay]
  )

  // 建立日期 → 是否有日程的映射
  const eventDates = useMemo(() => {
    const set = new Set<string>()
    for (const event of events) {
      // 将日程的日期范围展开
      const start = new Date(event.startTime)
      const end = new Date(event.endTime)
      const cur = new Date(start)
      while (cur <= end) {
        set.add(cur.toISOString().slice(0, 10))
        cur.setDate(cur.getDate() + 1)
      }
    }
    return set
  }, [events])

  return (
    <div className="select-none">
      {/* 星期标题 */}
      <div className="grid grid-cols-7 mb-1">
        {weekDayLabels.map((label, i) => (
          <div
            key={i}
            className="text-center text-xs font-medium py-1.5 text-[rgb(var(--text-tertiary))]"
          >
            {label}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day, i) => (
          <DayCell
            key={i}
            day={day}
            isSelected={day.dateStr === selectedDate}
            hasEvents={eventDates.has(day.dateStr)}
            onSelect={() => {
              onSelectDate(day.dateStr)
              // 如果点击的是非当月日期，切换月份
              if (!day.isCurrentMonth) {
                onMonthChange(day.date)
              }
            }}
          />
        ))}
      </div>
    </div>
  )
}
