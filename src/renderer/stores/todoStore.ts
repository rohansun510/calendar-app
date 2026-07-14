import { create } from 'zustand'
import type { Todo, NewTodo } from '@/types'
import * as ipc from '@/lib/ipc'

interface TodoStore {
  todos: Todo[]
  loading: boolean

  loadAll: () => Promise<void>
  loadByDate: (date: string) => Promise<void>
  create: (data: NewTodo) => Promise<Todo>
  update: (id: string, data: Partial<Todo>) => Promise<Todo>
  remove: (id: string) => Promise<void>
  toggle: (id: string) => Promise<void>
}

export const useTodoStore = create<TodoStore>((set, get) => ({
  todos: [],
  loading: false,

  loadAll: async () => {
    set({ loading: true })
    const todos = await ipc.getTodos()
    set({ todos, loading: false })
  },

  loadByDate: async (date: string) => {
    const todos = await ipc.getTodosByDate(date)
    set({ todos })
  },

  create: async (data: NewTodo) => {
    const todo = await ipc.createTodo(data)
    set({ todos: [todo, ...get().todos] })
    return todo
  },

  update: async (id: string, data: Partial<Todo>) => {
    const todo = await ipc.updateTodo(id, data)
    set({ todos: get().todos.map((t) => (t.id === id ? todo : t)) })
    return todo
  },

  remove: async (id: string) => {
    await ipc.deleteTodo(id)
    set({ todos: get().todos.filter((t) => t.id !== id) })
  },

  toggle: async (id: string) => {
    const todo = await ipc.toggleTodo(id)
    set({ todos: get().todos.map((t) => (t.id === id ? todo : t)) })
  },
}))
