import { useMemo, useEffect } from 'react'
import { X, ArrowLeft, Trash2 } from 'lucide-react'
import { usePomodoroStore } from '@/stores/pomodoroStore'
import { useTodoStore } from '@/stores/todoStore'

interface Props { onBack: () => void; onClose: () => void }

export default function PomodoroKanban({ onBack, onClose }: Props) {
  const { sessions, deleteSession, loadAll } = usePomodoroStore()
  const { todos } = useTodoStore()

  useEffect(() => { loadAll() }, [])

  const todoStats = useMemo(() => {
    const focus = sessions.filter(s => s.category === 'focus' && s.actualMinutes > 0)
    const map: Record<string, { count: number; totalMin: number; title: string }> = {}
    focus.forEach(s => {
      const key = s.todoId || '__none__'
      if (!map[key]) map[key] = { count: 0, totalMin: 0, title: todos.find(t => t.id === s.todoId)?.title || '未关联待办' }
      map[key].count++; map[key].totalMin += s.actualMinutes
    })
    return Object.entries(map).sort((a, b) => b[1].totalMin - a[1].totalMin)
  }, [sessions, todos])

  const recent = useMemo(() => sessions.filter(s => s.category === 'focus').slice(0, 20), [sessions])

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[480px] max-h-[80vh] glass-window rounded-xl animate-scale-in overflow-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(var(--border-color)/0.2)]">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-1 rounded hover:bg-[rgba(var(--glass-bg)/0.2)]"><ArrowLeft size={16} /></button>
            <h3 className="text-base font-semibold">📋 专注看板</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[rgba(var(--glass-bg)/0.2)]"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          <section>
            <h4 className="text-sm font-semibold mb-3">项目投入分布</h4>
            <div className="space-y-2">
              {todoStats.length === 0 ? (
                <p className="text-xs text-[rgb(var(--text-tertiary))] text-center py-4">暂无专注记录</p>
              ) : todoStats.map(([key, stat]) => {
                const maxMin = todoStats[0]?.[1]?.totalMin || 1
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs w-24 truncate text-[rgb(var(--text-secondary))]">{stat.title}</span>
                    <div className="flex-1 h-4 bg-[rgba(var(--glass-bg)/0.3)] rounded-full overflow-hidden">
                      <div className="h-full bg-[rgb(var(--theme-color))] rounded-full" style={{ width: `${(stat.totalMin / maxMin) * 100}%` }} />
                    </div>
                    <span className="text-xs text-[rgb(var(--text-tertiary))] w-16 text-right">{stat.count}次 {stat.totalMin}分</span>
                  </div>
                )
              })}
            </div>
          </section>
          <section>
            <h4 className="text-sm font-semibold mb-3">最近记录</h4>
            <div className="space-y-1">
              {recent.map(s => {
                const todo = todos.find(t => t.id === s.todoId)
                const st = new Date(s.startTime)
                const sl: Record<string, string> = { completed: '✅', cancelled: '❌', running: '⏳', paused: '⏸️' }
                return (
                  <div key={s.id} className="flex items-center gap-2 py-1.5 px-2 rounded text-xs hover:bg-[rgba(var(--glass-bg)/0.15)] group">
                    <span>{sl[s.status] || '⏳'}</span>
                    <span className="flex-1 truncate">{todo?.title || '未关联'}</span>
                    <span className="text-[rgb(var(--text-tertiary))]">{s.actualMinutes}分</span>
                    <span className="text-[rgb(var(--text-tertiary))]">{st.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>
                    <button onClick={() => deleteSession(s.id)} className="p-0.5 rounded text-[rgb(var(--text-tertiary))] hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
