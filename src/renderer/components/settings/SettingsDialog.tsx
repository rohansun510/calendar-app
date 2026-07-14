import { useState, useEffect } from 'react'
import { X, Download, Upload, Palette, Sun, Moon, Monitor, Power, Type, Droplets } from 'lucide-react'
import { useSettingsStore } from '@/stores/settingsStore'
import { THEME_PRESETS } from '@/types'
import type { AppSettings } from '@/types'
import * as ipc from '@/lib/ipc'
import { useEventStore } from '@/stores/eventStore'
import { useTodoStore } from '@/stores/todoStore'
import { useCategoryStore } from '@/stores/categoryStore'

export default function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { settings, update } = useSettingsStore()
  const [color, setColor] = useState(settings.themeColor)
  const [message, setMessage] = useState('')
  const [autoStart, setAutoStart] = useState(false)

  useEffect(() => { window.api.getAutoStart().then(setAutoStart) }, [])

  const handleAutoStart = async (enable: boolean) => { setAutoStart(enable); await window.api.setAutoStart(enable) }
  const handleColorChange = (c: string) => { setColor(c); update({ themeColor: c }) }
  const handleThemeModeChange = (mode: AppSettings['themeMode']) => update({ themeMode: mode })
  const handleWeekStartChange = (day: 0 | 1) => update({ weekStartDay: day })

  const showMessage = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000) }

  const handleExportAll = async () => { const r = await ipc.exportJson(); showMessage(r.message) }
  const handleImportAll = async () => {
    const r = await ipc.importJson(); showMessage(r.message)
    if (r.success) { await Promise.all([useEventStore.getState().loadAll(), useTodoStore.getState().loadAll(), useCategoryStore.getState().loadAll()]) }
  }

  const themeModeOptions = [
    { value: 'light' as const, icon: Sun, label: '浅色' },
    { value: 'dark' as const, icon: Moon, label: '深色' },
    { value: 'system' as const, icon: Monitor, label: '跟随系统' },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[420px] max-h-[80vh] glass-window rounded-xl animate-scale-in overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(var(--border-color)/0.2)] sticky top-0 bg-transparent z-10">
          <h3 className="text-base font-semibold">设置</h3>
          <button onClick={onClose} className="p-1 rounded-md text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgba(var(--glass-bg)/0.2)] transition-colors"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-6 overflow-y-auto">
          {/* 主题色 */}
          <section>
            <h4 className="text-sm font-semibold text-[rgb(var(--text-secondary))] mb-3 flex items-center gap-2"><Palette size={16} /> 主题色</h4>
            <div className="flex flex-wrap gap-2">
              {THEME_PRESETS.map((preset) => (
                <button key={preset.color} onClick={() => handleColorChange(preset.color)}
                  className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${color === preset.color ? 'ring-2 ring-offset-2 ring-[rgb(var(--theme-color))]' : ''}`}
                  style={{ backgroundColor: preset.color }} title={preset.name} />
              ))}
              <div className="relative">
                <input type="color" value={color} onChange={(e) => handleColorChange(e.target.value)}
                  className="w-8 h-8 rounded-full cursor-pointer opacity-0 absolute inset-0" />
                <div className="w-8 h-8 rounded-full border-2 border-dashed border-[rgba(var(--border-color)/0.25)] flex items-center justify-center text-xs text-[rgb(var(--text-tertiary))]"
                  style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }} />
              </div>
            </div>
          </section>

          {/* 外观模式 */}
          <section>
            <h4 className="text-sm font-semibold text-[rgb(var(--text-secondary))] mb-3">外观模式</h4>
            <div className="flex gap-2">
              {themeModeOptions.map(({ value, icon: Icon, label }) => (
                <button key={value} onClick={() => handleThemeModeChange(value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm rounded-lg border transition-all ${
                    settings.themeMode === value ? 'border-[rgb(var(--theme-color))] bg-[rgb(var(--theme-color))/0.1]' : 'border-[rgba(var(--border-color)/0.25)] text-[rgb(var(--text-secondary))]'}`}>
                  <Icon size={16} />{label}
                </button>
              ))}
            </div>
          </section>

          {/* 字体大小 */}
          <section>
            <h4 className="text-sm font-semibold text-[rgb(var(--text-secondary))] mb-3 flex items-center gap-2"><Type size={16} /> 字体大小</h4>
            <div className="flex gap-2">
              {([{ value: 'small' as const, label: '小' }, { value: 'medium' as const, label: '中' }, { value: 'large' as const, label: '大' }]).map(({ value, label }) => (
                <button key={value} onClick={() => update({ fontSize: value })}
                  className={`flex-1 py-2.5 text-sm rounded-lg border transition-all ${
                    settings.fontSize === value ? 'border-[rgb(var(--theme-color))] bg-[rgb(var(--theme-color))/0.1]' : 'border-[rgba(var(--border-color)/0.25)] text-[rgb(var(--text-secondary))]'}`}>
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* 透明度 */}
          <section>
            <h4 className="text-sm font-semibold text-[rgb(var(--text-secondary))] mb-3 flex items-center gap-2"><Droplets size={16} /> 窗口透明度</h4>
            <div className="flex items-center gap-3">
              <input type="range" min="15" max="90" value={settings.glassOpacity}
                onChange={(e) => update({ glassOpacity: Number(e.target.value) })}
                className="flex-1 h-1.5 rounded-full appearance-none bg-[rgba(var(--border-color)/0.3)] cursor-pointer"
                style={{ accentColor: `rgb(var(--theme-color))` }} />
              <span className="text-xs text-[rgb(var(--text-secondary))] w-8 text-right">{settings.glassOpacity}%</span>
            </div>
          </section>

          {/* 每周起始日 */}
          <section>
            <h4 className="text-sm font-semibold text-[rgb(var(--text-secondary))] mb-3">每周起始日</h4>
            <div className="flex gap-2">
              {([{ value: 0 as const, label: '周日' }, { value: 1 as const, label: '周一' }]).map(({ value, label }) => (
                <button key={value} onClick={() => handleWeekStartChange(value)}
                  className={`flex-1 py-2.5 text-sm rounded-lg border transition-all ${
                    settings.weekStartDay === value ? 'border-[rgb(var(--theme-color))] bg-[rgb(var(--theme-color))/0.1]' : 'border-[rgba(var(--border-color)/0.25)] text-[rgb(var(--text-secondary))]'}`}>
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* 数据管理 */}
          <section>
            <h4 className="text-sm font-semibold text-[rgb(var(--text-secondary))] mb-3">数据管理</h4>
            <div className="flex gap-2">
              <button onClick={handleExportAll} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm rounded-lg border border-[rgba(var(--border-color)/0.25)] text-[rgb(var(--text-secondary))] hover:bg-[rgba(var(--glass-bg)/0.2)] transition-colors"><Download size={16} />备份数据</button>
              <button onClick={handleImportAll} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm rounded-lg border border-[rgba(var(--border-color)/0.25)] text-[rgb(var(--text-secondary))] hover:bg-[rgba(var(--glass-bg)/0.2)] transition-colors"><Upload size={16} />恢复备份</button>
            </div>
          </section>

          {/* 开机启动 */}
          <section>
            <h4 className="text-sm font-semibold text-[rgb(var(--text-secondary))] mb-3 flex items-center gap-2"><Power size={16} /> 开机启动</h4>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-[rgb(var(--text-primary))]">系统启动时自动运行日历清单</span>
              <button onClick={() => handleAutoStart(!autoStart)}
                className={`relative w-10 h-5 rounded-full transition-colors ${autoStart ? 'bg-[rgb(var(--theme-color))]' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${autoStart ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
              </button>
            </label>
          </section>

          <section className="text-center text-xs text-[rgb(var(--text-tertiary))]">日历清单 v1.0.0 · 纯本地存储，数据安全</section>

          {message && <div className="text-center text-sm text-green-600 dark:text-green-400 animate-fade-in">{message}</div>}
        </div>
      </div>
    </div>
  )
}
