// ============================================================
// 类型定义 — 日历清单应用
// ============================================================

/** 优先级 */
export type Priority = 0 | 1 | 2 | 3
// 0 = 无, 1 = 低 🟢, 2 = 中 🟡, 3 = 高 🔴

/** 优先级标签映射 */
export const PriorityLabel: Record<Priority, string> = {
  0: '无',
  1: '低',
  2: '中',
  3: '高',
}

/** 日程 */
export interface CalendarEvent {
  id: string
  title: string
  description: string
  startTime: string    // ISO 8601
  endTime: string      // ISO 8601
  isAllDay: boolean
  recurrence: string | null  // RRULE
  reminder: number     // 提前提醒分钟数, 0 = 不提醒
  color: string | null
  createdAt: string
  updatedAt: string
}

/** 新日程（不含 id 和时间戳） */
export type NewCalendarEvent = Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>

/** 待办 */
export interface Todo {
  id: string
  title: string
  description: string
  completed: boolean
  priority: Priority
  dueDate: string | null
  categoryId: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

/** 新待办（不含 id 和时间戳） */
export type NewTodo = Omit<Todo, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder' | 'completed'>

/** 分类 */
export interface Category {
  id: string
  name: string
  color: string
  createdAt: string
}

/** 应用设置 */
export interface AppSettings {
  themeColor: string
  themeMode: 'light' | 'dark' | 'system'
  weekStartDay: 0 | 1   // 0=周日, 1=周一
  language: 'zh-CN' | 'en'
  fontSize: 'small' | 'medium' | 'large'
  glassOpacity: number   // 0-100, 窗口透明度百分比
  sidebarPosition: 'left' | 'right'  // 月历位置
}

/** 默认设置 */
export const DEFAULT_SETTINGS: AppSettings = {
  themeColor: '#4b5563',
  themeMode: 'system',
  weekStartDay: 1,
  language: 'zh-CN',
  fontSize: 'medium',
  glassOpacity: 55,
  sidebarPosition: 'left',
}

/** 预设主题色 */
export const THEME_PRESETS = [
  { name: '石墨灰', color: '#4b5563' },
  { name: 'macOS 蓝', color: '#007aff' },
  { name: '玫瑰金', color: '#e1758a' },
  { name: '森林绿', color: '#2e8b57' },
  { name: '深紫', color: '#7c3aed' },
  { name: '日落橙', color: '#f97316' },
]

/** IPC 通道名称 */
export const IPC_CHANNELS = {
  // 日程
  GET_EVENTS: 'events:get-all',
  GET_EVENTS_BY_DATE: 'events:get-by-date',
  GET_EVENTS_BY_RANGE: 'events:get-by-range',
  CREATE_EVENT: 'events:create',
  UPDATE_EVENT: 'events:update',
  DELETE_EVENT: 'events:delete',
  // 待办
  GET_TODOS: 'todos:get-all',
  GET_TODOS_BY_DATE: 'todos:get-by-date',
  CREATE_TODO: 'todos:create',
  UPDATE_TODO: 'todos:update',
  DELETE_TODO: 'todos:delete',
  TOGGLE_TODO: 'todos:toggle',
  REORDER_TODOS: 'todos:reorder',
  // 分类
  GET_CATEGORIES: 'categories:get-all',
  CREATE_CATEGORY: 'categories:create',
  UPDATE_CATEGORY: 'categories:update',
  DELETE_CATEGORY: 'categories:delete',
  // 设置
  GET_SETTINGS: 'settings:get',
  UPDATE_SETTINGS: 'settings:update',
  // 导入导出
  EXPORT_ICS: 'export:ics',
  IMPORT_ICS: 'import:ics',
  EXPORT_JSON: 'export:json',
  IMPORT_JSON: 'import:json',
  // 提醒
  CHECK_REMINDERS: 'reminders:check',
} as const

/** 重复规则选项 */
export const RECURRENCE_OPTIONS = [
  { value: '', label: '不重复' },
  { value: 'FREQ=DAILY', label: '每天' },
  { value: 'FREQ=WEEKLY', label: '每周' },
  { value: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', label: '每个工作日' },
  { value: 'FREQ=MONTHLY', label: '每月' },
  { value: 'FREQ=YEARLY', label: '每年' },
]

/** 提醒时间选项（分钟） */
export const REMINDER_OPTIONS = [
  { value: 0, label: '不提醒' },
  { value: 5, label: '5 分钟前' },
  { value: 15, label: '15 分钟前' },
  { value: 30, label: '30 分钟前' },
  { value: 60, label: '1 小时前' },
  { value: 1440, label: '1 天前' },
]

/** 番茄钟记录 */
export interface PomodoroSession {
  id: string
  todoId: string | null
  startTime: string
  endTime: string | null
  durationMinutes: number
  actualMinutes: number
  status: 'running' | 'paused' | 'completed' | 'cancelled'
  category: 'focus' | 'short_break' | 'long_break'
  createdAt: string
}

export const POMODORO_PRESETS = {
  focus: { label: '专注', minutes: 25, icon: '🍅' },
  short_break: { label: '短休', minutes: 5, icon: '☕' },
  long_break: { label: '长休', minutes: 15, icon: '🌿' },
} as const
