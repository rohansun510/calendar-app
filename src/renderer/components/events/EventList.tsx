import { useEffect, useState } from 'react'
import { useEventStore } from '@/stores/eventStore'
import EventItem from './EventItem'
import EventDialog from './EventDialog'
import type { CalendarEvent, NewCalendarEvent } from '@/types'

interface EventListProps {
  selectedDate: string
}

export default function EventList({ selectedDate }: EventListProps) {
  const { selectedDateEvents, loadByDate, update, remove } = useEventStore()
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadByDate(selectedDate).finally(() => setLoading(false))
  }, [selectedDate])

  const handleUpdate = async (data: NewCalendarEvent) => {
    if (editingEvent) {
      await update(editingEvent.id, data)
      setEditingEvent(null)
    }
  }

  if (loading) {
    return (
      <div className="text-sm text-[rgb(var(--text-tertiary))] py-4 text-center">
        加载中...
      </div>
    )
  }

  if (selectedDateEvents.length === 0) {
    return (
      <div className="text-sm text-[rgb(var(--text-tertiary))] py-8 text-center">
        当天没有日程
      </div>
    )
  }

  return (
    <>
      <div className="space-y-1">
        {selectedDateEvents.map((event) => (
          <EventItem
            key={event.id}
            event={event}
            onEdit={() => setEditingEvent(event)}
            onDelete={() => remove(event.id)}
          />
        ))}
      </div>

      {editingEvent && (
        <EventDialog
          event={editingEvent}
          onSave={handleUpdate}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </>
  )
}
