import { writeFileSync, readFileSync } from 'fs'

interface IcsEvent {
  title: string
  description: string
  startTime: string
  endTime: string
  isAllDay: boolean
  recurrence: string | null
  reminder: number
  color: string | null
}

/**
 * 将数据库日程导出为 ICS 文件
 */
export function exportToIcs(filePath: string, events: any[]): void {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//日历清单//Calendar App//ZH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const event of events) {
    lines.push('BEGIN:VEVENT')

    // UID
    lines.push(`UID:${event.id}`)

    // 时间
    const startDate = new Date(event.start_time)
    const endDate = new Date(event.end_time)

    if (event.is_all_day) {
      lines.push(`DTSTART;VALUE=DATE:${formatIcsDate(startDate)}`)
      // 全天事件的结束日期 +1（ICS 规范）
      const nextDay = new Date(endDate)
      nextDay.setDate(nextDay.getDate() + 1)
      lines.push(`DTEND;VALUE=DATE:${formatIcsDate(nextDay)}`)
    } else {
      lines.push(`DTSTART:${formatIcsDateTime(startDate)}`)
      lines.push(`DTEND:${formatIcsDateTime(endDate)}`)
    }

    // 标题和描述
    lines.push(`SUMMARY:${escapeIcsText(event.title)}`)
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`)
    }

    // 重复规则
    if (event.recurrence) {
      lines.push(`RRULE:${event.recurrence}`)
    }

    // 提醒
    if (event.reminder > 0) {
      lines.push('BEGIN:VALARM')
      lines.push('ACTION:DISPLAY')
      lines.push(`DESCRIPTION:${escapeIcsText(event.title)}`)
      lines.push(`TRIGGER:-PT${event.reminder}M`)
      lines.push('END:VALARM')
    }

    // 时间戳
    lines.push(`DTSTAMP:${formatIcsDateTime(new Date())}`)
    lines.push(`CREATED:${formatIcsDateTime(new Date(event.created_at))}`)

    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  writeFileSync(filePath, lines.join('\r\n'), 'utf-8')
}

/**
 * 从 ICS 文件导入日程
 */
export function importFromIcs(filePath: string): IcsEvent[] {
  const content = readFileSync(filePath, 'utf-8')
  const events: IcsEvent[] = []

  // 简易 ICS 解析器
  const blocks = content.split('BEGIN:VEVENT')
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split('END:VEVENT')[0]
    const event = parseVEvent(block)
    if (event) {
      events.push(event)
    }
  }

  return events
}

/**
 * 解析单个 VEVENT 块
 */
function parseVEvent(block: string): IcsEvent | null {
  const lines = unfoldLines(block)
  const props: Record<string, string[]> = {}

  for (const line of lines) {
    const match = line.match(/^([A-Z-]+?)(?:;[^:]+)?:(.*)$/)
    if (match) {
      const key = match[1]
      const value = match[2]
      if (!props[key]) {
        props[key] = []
      }
      props[key].push(value)
    }
  }

  if (!props['SUMMARY'] || (!props['DTSTART'] && !props['DTSTART;VALUE=DATE'])) {
    return null
  }

  const title = props['SUMMARY'][0]
  const description = props['DESCRIPTION'] ? props['DESCRIPTION'][0] : ''

  let startTime: string
  let endTime: string
  let isAllDay = false

  const dtstartRaw = (props['DTSTART;VALUE=DATE'] || props['DTSTART'])[0]
  const dtendRaw = props['DTEND;VALUE=DATE'] ? props['DTEND;VALUE=DATE'][0]
    : props['DTEND'] ? props['DTEND'][0] : dtstartRaw

  if (props['DTSTART;VALUE=DATE']) {
    // 全天事件
    isAllDay = true
    startTime = parseIcsDate(dtstartRaw) + 'T00:00:00'
    const endDate = parseIcsDate(dtendRaw)
    // ICS 全天 DTEND 是 exclusive 的，减一天
    const end = new Date(endDate)
    end.setDate(end.getDate() - 1)
    endTime = end.toISOString().slice(0, 10) + 'T23:59:59'
  } else {
    startTime = parseIcsDateTime(dtstartRaw)
    endTime = parseIcsDateTime(dtendRaw)
  }

  const recurrence = props['RRULE'] ? props['RRULE'][0] : null

  // 解析提醒
  let reminder = 15
  if (block.includes('BEGIN:VALARM')) {
    const alarmBlocks = block.split('BEGIN:VALARM')
    if (alarmBlocks.length > 1) {
      const alarmBlock = alarmBlocks[1].split('END:VALARM')[0]
      const triggerMatch = alarmBlock.match(/TRIGGER:-PT(\d+)M/)
      if (triggerMatch) {
        reminder = parseInt(triggerMatch[1], 10)
      }
    }
  }

  return {
    title: unescapeIcsText(title),
    description: unescapeIcsText(description),
    startTime,
    endTime,
    isAllDay,
    recurrence,
    reminder,
    color: null,
  }
}

// ============================================================
// ICS 格式辅助函数
// ============================================================

function formatIcsDate(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '')
}

function formatIcsDateTime(date: Date): string {
  return date.toISOString().slice(0, 19).replace(/[-:]/g, '').replace(/\.\d{3}/, '') + 'Z'
  // Actually use local time:
  // const pad = (n: number) => String(n).padStart(2, '0')
  // return `${date.getFullYear()}${pad(date.getMonth()+1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

function parseIcsDate(raw: string): string {
  // 20260713 -> 2026-07-13
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
}

function parseIcsDateTime(raw: string): string {
  // 20260713T060000Z -> 2026-07-13T06:00:00
  const date = raw.slice(0, 8)
  const time = raw.slice(9, 15)
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}`
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function unescapeIcsText(text: string): string {
  return text.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\')
}

/**
 * 展开 ICS 的续行（以空格开头的行为续行）
 */
function unfoldLines(block: string): string[] {
  const lines: string[] = []
  let current = ''
  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith(' ')) {
      current += line.slice(1)
    } else {
      if (current) lines.push(current)
      current = line
    }
  }
  if (current) lines.push(current)
  return lines
}
