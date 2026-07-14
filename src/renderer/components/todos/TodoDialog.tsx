import { useState } from 'react'
import { X } from 'lucide-react'
import type { Todo, Category } from '@/types'
import { PriorityLabel } from '@/types'
import { useCategoryStore } from '@/stores/categoryStore'
import { getTodayStr } from '@/lib/calendar'

interface TodoDialogProps {
  todo?: Todo
  defaultDate?: string
  onSave: (data: Partial<Todo>) => Promise<void>
  onClose: () => void
}

export default function TodoDialog({ todo, defaultDate, onSave, onClose }: TodoDialogProps) {
  const isEditing = !!todo
  const { categories } = useCategoryStore()

  const [title, setTitle] = useState(todo?.title || '')
  const [description, setDescription] = useState(todo?.description || '')
  const [priority, setPriority] = useState(todo?.priority || 0)
  const [dueDate, setDueDate] = useState(todo?.dueDate || defaultDate || '')
  const [categoryId, setCategoryId] = useState(todo?.categoryId || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSaving(true)
    await onSave({
      title: title.trim(),
      description,
      priority: priority as Todo['priority'],
      dueDate: dueDate || null,
      categoryId: categoryId || null,
    })
    setSaving(false)
  }

  const inputClass = `w-full px-3 py-2 text-sm rounded-lg border border-[rgba(var(--border-color)/0.25)]
    bg-transparent text-[rgb(var(--text-primary))]
    focus:outline-none focus:ring-2 focus:ring-[rgb(var(--theme-color)/0.3)]
    placeholder:text-[rgb(var(--text-tertiary))]`

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[380px] glass-window rounded-xl animate-scale-in overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(var(--border-color)/0.2)]">
          <h3 className="text-base font-semibold">
            {isEditing ? '编辑待办' : '新建待办'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[rgb(var(--text-tertiary))]
                       hover:text-[rgb(var(--text-primary))]
                       hover:bg-[rgba(var(--glass-bg)/0.2)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* 标题 */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="待办标题"
            className={inputClass}
            autoFocus
            required
          />

          {/* 优先级 */}
          <div>
            <label className="block text-xs text-[rgb(var(--text-secondary))] mb-1">
              优先级
            </label>
            <div className="flex gap-2">
              {([0, 1, 2, 3] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 text-xs rounded-lg border transition-all ${
                    priority === p
                      ? 'border-[rgb(var(--theme-color))] bg-[rgb(var(--theme-color))/0.1] text-[rgb(var(--text-primary))]'
                      : 'border-[rgba(var(--border-color)/0.25)] text-[rgb(var(--text-secondary))]'
                  }`}
                >
                  {p === 0 ? '无' : `${['', '🟢', '🟡', '🔴'][p]} ${PriorityLabel[p]}`}
                </button>
              ))}
            </div>
          </div>

          {/* 截止日期 */}
          <div>
            <label className="block text-xs text-[rgb(var(--text-secondary))] mb-1">
              截止日期
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`${inputClass} flex-1`}
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate('')}
                  className="px-3 py-2 text-xs rounded-lg border border-[rgba(var(--border-color)/0.25)]
                             text-[rgb(var(--text-secondary))]
                             hover:bg-[rgba(var(--glass-bg)/0.2)] transition-colors"
                >
                  清除
                </button>
              )}
            </div>
          </div>

          {/* 分类 */}
          <div>
            <label className="block text-xs text-[rgb(var(--text-secondary))] mb-1">
              分类
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputClass}
            >
              <option value="">无分类</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-xs text-[rgb(var(--text-secondary))] mb-1">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="添加描述..."
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* 按钮 */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-[rgba(var(--border-color)/0.25)]
                         text-[rgb(var(--text-secondary))]
                         hover:bg-[rgba(var(--glass-bg)/0.2)] transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!title.trim() || saving}
              className="px-4 py-2 text-sm rounded-lg bg-[rgb(var(--theme-color))] text-white
                         hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? '保存中...' : isEditing ? '更新' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
