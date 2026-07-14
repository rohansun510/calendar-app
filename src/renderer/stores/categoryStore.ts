import { create } from 'zustand'
import type { Category } from '@/types'
import * as ipc from '@/lib/ipc'

interface CategoryStore {
  categories: Category[]
  loading: boolean

  loadAll: () => Promise<void>
  create: (data: { name: string; color?: string }) => Promise<Category>
  update: (id: string, data: { name?: string; color?: string }) => Promise<Category>
  remove: (id: string) => Promise<void>
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: [],
  loading: false,

  loadAll: async () => {
    set({ loading: true })
    const categories = await ipc.getCategories()
    set({ categories, loading: false })
  },

  create: async (data) => {
    const category = await ipc.createCategory(data)
    set({ categories: [...get().categories, category] })
    return category
  },

  update: async (id, data) => {
    const category = await ipc.updateCategory(id, data)
    set({ categories: get().categories.map((c) => (c.id === id ? category : c)) })
    return category
  },

  remove: async (id) => {
    await ipc.deleteCategory(id)
    set({ categories: get().categories.filter((c) => c.id !== id) })
  },
}))
