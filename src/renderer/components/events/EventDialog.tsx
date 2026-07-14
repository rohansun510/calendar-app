import { useState } from 'react'
import { X } from 'lucide-react'
import type { CalendarEvent, NewCalendarEvent } from '@/types'
import { RECURRENCE_OPTIONS, REMINDER_OPTIONS } from '@/types'
import { formatDateForInput, formatTimeForInput, getTodayStr } from '@/lib/calendar'

interface EventDialogProps {
  event?: CalendarEvent
  defaultDate?: string
  defaultStartTime?: string
  defaultEndTime?: string
  onSave: (data: NewCalendarEvent) => Promise<void>
  onClose: () => void
}

export default function EventDialog({
  event, defaultDate, defaultStartTime, defaultEndTime, onSave, onClose,
}: EventDialogProps) {
  const isEditing = !!event
  const [title, setTitle] = useState(event?.title || '')
  const [description, setDescription] = useState(event?.description || '')
  const [date, setDate] = useState(event ? formatDateForInput(event.startTime) : defaultDate || getTodayStr())
  const [startTime, setStartTime] = useState(event && !event.isAllDay ? formatTimeForInput(event.startTime) : formatTimeForInput(defaultStartTime || '2026-01-01T09:00:00'))
  const [endTime, setEndTime] = useState(event && !event.isAllDay ? formatTimeForInput(event.endTime) : formatTimeForInput(defaultEndTime || '2026-01-01T10:00:00'))
  const [isAllDay, setIsAllDay] = useState(event?.isAllDay || false)
  const [recurrence, setRecurrence] = useState(event?.recurrence || '')
  const [reminder, setReminder] = useState(event?.reminder ?? 15)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    const startTimeStr = isAllDay ? `${date}T00:00:00` : `${date}T${startTime}:00`
    const endTimeStr = isAllDay ? `${date}T23:59:59` : `${date}T${endTime}:00`
    await onSave({
      title: title.trim(), description,
      startTime: new Date(startTimeStr).toISOString(), endTime: new Date(endTimeStr).toISOString(),
      isAllDay, recurrence: recurrence || null, reminder, color: event?.color || null,
    })
    setSaving(false)
  }

  const inputClass = `w-full px-3 py-2 text-sm rounded-lg border border-[rgba(var(--border-color)/0.25)] bg-transparent text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--theme-color)/0.3)] placeholder:text-[rgb(var(--text-tertiary))]`

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[400px] glass-window rounded-xl animate-scale-in overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(var(--border-color)/0.2)]">
          <h3 className="text-base font-semibold">{isEditing ? '编辑日程' : '新建日程'}</h3>
          <button onClick={onClose} className="p-1 rounded-md text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgba(var(--glass-bg)/0.2)] transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="日程标题" className={inputClass} autoFocus required />
          <div>
            <label className="block text-xs text-[rgb(var(--text-secondary))] mb-1">日期</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </div>
          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={isAllDay} onChange={(e) => setIsAllDay(e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-[rgb(var(--theme-color))] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
            </label>
            <span className="text-sm text-[rgb(var(--text-secondary))]">全天事件</span>
          </div>
          {!isAllDay && (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs text-[rgb(var(--text-secondary))] mb-1">开始时间</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-[rgb(var(--text-secondary))] mb-1">结束时间</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} />
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs text-[rgb(var(--text-secondary))] mb-1">重复</label>
            <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)} className={inputClass}>
              {RECURRENCE_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[rgb(var(--text-secondary))] mb-1">提醒</label>
            <select value={reminder} onChange={(e) => setReminder(Number(e.target.value))} className={inputClass}>
              {REMINDER_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[rgb(var(--text-secondary))] mb-1">描述</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="添加描述..." rows={3} className={`${inputClass} resize-none`} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-[rgba(var(--border-color)/0.25)] text-[rgb(var(--text-secondary))] hover:bg-[rgba(var(--glass-bg)/0.2)] transition-colors">取消</button>
            <button type="submit" disabled={!title.trim() || saving} className="px-4 py-2 text-sm rounded-lg bg-[rgb(var(--theme-color))] text-white hover:opacity-90 transition-opacity disabled:opacity-50">{saving ? '保存中...' : isEditing ? '更新' : '创建'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
