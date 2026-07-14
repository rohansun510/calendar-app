import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, isToday,
  addMonths, subMonths, addYears, subYears, parseISO,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'

export interface DayInfo {
  date: Date
  dayOfMonth: number
  isCurrentMonth: boolean
  isToday: boolean
  dateStr: string  // YYYY-MM-DD
}

/**
 * 生成月视图网格（含前后月补齐的日期）
 * @param date 当月任意一天
 * @param weekStartDay 每周起始日: 0=周日, 1=周一
 */
export function getMonthGrid(date: Date, weekStartDay: 0 | 1 = 1): DayInfo[] {
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)

  // 计算网格起始日（对齐到自然周）
  const gridStart = startOfWeek(monthStart, { weekStartsOn: weekStartDay })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: weekStartDay })

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  return days.map((d) => ({
    date: d,
    dayOfMonth: d.getDate(),
    isCurrentMonth: isSameMonth(d, date),
    isToday: isToday(d),
    dateStr: format(d, 'yyyy-MM-dd'),
  }))
}

/**
 * 格式化日期为显示字符串
 */
export function formatDateDisplay(dateStr: string): string {
  const date = parseISO(dateStr)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  const weekDay = format(date, 'EEEE', { locale: zhCN })

  if (isToday(date)) {
    return `今天 · ${weekDay}`
  } else if (isSameDay(date, tomorrow)) {
    return `明天 · ${weekDay}`
  } else if (isSameDay(date, yesterday)) {
    return `昨天 · ${weekDay}`
  }

  return `${date.getMonth() + 1}月${date.getDate()}日 · ${weekDay}`
}

/**
 * 获取月份标题
 */
export function getMonthTitle(date: Date): string {
  return format(date, 'yyyy年 M月', { locale: zhCN })
}

/**
 * 获取上一个月的日期
 */
export function getPrevMonth(date: Date): Date {
  return subMonths(date, 1)
}

/**
 * 获取下一个月的日期
 */
export function getNextMonth(date: Date): Date {
  return addMonths(date, 1)
}

/**
 * 判断两个日期字符串是否为同一天
 */
export function isSameDateStr(dateStr1: string, dateStr2: string): boolean {
  return dateStr1 === dateStr2
}

/**
 * 获取今天的日期字符串
 */
export function getTodayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/**
 * 格式化时间显示（用于日程项）
 */
export function formatTimeDisplay(startTime: string, endTime: string, isAllDay: boolean): string {
  if (isAllDay) return '全天'

  const start = parseISO(startTime)
  const end = parseISO(endTime)

  const startStr = format(start, 'HH:mm')
  const endStr = format(end, 'HH:mm')

  return `${startStr} - ${endStr}`
}

/**
 * 格式化时间（用于表单）
 */
export function formatTimeForInput(isoStr: string): string {
  return format(parseISO(isoStr), 'HH:mm')
}

/**
 * 格式化日期（用于表单）
 */
export function formatDateForInput(isoStr: string): string {
  return format(parseISO(isoStr), 'yyyy-MM-dd')
}

/**
 * 获取周几的简称
 */
export function getWeekDayLabels(weekStartDay: 0 | 1 = 1): string[] {
  const zhLabels = ['日', '一', '二', '三', '四', '五', '六']
  if (weekStartDay === 1) {
    // 周一开头
    return [...zhLabels.slice(1), zhLabels[0]]
  }
  return zhLabels
}

/**
 * 生成默认日程时间（今天 9:00-10:00）
 */
export function getDefaultEventTime(): { startTime: string; endTime: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0)
  return {
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  }
}
