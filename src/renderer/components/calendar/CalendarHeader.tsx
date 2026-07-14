import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonthTitle, getPrevMonth, getNextMonth } from '@/lib/calendar'

interface CalendarHeaderProps {
  currentMonth: Date
  onMonthChange: (date: Date) => void
}

export default function CalendarHeader({ currentMonth, onMonthChange }: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
        {getMonthTitle(currentMonth)}
      </h3>
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onMonthChange(getPrevMonth(currentMonth))}
          className="p-1 rounded-md text-[rgb(var(--text-secondary))]
                     hover:bg-[rgba(var(--glass-bg)/0.2)] transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => onMonthChange(new Date())}
          className="px-2 py-0.5 text-xs rounded-md text-[rgb(var(--text-secondary))]
                     hover:bg-[rgba(var(--glass-bg)/0.2)] transition-colors"
        >
          今天
        </button>
        <button
          onClick={() => onMonthChange(getNextMonth(currentMonth))}
          className="p-1 rounded-md text-[rgb(var(--text-secondary))]
                     hover:bg-[rgba(var(--glass-bg)/0.2)] transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
