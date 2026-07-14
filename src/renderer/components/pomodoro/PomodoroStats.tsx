import { useMemo, useEffect } from 'react'
import { X, ArrowLeft } from 'lucide-react'
import { usePomodoroStore } from '@/stores/pomodoroStore'

interface Props { onBack: () => void; onClose: () => void }

export default function PomodoroStats({ onBack, onClose }: Props) {
  const { sessions, loadAll } = usePomodoroStore()

  useEffect(() => { loadAll() }, [])

  const stats = useMemo(() => {
    const focusSessions = sessions.filter(s => s.category === 'focus' && s.actualMinutes > 0)
    const today = new Date().toISOString().slice(0, 10)
    const dailyMap: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      dailyMap[d.toISOString().slice(0, 10)] = 0
    }
    focusSessions.forEach(s => {
      const day = s.startTime.slice(0, 10)
      if (dailyMap[day] !== undefined) dailyMap[day] += s.actualMinutes
    })
    const todayMinutes = focusSessions.filter(s => s.startTime.slice(0, 10) === today).reduce((a, s) => a + s.actualMinutes, 0)
    const totalMinutes = focusSessions.reduce((a, s) => a + s.actualMinutes, 0)
    const totalSessions = focusSessions.length
    const maxDay = Math.max(...Object.values(dailyMap), 1)
    return { dailyMap, todayMinutes, totalMinutes, totalSessions, maxDay }
  }, [sessions])

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[460px] max-h-[80vh] glass-window rounded-xl animate-scale-in overflow-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(var(--border-color)/0.2)]">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-1 rounded hover:bg-[rgba(var(--glass-bg)/0.2)]"><ArrowLeft size={16} /></button>
            <h3 className="text-base font-semibold">📊 专注统计</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[rgba(var(--glass-bg)/0.2)]"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-[rgba(var(--glass-bg)/0.3)]">
              <div className="text-2xl font-bold">{stats.todayMinutes}</div>
              <div className="text-xs text-[rgb(var(--text-tertiary))]">今日/分钟</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-[rgba(var(--glass-bg)/0.3)]">
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
              <div className="text-xs text-[rgb(var(--text-tertiary))]">总次数</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-[rgba(var(--glass-bg)/0.3)]">
              <div className="text-2xl font-bold">{Math.floor(stats.totalMinutes / 60)}h{stats.totalMinutes % 60}m</div>
              <div className="text-xs text-[rgb(var(--text-tertiary))]">总时长</div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">最近7天专注时长</h4>
            <div className="flex items-end justify-between gap-1 h-32 px-2">
              {Object.entries(stats.dailyMap).map(([day, mins]) => {
                const height = (mins / stats.maxDay) * 100
                const dayLabel = new Date(day).toLocaleDateString('zh-CN', { weekday: 'short' })
                const isToday = day === new Date().toISOString().slice(0, 10)
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span className="text-xs text-[rgb(var(--text-tertiary))]">{mins}m</span>
                    <div className={`w-full rounded-t transition-all ${isToday ? 'bg-[rgb(var(--theme-color))]' : 'bg-[rgba(var(--theme-color)/0.3)]'}`}
                      style={{ height: `${Math.max(height, 4)}%` }} />
                    <span className={`text-xs ${isToday ? 'text-[rgb(var(--theme-color))] font-semibold' : 'text-[rgb(var(--text-tertiary))]'}`}>{dayLabel}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
