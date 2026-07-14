import { contextBridge, ipcRenderer } from 'electron'

/**
 * 通过 contextBridge 向渲染进程暴露安全的 API
 */
const api = {
  // 日程
  getEvents: () => ipcRenderer.invoke('events:get-all'),
  getEventsByDate: (date: string) => ipcRenderer.invoke('events:get-by-date', date),
  getEventsByRange: (start: string, end: string) => ipcRenderer.invoke('events:get-by-range', start, end),
  createEvent: (data: any) => ipcRenderer.invoke('events:create', data),
  updateEvent: (id: string, data: any) => ipcRenderer.invoke('events:update', id, data),
  deleteEvent: (id: string) => ipcRenderer.invoke('events:delete', id),

  // 待办
  getTodos: () => ipcRenderer.invoke('todos:get-all'),
  getTodosByDate: (date: string) => ipcRenderer.invoke('todos:get-by-date', date),
  createTodo: (data: any) => ipcRenderer.invoke('todos:create', data),
  updateTodo: (id: string, data: any) => ipcRenderer.invoke('todos:update', id, data),
  deleteTodo: (id: string) => ipcRenderer.invoke('todos:delete', id),
  toggleTodo: (id: string) => ipcRenderer.invoke('todos:toggle', id),
  reorderTodos: (ids: string[]) => ipcRenderer.invoke('todos:reorder', ids),

  // 分类
  getCategories: () => ipcRenderer.invoke('categories:get-all'),
  createCategory: (data: any) => ipcRenderer.invoke('categories:create', data),
  updateCategory: (id: string, data: any) => ipcRenderer.invoke('categories:update', id, data),
  deleteCategory: (id: string) => ipcRenderer.invoke('categories:delete', id),

  // 设置
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: any) => ipcRenderer.invoke('settings:update', settings),

  // 导入导出
  exportIcs: (dateRange?: { start: string; end: string }) =>
    ipcRenderer.invoke('export:ics', dateRange),
  importIcs: () => ipcRenderer.invoke('import:ics'),
  exportJson: () => ipcRenderer.invoke('export:json'),
  importJson: () => ipcRenderer.invoke('import:json'),

  // 窗口控制
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  showWindow: () => ipcRenderer.invoke('window:show'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  lockWindow: (locked: boolean) => ipcRenderer.invoke('window:lock', locked),
  isWindowLocked: () => ipcRenderer.invoke('window:isLocked'),
  onMaximizeChange: (callback: (maximized: boolean) => void) => {
    ipcRenderer.on('window:maximizeChange', (_event, maximized) => callback(maximized))
  },

  // 开机自启
  setAutoStart: (enable: boolean) => ipcRenderer.invoke('app:setAutoStart', enable),
  getAutoStart: () => ipcRenderer.invoke('app:getAutoStart'),
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
