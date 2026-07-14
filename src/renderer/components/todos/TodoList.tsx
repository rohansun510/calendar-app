import { useEffect, useState, useMemo } from 'react'
import { useTodoStore } from '@/stores/todoStore'
import { useCategoryStore } from '@/stores/categoryStore'
import TodoItem from './TodoItem'
import TodoDialog from './TodoDialog'
import type { Todo } from '@/types'
import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default function TodoList() {
  const { todos, loadAll, update, remove, toggle, create } = useTodoStore()
  const { categories } = useCategoryStore()
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [loading, setLoading] = useState(true)
  const [quickAdd, setQuickAdd] = useState('')

  useEffect(() => { loadAll().finally(() => setLoading(false)) }, [])

  const handleQuickAdd = async () => {
    if (!quickAdd.trim()) return
    await create({ title: quickAdd.trim(), description: '', priority: 0, dueDate: null, categoryId: null })
    setQuickAdd('')
  }

  const handleUpdate = async (data: Partial<Todo>) => {
    if (editingTodo) { await update(editingTodo.id, data); setEditingTodo(null) }
  }

  // 按截止日期分组
  const groupedTodos = useMemo(() => {
    const groups: { date: string | null; label: string; todos: Todo[] }[] = []
    const dateMap = new Map<string | null, Todo[]>()
    for (const todo of todos) {
      const key = todo.dueDate || null
      if (!dateMap.has(key)) dateMap.set(key, [])
      dateMap.get(key)!.push(todo)
    }
    const sortedKeys = [...dateMap.keys()].sort((a, b) => {
      if (a === null) return 1; if (b === null) return -1; return a.localeCompare(b)
    })
    for (const key of sortedKeys) {
      const items = dateMap.get(key)!
      items.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1
        return b.priority - a.priority
      })
      groups.push({ date: key, label: formatDateLabel(key), todos: items })
    }
    return groups
  }, [todos])

  const incompleteCount = todos.filter((t) => !t.completed).length

  if (loading) return <div className="text-sm text-[rgb(var(--text-tertiary))] py-4 text-center">加载中...</div>

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <input type="text" value={quickAdd} onChange={(e) => setQuickAdd(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
          placeholder="快速添加待办，回车确认"
          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[rgba(var(--border-color)/0.25)] bg-transparent text-[rgb(var(--text-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--theme-color)/0.3)] placeholder:text-[rgb(var(--text-tertiary))]" />
      </div>
      {groupedTodos.length === 0 ? (
        <div className="text-xs text-[rgb(var(--text-tertiary))] py-6 text-center">暂无待办事项</div>
      ) : (
        <div className="space-y-3">
          {groupedTodos.map((group) => (
            <div key={group.date || 'no-date'}>
              <div className="text-xs font-semibold text-[rgb(var(--text-secondary))] mb-1 px-1">
                {group.label}
                <span className="ml-1.5 font-normal text-[rgb(var(--text-tertiary))]">{group.todos.filter((t) => !t.completed).length}/{group.todos.length}</span>
              </div>
              <div className="space-y-0.5">
                {group.todos.map((todo) => {
                  const category = categories.find((c) => c.id === todo.categoryId)
                  return <TodoItem key={todo.id} todo={todo} category={category}
                    onToggle={() => toggle(todo.id)} onEdit={() => setEditingTodo(todo)} onDelete={() => remove(todo.id)} />
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      {incompleteCount > 0 && <div className="mt-3 text-xs text-[rgb(var(--text-tertiary))]">共 {incompleteCount} 项待完成</div>}
      {editingTodo && <TodoDialog todo={editingTodo} onSave={handleUpdate} onClose={() => setEditingTodo(null)} />}
    </div>
  )
}

function formatDateLabel(dateStr: string | null): string {
  if (!dateStr) return '📌 无截止日期'
  const date = parseISO(dateStr)
  if (isToday(date)) return '📅 今天'
  if (isTomorrow(date)) return '📅 明天'
  if (isYesterday(date)) return '📅 昨天'
  return `📅 ${format(date, 'M月d日 EEEE', { locale: zhCN })}`
}
