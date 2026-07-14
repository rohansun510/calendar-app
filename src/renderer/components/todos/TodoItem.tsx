import { Pencil, Trash2, Calendar, Tag } from 'lucide-react'
import type { Todo, Category } from '@/types'
import { PriorityLabel } from '@/types'

interface TodoItemProps {
  todo: Todo
  category?: Category
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

const priorityColors = {
  0: '',
  1: 'text-green-500',
  2: 'text-yellow-500',
  3: 'text-red-500',
}

const priorityDots = {
  0: '',
  1: '🟢',
  2: '🟡',
  3: '🔴',
}

export default function TodoItem({ todo, category, onToggle, onEdit, onDelete }: TodoItemProps) {
  const isOverdue = todo.dueDate && !todo.completed && new Date(todo.dueDate) < new Date(new Date().toDateString())

  return (
    <div
      className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-lg
                 hover:bg-[rgba(var(--glass-bg)/0.25)] transition-colors
                 ${todo.completed ? 'opacity-50' : ''}
                 ${isOverdue ? 'ring-1 ring-red-300 dark:ring-red-800' : ''}
                 animate-slide-up`}
    >
      {/* 复选框 */}
      <button
        onClick={onToggle}
        className={`mac-checkbox ${todo.completed ? 'checked' : ''}`}
        style={todo.completed ? { background: 'rgb(var(--theme-color))', borderColor: 'rgb(var(--theme-color))' } : {}}
      />

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <span
          className={`text-sm ${
            todo.completed ? 'line-through text-[rgb(var(--text-tertiary))]' : 'text-[rgb(var(--text-primary))]'
          }`}
        >
          {todo.title}
        </span>

        {/* 标签行 */}
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {/* 优先级 */}
          {todo.priority > 0 && (
            <span className={`text-xs ${priorityColors[todo.priority]}`}>
              {priorityDots[todo.priority]} {PriorityLabel[todo.priority]}
            </span>
          )}

          {/* 截止日期 */}
          {todo.dueDate && (
            <span className={`text-xs flex items-center gap-0.5 ${
              isOverdue ? 'text-red-500 font-medium' : 'text-[rgb(var(--text-tertiary))]'
            }`}>
              <Calendar size={10} />
              {formatDueDate(todo.dueDate)}
            </span>
          )}

          {/* 分类标签 */}
          {category && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${category.color}20`,
                color: category.color,
              }}
            >
              {category.name}
            </span>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1 rounded-md text-[rgb(var(--text-tertiary))]
                     hover:text-[rgb(var(--text-primary))]
                     hover:bg-[rgba(var(--glass-bg)/0.2)] transition-colors"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded-md text-[rgb(var(--text-tertiary))]
                     hover:text-red-500
                     hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function formatDueDate(dateStr: string): string {
  const due = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (dateStr === today.toISOString().slice(0, 10)) return '今天到期'
  if (dateStr === tomorrow.toISOString().slice(0, 10)) return '明天到期'

  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return `已过期 ${Math.abs(diffDays)} 天`
  if (diffDays <= 7) return `${diffDays} 天后到期`

  return `${due.getMonth() + 1}/${due.getDate()}`
}
