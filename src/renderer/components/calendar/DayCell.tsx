import type { DayInfo } from '@/lib/calendar'

interface DayCellProps {
  day: DayInfo
  isSelected: boolean
  hasEvents: boolean
  onSelect: () => void
}

export default function DayCell({ day, isSelected, hasEvents, onSelect }: DayCellProps) {
  return (
    <button
      onClick={onSelect}
      className={`
        relative flex items-center justify-center w-full aspect-square text-sm
        rounded-full transition-all duration-150
        ${!day.isCurrentMonth ? 'text-[rgb(var(--text-tertiary))]' : 'text-[rgb(var(--text-primary))]'}
        ${day.isToday && !isSelected
          ? 'font-bold text-[rgb(var(--theme-color))]'
          : ''
        }
        ${isSelected
          ? 'bg-[rgb(var(--theme-color))] text-white font-semibold'
          : 'hover:bg-[rgba(var(--glass-bg)/0.2)]'
        }
      `}
    >
      {day.dayOfMonth}

      {/* 日程标记小圆点 */}
      {hasEvents && !isSelected && (
        <span
          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
          style={{ backgroundColor: `rgb(var(--theme-color))` }}
        />
      )}
    </button>
  )
}
