import { create } from 'zustand'
import type { PomodoroSession } from '@/types'

/** 将 sql.js 返回的 snake_case 行转为 camelCase */
function mapSession(row: any): PomodoroSession {
  return {
    id: row.id,
    todoId: row.todo_id || null,
    startTime: row.start_time,
    endTime: row.end_time || null,
    durationMinutes: row.duration_minutes,
    actualMinutes: row.actual_minutes || 0,
    status: row.status,
    category: row.category,
    createdAt: row.created_at,
  }
}

interface PomodoroStore {
  sessions: PomodoroSession[]
  activeSession: PomodoroSession | null
  timerSeconds: number
  timerRunning: boolean
  showTimer: boolean
  showStats: boolean
  showKanban: boolean
  loadAll: () => Promise<void>
  loadToday: () => Promise<void>
  startSession: (todoId: string | null, durationMinutes: number, category: string) => Promise<PomodoroSession>
  completeSession: (actualMinutes: number) => Promise<void>
  cancelSession: (elapsedMin?: number) => Promise<void>
  deleteSession: (id: string) => Promise<void>
  setTimerSeconds: (s: number) => void
  setTimerRunning: (r: boolean) => void
  setShowTimer: (s: boolean) => void
  setShowStats: (s: boolean) => void
  setShowKanban: (s: boolean) => void
}

export const usePomodoroStore = create<PomodoroStore>((set, get) => ({
  sessions: [], activeSession: null, timerSeconds: 0,
  timerRunning: false, showTimer: false, showStats: false, showKanban: false,

  loadAll: async () => {
    const rows = await window.api.pomodoroGetAll()
    set({ sessions: rows.map(mapSession) })
  },
  loadToday: async () => {
    const rows = await window.api.pomodoroGetToday()
    set({ sessions: rows.map(mapSession) })
  },

  startSession: async (todoId, durationMinutes, category) => {
    const row = await window.api.pomodoroCreate({ todoId, startTime: new Date().toISOString(), durationMinutes, status: 'running', category })
    const s = mapSession(row)
    set({ activeSession: s, timerSeconds: durationMinutes * 60, timerRunning: true })
    return s
  },

  completeSession: async (actualMinutes) => {
    const { activeSession } = get()
    if (!activeSession) return
    const row = await window.api.pomodoroUpdate(activeSession.id, { endTime: new Date().toISOString(), actualMinutes, status: 'completed' })
    set({ activeSession: null, timerSeconds: 0, timerRunning: false })
    get().loadAll()
  },

  cancelSession: async (elapsedMin?: number) => {
    const { activeSession } = get()
    if (!activeSession) return
    await window.api.pomodoroUpdate(activeSession.id, { endTime: new Date().toISOString(), actualMinutes: elapsedMin || 0, status: 'cancelled' })
    set({ activeSession: null, timerSeconds: 0, timerRunning: false })
    get().loadAll()
  },

  deleteSession: async (id) => { await window.api.pomodoroDelete(id); get().loadAll() },
  setTimerSeconds: (s) => set({ timerSeconds: s }),
  setTimerRunning: (r) => set({ timerRunning: r }),
  setShowTimer: (s) => set({ showTimer: s }),
  setShowStats: (s) => set({ showStats: s }),
  setShowKanban: (s) => set({ showKanban: s }),
}))
