import { create } from 'zustand'
import type { CalendarEvent, NewCalendarEvent } from '@/types'
import * as ipc from '@/lib/ipc'

interface EventStore {
  events: CalendarEvent[]
  selectedDateEvents: CalendarEvent[]
  loading: boolean

  loadAll: () => Promise<void>
  loadByDate: (date: string) => Promise<void>
  loadByRange: (start: string, end: string) => Promise<void>
  create: (data: NewCalendarEvent) => Promise<CalendarEvent>
  update: (id: string, data: Partial<NewCalendarEvent>) => Promise<CalendarEvent>
  remove: (id: string) => Promise<void>
}

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  selectedDateEvents: [],
  loading: false,

  loadAll: async () => {
    set({ loading: true })
    const events = await ipc.getEvents()
    set({ events, loading: false })
  },

  loadByDate: async (date: string) => {
    const events = await ipc.getEventsByDate(date)
    set({ selectedDateEvents: events })
  },

  loadByRange: async (start: string, end: string) => {
    set({ loading: true })
    const events = await ipc.getEventsByRange(start, end)
    set({ events, loading: false })
  },

  create: async (data: NewCalendarEvent) => {
    const event = await ipc.createEvent(data)
    set({ events: [...get().events, event] })
    return event
  },

  update: async (id: string, data: Partial<NewCalendarEvent>) => {
    const event = await ipc.updateEvent(id, data)
    set({
      events: get().events.map((e) => (e.id === id ? event : e)),
      selectedDateEvents: get().selectedDateEvents.map((e) => (e.id === id ? event : e)),
    })
    return event
  },

  remove: async (id: string) => {
    await ipc.deleteEvent(id)
    set({
      events: get().events.filter((e) => e.id !== id),
      selectedDateEvents: get().selectedDateEvents.filter((e) => e.id !== id),
    })
  },
}))
