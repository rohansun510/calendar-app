import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, X, Square, ChevronDown } from 'lucide-react'
import { usePomodoroStore } from '@/stores/pomodoroStore'
import { useTodoStore } from '@/stores/todoStore'
import { POMODORO_PRESETS } from '@/types'

type Phase = 'idle' | 'running' | 'paused'

export default function PomodoroTimer() {
  const store = usePomodoroStore()
  const { todos } = useTodoStore()

  // --- 模式 & 待办选择 ---
  const [mode, setMode] = useState<'focus' | 'short_break' | 'long_break'>('focus')
  const [customMinutes, setCustomMinutes] = useState(25)
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null)
  const [showTodoSelect, setShowTodoSelect] = useState(false)

  // --- 计时核心（纯本地 state） ---
  const [phase, setPhase] = useState<Phase>('idle')
  const [countdown, setCountdown] = useState(0) // 剩余秒数
  const intervalRef = useRef<number | null>(null)
  const startTimeRef = useRef(0) // 计时开始的 Date.now()
  const totalSecRef = useRef(0) // 本轮总秒数
  const modeRef = useRef(mode) // 避免 effect 闭包拿到旧 mode

  // 同步 mode 到 ref
  useEffect(() => { modeRef.current = mode }, [mode])

  const { activeSession, showTimer } = store
  const activeTodos = todos.filter(t => !t.completed)
  const selectedTodo = todos.find(t => t.id === selectedTodoId)

  // 总秒数（用于显示和圆圈）
  const totalSeconds = phase !== 'idle'
    ? totalSecRef.current
    : (mode === 'focus' ? customMinutes : (POMODORO_PRESETS[mode]?.minutes || 5)) * 60

  // 进度 1 → 0（圆圈从满到空）
  const progress = totalSeconds > 0 ? countdown / totalSeconds : 1
  const displaySeconds = phase !== 'idle' ? countdown : totalSeconds

  // ---- 核心 effect：phase === 'running' 时每秒减 1 ----
  useEffect(() => {
    if (phase !== 'running') return

    intervalRef.current = window.setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // 时间到
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          setPhase('idle')

          const mins = totalSecRef.current / 60
          const elapsed = Math.round((Date.now() - startTimeRef.current) / 60000)
          store.completeSession(Math.min(elapsed, mins))

          // 专注结束自动切到短休
          if (modeRef.current === 'focus') {
            setMode('short_break')
            setCustomMinutes(POMODORO_PRESETS.short_break.minutes)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [phase])

  // ---- 操作 ----
  const handleStart = useCallback(async () => {
    const mins = mode === 'focus' ? customMinutes : (POMODORO_PRESETS[mode]?.minutes || 5)
    const secs = mins * 60

    // ★ 所有本地状态必须在 await 之前设置 ★
    totalSecRef.current = secs
    startTimeRef.current = Date.now()
    setCountdown(secs)
    setPhase('running')

    try {
      await store.startSession(selectedTodoId, mins, mode)
    } catch {
      // IPC 失败则回退
      setPhase('idle')
      setCountdown(0)
    }
  }, [mode, customMinutes, selectedTodoId, store])

  const handlePause = useCallback(() => {
    setPhase('paused')
    store.setTimerRunning(false)
  }, [store])

  const handleResume = useCallback(() => {
    setPhase('running')
    store.setTimerRunning(true)
  }, [store])

  const handleCancel = useCallback(() => {
    // 先停计时
    setPhase('idle')
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    const elapsed = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000))
    store.cancelSession(elapsed)
    setCountdown(0)
  }, [store])

  // ---- 辅助 ----
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }

  const presets = Object.entries(POMODORO_PRESETS) as [string, { label: string; minutes: number; icon: string }][]
  const isIdle = phase === 'idle' && !activeSession

  if (!showTimer) return null

  return (
    <div className="fixed bottom-3 right-3 z-[80] animate-slide-up">
      <div className="glass-window rounded-xl p-4 w-72">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold">🍅 番茄钟</h4>
          <div className="flex items-center gap-1">
            <button onClick={() => { store.setShowStats(true); store.setShowTimer(false) }}
              className="p-1 rounded text-xs hover:bg-[rgba(var(--glass-bg)/0.3)]" title="统计">📊</button>
            <button onClick={() => { store.setShowKanban(true); store.setShowTimer(false) }}
              className="p-1 rounded text-xs hover:bg-[rgba(var(--glass-bg)/0.3)]" title="看板">📋</button>
            <button onClick={() => store.setShowTimer(false)}
              className="p-1 rounded text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))]"><X size={14} /></button>
          </div>
        </div>

        {/* 模式选择（仅闲置时） */}
        {isIdle && (
          <div className="flex gap-1 mb-3">
            {presets.map(([key, preset]) => (
              <button key={key} onClick={() => setMode(key as typeof mode)}
                className={`flex-1 py-1 text-xs rounded-md ${mode === key ? 'bg-[rgb(var(--theme-color))] text-white' : 'bg-[rgba(var(--glass-bg)/0.3)] text-[rgb(var(--text-secondary))]'}`}>
                {preset.icon} {preset.label}
              </button>
            ))}
          </div>
        )}

        {/* 待办关联（仅闲置时） */}
        {isIdle && (
          <div className="relative mb-3">
            <button onClick={() => setShowTodoSelect(!showTodoSelect)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-lg border border-[rgba(var(--border-color)/0.25)] text-[rgb(var(--text-secondary))]">
              {selectedTodo ? `📌 ${selectedTodo.title}` : '选择关联待办（可选）'}
              <ChevronDown size={12} />
            </button>
            {showTodoSelect && (
              <div className="absolute top-full left-0 right-0 mt-1 max-h-32 overflow-y-auto glass-window rounded-lg z-10">
                <button onClick={() => { setSelectedTodoId(null); setShowTodoSelect(false) }}
                  className="w-full px-2 py-1.5 text-xs text-left hover:bg-[rgba(var(--glass-bg)/0.2)]">无关联</button>
                {activeTodos.map(t => (
                  <button key={t.id} onClick={() => { setSelectedTodoId(t.id); setShowTodoSelect(false) }}
                    className="w-full px-2 py-1.5 text-xs text-left hover:bg-[rgba(var(--glass-bg)/0.2)] truncate">{t.title}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 进度圆圈 */}
        <div className="flex items-center justify-center mb-3">
          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(var(--border-color)/0.2)" strokeWidth="6" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(var(--theme-color))" strokeWidth="6"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 * (1 - progress)}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums">{formatTime(displaySeconds)}</span>
              <span className="text-xs text-[rgb(var(--text-tertiary))]">
                {phase === 'running' ? (mode === 'focus' ? '专注中' : '休息中')
                  : phase === 'paused' ? '已暂停'
                  : '就绪'}
              </span>
            </div>
          </div>
        </div>

        {/* 时长滑块（仅闲置 + 专注模式） */}
        {isIdle && mode === 'focus' && (
          <div className="flex items-center gap-2 mb-3">
            <input type="range" min="5" max="60" step="5" value={customMinutes}
              onChange={(e) => setCustomMinutes(Number(e.target.value))}
              className="flex-1 h-1 rounded-full appearance-none bg-[rgba(var(--border-color)/0.3)]"
              style={{ accentColor: 'rgb(var(--theme-color))' }} />
            <span className="text-xs text-[rgb(var(--text-secondary))] w-10">{customMinutes}分</span>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex items-center justify-center gap-2">
          {phase === 'idle' ? (
            <button onClick={handleStart}
              className="px-6 py-2 rounded-full bg-[rgb(var(--theme-color))] text-white text-sm hover:opacity-90 flex items-center gap-2">
              <Play size={14} /> 开始
            </button>
          ) : phase === 'running' ? (
            <button onClick={handlePause} className="p-2 rounded-full bg-yellow-500 text-white hover:opacity-90"><Pause size={16} /></button>
          ) : (
            <button onClick={handleResume} className="p-2 rounded-full bg-green-500 text-white hover:opacity-90"><Play size={16} /></button>
          )}
          {phase !== 'idle' && (
            <button onClick={handleCancel} className="p-2 rounded-full bg-red-500 text-white hover:opacity-90"><Square size={16} /></button>
          )}
        </div>
      </div>
    </div>
  )
}
