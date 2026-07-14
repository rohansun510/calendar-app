import { useState } from 'react'
import { Plus, Download, Upload } from 'lucide-react'
import MonthView from '@/components/calendar/MonthView'
import CalendarHeader from '@/components/calendar/CalendarHeader'
import EventDialog from '@/components/events/EventDialog'
import SettingsDialog from '@/components/settings/SettingsDialog'
import { useEventStore } from '@/stores/eventStore'
import { getDefaultEventTime, getTodayStr } from '@/lib/calendar'
import type { NewCalendarEvent } from '@/types'
import * as ipc from '@/lib/ipc'

interface SidebarProps {
  selectedDate: string
  onSelectDate: (date: string) => void
}

export default function Sidebar({ selectedDate, onSelectDate }: SidebarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const { create } = useEventStore()

  const handleAddEvent = async (data: NewCalendarEvent) => {
    await create(data)
    setShowEventDialog(false)
  }

  const handleExport = async () => {
    const result = await ipc.exportIcs()
    if (result.success) {
      // 简单提示
      console.log(result.message)
    }
  }

  const handleImport = async () => {
    const result = await ipc.importIcs()
    if (result.success) {
      console.log(result.message)
      // 刷新数据
      useEventStore.getState().loadAll()
    }
  }

  const defaultEvent = {
    ...getDefaultEventTime(),
    date: selectedDate,
  }

  return (
    <aside className="h-full glass-panel border-r border-[rgba(var(--border-color)/0.15)] flex flex-col">
      {/* 月份导航 */}
      <CalendarHeader
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
      />

      {/* 月历网格 */}
      <div className="flex-1 px-3">
        <MonthView
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          onMonthChange={setCurrentMonth}
        />
      </div>

      {/* 底部操作按钮 */}
      <div className="p-3 space-y-1.5 border-t border-[rgba(var(--border-color)/0.2)]">
        <button
          onClick={() => setShowEventDialog(true)}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg
                     bg-[rgb(var(--theme-color))] text-white
                     hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          添加日程
        </button>

        <div className="flex gap-1.5">
          <button
            onClick={handleImport}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs
                       rounded-lg border border-[rgba(var(--border-color)/0.25)]
                       text-[rgb(var(--text-secondary))]
                       hover:bg-[rgba(var(--glass-bg)/0.2)] transition-colors"
            title="导入 ICS 日程"
          >
            <Upload size={12} />
            导入
          </button>
          <button
            onClick={handleExport}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs
                       rounded-lg border border-[rgba(var(--border-color)/0.25)]
                       text-[rgb(var(--text-secondary))]
                       hover:bg-[rgba(var(--glass-bg)/0.2)] transition-colors"
            title="导出 ICS 日程"
          >
            <Download size={12} />
            导出
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center justify-center px-2 py-1.5 text-xs
                       rounded-lg border border-[rgba(var(--border-color)/0.25)]
                       text-[rgb(var(--text-secondary))]
                       hover:bg-[rgba(var(--glass-bg)/0.2)] transition-colors"
            title="设置"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* 弹窗 */}
      {showEventDialog && (
        <EventDialog
          defaultDate={selectedDate}
          defaultStartTime={defaultEvent.startTime}
          defaultEndTime={defaultEvent.endTime}
          onSave={handleAddEvent}
          onClose={() => setShowEventDialog(false)}
        />
      )}

      {showSettings && (
        <SettingsDialog onClose={() => setShowSettings(false)} />
      )}
    </aside>
  )
}
