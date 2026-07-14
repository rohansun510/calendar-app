import { Notification, BrowserWindow } from 'electron'
import * as cron from 'node-cron'
import { queryAll } from './database'

let cronJob: cron.ScheduledTask | null = null

interface ReminderEvent {
  id: string
  title: string
  start_time: string
  reminder: number
}

function checkAndNotify(mainWindow: BrowserWindow): void {
  const now = new Date()

  const events = queryAll(
    `SELECT id, title, start_time, reminder
     FROM events
     WHERE reminder > 0
       AND datetime(start_time) > datetime('now', 'localtime')
     ORDER BY start_time ASC`
  ) as ReminderEvent[]

  for (const event of events) {
    const startTime = new Date(event.start_time)
    const notifyTime = new Date(startTime.getTime() - event.reminder * 60 * 1000)
    const diff = Math.abs(now.getTime() - notifyTime.getTime())

    if (diff <= 30000) {
      const notification = new Notification({
        title: '📅 日程提醒',
        body: `${event.title}\n${formatTimeDisplay(startTime)}`,
        silent: false,
      })

      notification.on('click', () => {
        mainWindow.show()
        mainWindow.focus()
      })

      notification.show()
      console.log(`[通知] 已发送提醒: ${event.title}`)
    }
  }
}

function formatTimeDisplay(date: Date): string {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  if (date.toDateString() === now.toDateString()) return `今天 ${timeStr}`
  if (date.toDateString() === tomorrow.toDateString()) return `明天 ${timeStr}`
  return `${date.getMonth() + 1}月${date.getDate()}日 ${timeStr}`
}

export function startReminderChecker(mainWindow: BrowserWindow): void {
  checkAndNotify(mainWindow)
  cronJob = cron.schedule('*/30 * * * * *', () => {
    checkAndNotify(mainWindow)
  })
  console.log('[通知] 提醒检查器已启动')
}

export function stopReminderChecker(): void {
  if (cronJob) {
    cronJob.stop()
    cronJob = null
    console.log('[通知] 提醒检查器已停止')
  }
}
