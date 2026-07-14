/**
 * IPC 调用封装 — 为渲染进程提供类型安全的 API 调用
 */
import type {
  CalendarEvent, NewCalendarEvent,
  Todo, NewTodo,
  Category, AppSettings,
} from '@/types'

// ============================================================
// 日程
// ============================================================
export async function getEvents(): Promise<CalendarEvent[]> {
  const rows = await window.api.getEvents()
  return rows.map(mapEvent)
}

export async function getEventsByDate(date: string): Promise<CalendarEvent[]> {
  const rows = await window.api.getEventsByDate(date)
  return rows.map(mapEvent)
}

export async function getEventsByRange(start: string, end: string): Promise<CalendarEvent[]> {
  const rows = await window.api.getEventsByRange(start, end)
  return rows.map(mapEvent)
}

export async function createEvent(data: NewCalendarEvent): Promise<CalendarEvent> {
  const row = await window.api.createEvent(data)
  return mapEvent(row)
}

export async function updateEvent(id: string, data: Partial<NewCalendarEvent>): Promise<CalendarEvent> {
  const row = await window.api.updateEvent(id, data)
  return mapEvent(row)
}

export async function deleteEvent(id: string): Promise<void> {
  await window.api.deleteEvent(id)
}

// ============================================================
// 待办
// ============================================================
export async function getTodos(): Promise<Todo[]> {
  const rows = await window.api.getTodos()
  return rows.map(mapTodo)
}

export async function getTodosByDate(date: string): Promise<Todo[]> {
  const rows = await window.api.getTodosByDate(date)
  return rows.map(mapTodo)
}

export async function createTodo(data: NewTodo): Promise<Todo> {
  const row = await window.api.createTodo(data)
  return mapTodo(row)
}

export async function updateTodo(id: string, data: Partial<Todo>): Promise<Todo> {
  const row = await window.api.updateTodo(id, data)
  return mapTodo(row)
}

export async function deleteTodo(id: string): Promise<void> {
  await window.api.deleteTodo(id)
}

export async function toggleTodo(id: string): Promise<Todo> {
  const row = await window.api.toggleTodo(id)
  return mapTodo(row)
}

// ============================================================
// 分类
// ============================================================
export async function getCategories(): Promise<Category[]> {
  return window.api.getCategories()
}

export async function createCategory(data: { name: string; color?: string }): Promise<Category> {
  return window.api.createCategory(data)
}

export async function updateCategory(id: string, data: { name?: string; color?: string }): Promise<Category> {
  return window.api.updateCategory(id, data)
}

export async function deleteCategory(id: string): Promise<void> {
  await window.api.deleteCategory(id)
}

// ============================================================
// 设置
// ============================================================
export async function getSettings(): Promise<AppSettings | null> {
  return window.api.getSettings()
}

export async function updateSettings(settings: AppSettings): Promise<AppSettings> {
  return window.api.updateSettings(settings)
}

// ============================================================
// 导入导出
// ============================================================
export async function exportIcs(dateRange?: { start: string; end: string }) {
  return window.api.exportIcs(dateRange)
}

export async function importIcs() {
  return window.api.importIcs()
}

export async function exportJson() {
  return window.api.exportJson()
}

export async function importJson() {
  return window.api.importJson()
}

// ============================================================
// 数据映射（ snake_case → camelCase ）
// ============================================================
function mapEvent(row: any): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startTime: row.start_time,
    endTime: row.end_time,
    isAllDay: row.is_all_day === 1,
    recurrence: row.recurrence,
    reminder: row.reminder,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapTodo(row: any): Todo {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    completed: row.completed === 1,
    priority: row.priority,
    dueDate: row.due_date,
    categoryId: row.category_id,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
