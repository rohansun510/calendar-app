import { ipcMain, dialog } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { queryAll, queryOne, execute } from './database'
import { exportToIcs, importFromIcs } from './import-export'

// IPC 通道名称
const CH = {
  GET_EVENTS: 'events:get-all',
  GET_EVENTS_BY_DATE: 'events:get-by-date',
  GET_EVENTS_BY_RANGE: 'events:get-by-range',
  CREATE_EVENT: 'events:create',
  UPDATE_EVENT: 'events:update',
  DELETE_EVENT: 'events:delete',
  GET_TODOS: 'todos:get-all',
  GET_TODOS_BY_DATE: 'todos:get-by-date',
  CREATE_TODO: 'todos:create',
  UPDATE_TODO: 'todos:update',
  DELETE_TODO: 'todos:delete',
  TOGGLE_TODO: 'todos:toggle',
  REORDER_TODOS: 'todos:reorder',
  GET_CATEGORIES: 'categories:get-all',
  CREATE_CATEGORY: 'categories:create',
  UPDATE_CATEGORY: 'categories:update',
  DELETE_CATEGORY: 'categories:delete',
  GET_SETTINGS: 'settings:get',
  UPDATE_SETTINGS: 'settings:update',
  EXPORT_ICS: 'export:ics',
  IMPORT_ICS: 'import:ics',
  EXPORT_JSON: 'export:json',
  IMPORT_JSON: 'import:json',
} as const

export function registerIpcHandlers(): void {
  // ============================================================
  // 日程
  // ============================================================
  ipcMain.handle(CH.GET_EVENTS, () => {
    return queryAll('SELECT * FROM events ORDER BY start_time ASC')
  })

  ipcMain.handle(CH.GET_EVENTS_BY_DATE, (_event, date: string) => {
    return queryAll(
      `SELECT * FROM events
       WHERE date(start_time) <= date(?)
         AND date(end_time) >= date(?)
       ORDER BY is_all_day DESC, start_time ASC`,
      [date, date]
    )
  })

  ipcMain.handle(CH.GET_EVENTS_BY_RANGE, (_event, startDate: string, endDate: string) => {
    return queryAll(
      `SELECT * FROM events
       WHERE date(start_time) <= date(?)
         AND date(end_time) >= date(?)
       ORDER BY start_time ASC`,
      [endDate, startDate]
    )
  })

  ipcMain.handle(CH.CREATE_EVENT, (_event, data) => {
    const id = uuidv4()
    execute(
      `INSERT INTO events (id, title, description, start_time, end_time, is_all_day, recurrence, reminder, color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.title, data.description || '', data.startTime, data.endTime,
       data.isAllDay ? 1 : 0, data.recurrence || null, data.reminder ?? 15, data.color || null]
    )
    return queryOne('SELECT * FROM events WHERE id = ?', [id])
  })

  ipcMain.handle(CH.UPDATE_EVENT, (_event, id: string, data) => {
    execute(
      `UPDATE events SET
        title = ?, description = ?, start_time = ?, end_time = ?,
        is_all_day = ?, recurrence = ?, reminder = ?, color = ?,
        updated_at = datetime('now', 'localtime')
       WHERE id = ?`,
      [data.title, data.description || '', data.startTime, data.endTime,
       data.isAllDay ? 1 : 0, data.recurrence || null, data.reminder ?? 15, data.color || null, id]
    )
    return queryOne('SELECT * FROM events WHERE id = ?', [id])
  })

  ipcMain.handle(CH.DELETE_EVENT, (_event, id: string) => {
    execute('DELETE FROM events WHERE id = ?', [id])
    return { success: true }
  })

  // ============================================================
  // 待办
  // ============================================================
  ipcMain.handle(CH.GET_TODOS, () => {
    return queryAll('SELECT * FROM todos ORDER BY completed ASC, priority DESC, sort_order ASC')
  })

  ipcMain.handle(CH.GET_TODOS_BY_DATE, (_event, date: string) => {
    return queryAll(
      `SELECT * FROM todos
       WHERE due_date = ? OR due_date IS NULL
       ORDER BY completed ASC, priority DESC, sort_order ASC`,
      [date]
    )
  })

  ipcMain.handle(CH.CREATE_TODO, (_event, data) => {
    const id = uuidv4()
    const maxRow = queryOne('SELECT MAX(sort_order) as max FROM todos')
    const sortOrder = (maxRow?.max ?? 0) + 1
    execute(
      `INSERT INTO todos (id, title, description, priority, due_date, category_id, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, data.title, data.description || '', data.priority ?? 0, data.dueDate || null, data.categoryId || null, sortOrder]
    )
    return queryOne('SELECT * FROM todos WHERE id = ?', [id])
  })

  ipcMain.handle(CH.UPDATE_TODO, (_event, id: string, data) => {
    execute(
      `UPDATE todos SET
        title = ?, description = ?, priority = ?, due_date = ?, category_id = ?,
        updated_at = datetime('now', 'localtime')
       WHERE id = ?`,
      [data.title, data.description || '', data.priority ?? 0, data.dueDate || null, data.categoryId || null, id]
    )
    return queryOne('SELECT * FROM todos WHERE id = ?', [id])
  })

  ipcMain.handle(CH.DELETE_TODO, (_event, id: string) => {
    execute('DELETE FROM todos WHERE id = ?', [id])
    return { success: true }
  })

  ipcMain.handle(CH.TOGGLE_TODO, (_event, id: string) => {
    const todo = queryOne('SELECT completed FROM todos WHERE id = ?', [id])
    if (todo) {
      const newStatus = todo.completed ? 0 : 1
      execute('UPDATE todos SET completed = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?', [newStatus, id])
    }
    return queryOne('SELECT * FROM todos WHERE id = ?', [id])
  })

  ipcMain.handle(CH.REORDER_TODOS, (_event, ids: string[]) => {
    ids.forEach((id, index) => {
      execute('UPDATE todos SET sort_order = ? WHERE id = ?', [index, id])
    })
    return { success: true }
  })

  // ============================================================
  // 分类
  // ============================================================
  ipcMain.handle(CH.GET_CATEGORIES, () => {
    return queryAll('SELECT * FROM categories ORDER BY created_at ASC')
  })

  ipcMain.handle(CH.CREATE_CATEGORY, (_event, data) => {
    const id = uuidv4()
    execute('INSERT INTO categories (id, name, color) VALUES (?, ?, ?)', [id, data.name, data.color || '#6b7280'])
    return queryOne('SELECT * FROM categories WHERE id = ?', [id])
  })

  ipcMain.handle(CH.UPDATE_CATEGORY, (_event, id: string, data) => {
    execute('UPDATE categories SET name = ?, color = ? WHERE id = ?', [data.name, data.color || '#6b7280', id])
    return queryOne('SELECT * FROM categories WHERE id = ?', [id])
  })

  ipcMain.handle(CH.DELETE_CATEGORY, (_event, id: string) => {
    execute('UPDATE todos SET category_id = NULL WHERE category_id = ?', [id])
    execute('DELETE FROM categories WHERE id = ?', [id])
    return { success: true }
  })

  // ============================================================
  // 设置
  // ============================================================
  ipcMain.handle(CH.GET_SETTINGS, () => {
    const row = queryOne('SELECT value FROM settings WHERE key = ?', ['app_settings'])
    return row ? JSON.parse(row.value) : null
  })

  ipcMain.handle(CH.UPDATE_SETTINGS, (_event, settings) => {
    execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['app_settings', JSON.stringify(settings)])
    return settings
  })

  // ============================================================
  // 导入导出
  // ============================================================
  ipcMain.handle(CH.EXPORT_ICS, async (_event, dateRange?: { start: string; end: string }) => {
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: '导出日程',
      defaultPath: `calendar-export-${new Date().toISOString().slice(0, 10)}.ics`,
      filters: [{ name: 'ICS 日历文件', extensions: ['ics'] }],
    })
    if (canceled || !filePath) return { success: false, message: '已取消' }

    let events
    if (dateRange) {
      events = queryAll(
        `SELECT * FROM events WHERE date(start_time) <= date(?) AND date(end_time) >= date(?) ORDER BY start_time ASC`,
        [dateRange.end, dateRange.start]
      )
    } else {
      events = queryAll('SELECT * FROM events ORDER BY start_time ASC')
    }
    exportToIcs(filePath, events)
    return { success: true, message: `成功导出 ${events.length} 条日程` }
  })

  ipcMain.handle(CH.IMPORT_ICS, async () => {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: '导入日程',
      filters: [{ name: 'ICS 日历文件', extensions: ['ics'] }],
      properties: ['openFile'],
    })
    if (canceled || filePaths.length === 0) return { success: false, message: '已取消' }

    const importedEvents = importFromIcs(filePaths[0])
    for (const evt of importedEvents) {
      const id = uuidv4()
      execute(
        `INSERT INTO events (id, title, description, start_time, end_time, is_all_day, recurrence, reminder, color)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, evt.title, evt.description || '', evt.startTime, evt.endTime,
         evt.isAllDay ? 1 : 0, evt.recurrence || null, evt.reminder ?? 15, evt.color || null]
      )
    }
    return { success: true, message: `成功导入 ${importedEvents.length} 条日程` }
  })

  ipcMain.handle(CH.EXPORT_JSON, async () => {
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: '备份全部数据',
      defaultPath: `calendar-backup-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON 文件', extensions: ['json'] }],
    })
    if (canceled || !filePath) return { success: false, message: '已取消' }

    const events = queryAll('SELECT * FROM events')
    const todos = queryAll('SELECT * FROM todos')
    const categories = queryAll('SELECT * FROM categories')
    const settings = queryAll('SELECT * FROM settings')
    const fs = require('fs')
    fs.writeFileSync(filePath, JSON.stringify({ events, todos, categories, settings }, null, 2), 'utf-8')
    return { success: true, message: `成功备份 ${events.length} 条日程, ${todos.length} 条待办` }
  })

  ipcMain.handle(CH.IMPORT_JSON, async () => {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: '恢复备份',
      filters: [{ name: 'JSON 文件', extensions: ['json'] }],
      properties: ['openFile'],
    })
    if (canceled || filePaths.length === 0) return { success: false, message: '已取消' }

    const fs = require('fs')
    const raw = fs.readFileSync(filePaths[0], 'utf-8')
    const data = JSON.parse(raw)

    const importTable = (table: string, rows: any[]) => {
      if (!rows || rows.length === 0) return
      execute(`DELETE FROM ${table}`)
      const cols = Object.keys(rows[0])
      const ph = cols.map(() => '?').join(', ')
      for (const row of rows) {
        execute(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${ph})`, Object.values(row))
      }
    }

    importTable('categories', data.categories || [])
    importTable('events', data.events || [])
    importTable('todos', data.todos || [])
    importTable('settings', data.settings || [])
    return { success: true, message: `成功恢复 ${(data.events || []).length} 条日程, ${(data.todos || []).length} 条待办` }
  })
}
