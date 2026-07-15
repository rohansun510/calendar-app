const { app, BrowserWindow, shell, ipcMain, Notification, Tray, Menu, nativeImage } = require('electron')
const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')
const initSqlJs = require('sql.js')
const { v4: uuidv4 } = require('uuid')
const cron = require('node-cron')

// ============================================================
// 数据库层
// ============================================================
let db = null

function getDbPath() {
  const userDataPath = app.getPath('userData')
  if (!fs.existsSync(userDataPath)) fs.mkdirSync(userDataPath, { recursive: true })
  return path.join(userDataPath, 'calendar-data.db')
}

function saveDb() { if (db) fs.writeFileSync(getDbPath(), Buffer.from(db.export())) }

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql)
  if (params.length) stmt.bind(params)
  const rows = []; while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free(); return rows
}

function queryOne(sql, params = []) { const r = queryAll(sql, params); return r[0] || null }

function execute(sql, params = []) { db.run(sql, params); saveDb() }

async function initDatabase() {
  const dbPath = getDbPath()
  console.log('[DB] 路径:', dbPath)
  const SQL = await initSqlJs()
  db = fs.existsSync(dbPath) ? new SQL.Database(fs.readFileSync(dbPath)) : new SQL.Database()

  db.run(`CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT DEFAULT '',
    start_time TEXT NOT NULL, end_time TEXT NOT NULL, is_all_day INTEGER DEFAULT 0,
    recurrence TEXT DEFAULT NULL, reminder INTEGER DEFAULT 15, color TEXT DEFAULT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')), updated_at TEXT DEFAULT (datetime('now','localtime')))`)
  db.run(`CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT DEFAULT '',
    completed INTEGER DEFAULT 0, priority INTEGER DEFAULT 0, due_date TEXT DEFAULT NULL,
    category_id TEXT DEFAULT NULL, sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime')), updated_at TEXT DEFAULT (datetime('now','localtime')))`)
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT DEFAULT '#6b7280',
    created_at TEXT DEFAULT (datetime('now','localtime')))`)
  db.run(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`)
  db.run(`CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id TEXT PRIMARY KEY, todo_id TEXT DEFAULT NULL,
    start_time TEXT NOT NULL, end_time TEXT DEFAULT NULL,
    duration_minutes INTEGER NOT NULL, actual_minutes INTEGER DEFAULT 0,
    status TEXT DEFAULT 'running', category TEXT DEFAULT 'focus',
    created_at TEXT DEFAULT (datetime('now','localtime')))`)
  if (queryOne('SELECT COUNT(*) as c FROM categories').c === 0) {
    execute('INSERT INTO categories (id,name,color) VALUES (?,?,?)', ['cat_work','工作','#ef4444'])
    execute('INSERT INTO categories (id,name,color) VALUES (?,?,?)', ['cat_personal','个人','#3b82f6'])
    execute('INSERT INTO categories (id,name,color) VALUES (?,?,?)', ['cat_study','学习','#10b981'])
  }
  if (queryOne('SELECT COUNT(*) as c FROM settings').c === 0) {
    execute('INSERT INTO settings (key,value) VALUES (?,?)', ['app_settings',
      JSON.stringify({ themeColor:'#4b5563', themeMode:'system', weekStartDay:1, language:'zh-CN', fontSize:'medium', glassOpacity:55, sidebarPosition:'left' })])
  }
  saveDb()
  console.log('[DB] 初始化完成')
}

// ============================================================
// 提醒通知
// ============================================================
let cronJob = null

function startReminderChecker(mainWindow) {
  const check = () => {
    const now = new Date()
    const events = queryAll("SELECT id,title,start_time,reminder FROM events WHERE reminder>0 AND datetime(start_time)>datetime('now','localtime') ORDER BY start_time ASC")
    for (const ev of events) {
      const st = new Date(ev.start_time)
      if (Math.abs(now - new Date(st.getTime() - ev.reminder * 60000)) <= 30000) {
        const n = new Notification({ title: '📅 日程提醒', body: `${ev.title}\n${st.toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'})}` })
        n.on('click', () => { mainWindow.show(); mainWindow.focus() })
        n.show()
      }
    }
  }
  check()
  cronJob = cron.schedule('*/30 * * * * *', check)
}

function stopReminderChecker() { if (cronJob) { cronJob.stop(); cronJob = null } }

// ============================================================
// ICS 导入导出
// ============================================================
function pad(n) { return String(n).padStart(2, '0') }
function fmtIcsDate(d) { return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}` }
function fmtIcsDt(d) { return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}` }
function parseIcsDate(s) { return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}` }
function parseIcsDt(s) { const d=s.slice(0,8),t=s.slice(9,15); return `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}T${t.slice(0,2)}:${t.slice(2,4)}:${t.slice(4,6)}` }
function esc(s) { return s.replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n') }
function unesc(s) { return s.replace(/\\n/g,'\n').replace(/\\,/g,',').replace(/\\;/g,';').replace(/\\\\/g,'\\') }

function exportToIcs(events, filePath) {
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//日历清单//ZH','CALSCALE:GREGORIAN','METHOD:PUBLISH']
  for (const ev of events) {
    lines.push('BEGIN:VEVENT', `UID:${ev.id}`)
    const sd = new Date(ev.start_time), ed = new Date(ev.end_time)
    if (ev.is_all_day) {
      lines.push(`DTSTART;VALUE=DATE:${fmtIcsDate(sd)}`)
      const nd = new Date(ed); nd.setDate(nd.getDate()+1)
      lines.push(`DTEND;VALUE=DATE:${fmtIcsDate(nd)}`)
    } else {
      lines.push(`DTSTART:${fmtIcsDt(sd)}`, `DTEND:${fmtIcsDt(ed)}`)
    }
    lines.push(`SUMMARY:${esc(ev.title)}`)
    if (ev.description) lines.push(`DESCRIPTION:${esc(ev.description)}`)
    if (ev.recurrence) lines.push(`RRULE:${ev.recurrence}`)
    if (ev.reminder > 0) {
      lines.push('BEGIN:VALARM','ACTION:DISPLAY',`DESCRIPTION:${esc(ev.title)}`,`TRIGGER:-PT${ev.reminder}M`,'END:VALARM')
    }
    lines.push(`DTSTAMP:${fmtIcsDt(new Date())}`,`CREATED:${fmtIcsDt(new Date(ev.created_at))}`,'END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  fs.writeFileSync(filePath, lines.join('\r\n'), 'utf-8')
}

function importFromIcs(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const events = []
  const blocks = content.split('BEGIN:VEVENT')
  for (let i = 1; i < blocks.length; i++) {
    const e = parseVEvent(blocks[i].split('END:VEVENT')[0])
    if (e) events.push(e)
  }
  return events
}

function parseVEvent(block) {
  const lines = unfoldLines(block), props = {}
  for (const l of lines) {
    const m = l.match(/^([A-Z-]+?)(?:;[^:]+)?:(.*)$/)
    if (m) { if (!props[m[1]]) props[m[1]] = []; props[m[1]].push(m[2]) }
  }
  if (!props['SUMMARY']) return null
  let startTime, endTime, isAllDay = false
  if (props['DTSTART;VALUE=DATE']) {
    isAllDay = true
    startTime = parseIcsDate(props['DTSTART;VALUE=DATE'][0]) + 'T00:00:00'
    const ed = props['DTEND;VALUE=DATE'] ? parseIcsDate(props['DTEND;VALUE=DATE'][0]) : props['DTSTART;VALUE=DATE'][0]
    const end = new Date(ed); end.setDate(end.getDate()-1)
    endTime = end.toISOString().slice(0,10) + 'T23:59:59'
  } else {
    startTime = parseIcsDt(props['DTSTART'][0])
    endTime = parseIcsDt(props['DTEND'] ? props['DTEND'][0] : props['DTSTART'][0])
  }
  let reminder = 15
  const am = block.match(/TRIGGER:-PT(\d+)M/)
  if (am) reminder = parseInt(am[1])
  return { title:unesc(props['SUMMARY'][0]), description:props['DESCRIPTION']?unesc(props['DESCRIPTION'][0]):'', startTime, endTime, isAllDay, recurrence:props['RRULE']?props['RRULE'][0]:null, reminder, color:null }
}

function unfoldLines(block) {
  const r = []; let c = ''
  for (const l of block.split(/\r?\n/)) { if (l.startsWith(' ')) c += l.slice(1); else { if (c) r.push(c); c = l } }
  if (c) r.push(c); return r
}

// ============================================================
// IPC 处理
// ============================================================
function registerIpc() {
  // 日程
  ipcMain.handle('events:get-all', () => queryAll('SELECT * FROM events ORDER BY start_time ASC'))
  ipcMain.handle('events:get-by-date', (_, d) => queryAll("SELECT * FROM events WHERE date(start_time)<=date(?) AND date(end_time)>=date(?) ORDER BY is_all_day DESC, start_time ASC", [d,d]))
  ipcMain.handle('events:get-by-range', (_, s, e) => queryAll("SELECT * FROM events WHERE date(start_time)<=date(?) AND date(end_time)>=date(?) ORDER BY start_time ASC", [e,s]))
  ipcMain.handle('events:create', (_, data) => {
    const id = uuidv4()
    execute('INSERT INTO events (id,title,description,start_time,end_time,is_all_day,recurrence,reminder,color) VALUES (?,?,?,?,?,?,?,?,?)', [id,data.title,data.description||'',data.startTime,data.endTime,data.isAllDay?1:0,data.recurrence||null,data.reminder??15,data.color||null])
    return queryOne('SELECT * FROM events WHERE id=?', [id])
  })
  ipcMain.handle('events:update', (_, id, data) => {
    execute("UPDATE events SET title=?,description=?,start_time=?,end_time=?,is_all_day=?,recurrence=?,reminder=?,color=?,updated_at=datetime('now','localtime') WHERE id=?", [data.title,data.description||'',data.startTime,data.endTime,data.isAllDay?1:0,data.recurrence||null,data.reminder??15,data.color||null,id])
    return queryOne('SELECT * FROM events WHERE id=?', [id])
  })
  ipcMain.handle('events:delete', (_, id) => { execute('DELETE FROM events WHERE id=?', [id]); return {success:true} })

  // 待办
  ipcMain.handle('todos:get-all', () => queryAll('SELECT * FROM todos ORDER BY completed ASC, priority DESC, sort_order ASC'))
  ipcMain.handle('todos:get-by-date', (_, d) => queryAll("SELECT * FROM todos WHERE due_date=? OR due_date IS NULL ORDER BY completed ASC, priority DESC, sort_order ASC", [d]))
  ipcMain.handle('todos:create', (_, data) => {
    const id = uuidv4()
    const mx = queryOne('SELECT MAX(sort_order) as m FROM todos')
    execute('INSERT INTO todos (id,title,description,priority,due_date,category_id,sort_order) VALUES (?,?,?,?,?,?,?)', [id,data.title,data.description||'',data.priority??0,data.dueDate||null,data.categoryId||null,(mx?.m??0)+1])
    return queryOne('SELECT * FROM todos WHERE id=?', [id])
  })
  ipcMain.handle('todos:update', (_, id, data) => {
    execute("UPDATE todos SET title=?,description=?,priority=?,due_date=?,category_id=?,updated_at=datetime('now','localtime') WHERE id=?", [data.title,data.description||'',data.priority??0,data.dueDate||null,data.categoryId||null,id])
    return queryOne('SELECT * FROM todos WHERE id=?', [id])
  })
  ipcMain.handle('todos:delete', (_, id) => { execute('DELETE FROM todos WHERE id=?', [id]); return {success:true} })
  ipcMain.handle('todos:toggle', (_, id) => {
    const t = queryOne('SELECT completed FROM todos WHERE id=?', [id])
    if (t) execute("UPDATE todos SET completed=?,updated_at=datetime('now','localtime') WHERE id=?", [t.completed?0:1,id])
    return queryOne('SELECT * FROM todos WHERE id=?', [id])
  })
  ipcMain.handle('todos:reorder', (_, ids) => { ids.forEach((id,i) => execute('UPDATE todos SET sort_order=? WHERE id=?',[i,id])); return {success:true} })

  // 番茄钟
  ipcMain.handle('pomodoro:get-all', () => queryAll('SELECT * FROM pomodoro_sessions ORDER BY created_at DESC'))
  ipcMain.handle('pomodoro:get-today', () => queryAll("SELECT * FROM pomodoro_sessions WHERE date(start_time)=date('now','localtime') ORDER BY created_at DESC"))
  ipcMain.handle('pomodoro:create', (_, data) => {
    const id = uuidv4()
    execute('INSERT INTO pomodoro_sessions (id,todo_id,start_time,duration_minutes,status,category) VALUES (?,?,?,?,?,?)',
      [id, data.todoId || null, data.startTime, data.durationMinutes, data.status || 'running', data.category || 'focus'])
    return queryOne('SELECT * FROM pomodoro_sessions WHERE id=?', [id])
  })
  ipcMain.handle('pomodoro:update', (_, id, data) => {
    execute("UPDATE pomodoro_sessions SET end_time=?,actual_minutes=?,status=? WHERE id=?",
      [data.endTime || null, data.actualMinutes || 0, data.status, id])
    return queryOne('SELECT * FROM pomodoro_sessions WHERE id=?', [id])
  })
  ipcMain.handle('pomodoro:delete', (_, id) => { execute('DELETE FROM pomodoro_sessions WHERE id=?', [id]); return {success:true} })

  // 分类
  ipcMain.handle('categories:get-all', () => queryAll('SELECT * FROM categories ORDER BY created_at ASC'))
  ipcMain.handle('categories:create', (_, data) => {
    const id = uuidv4()
    execute('INSERT INTO categories (id,name,color) VALUES (?,?,?)', [id,data.name,data.color||'#6b7280'])
    return queryOne('SELECT * FROM categories WHERE id=?', [id])
  })
  ipcMain.handle('categories:update', (_, id, data) => {
    execute('UPDATE categories SET name=?,color=? WHERE id=?', [data.name,data.color||'#6b7280',id])
    return queryOne('SELECT * FROM categories WHERE id=?', [id])
  })
  ipcMain.handle('categories:delete', (_, id) => {
    execute('UPDATE todos SET category_id=NULL WHERE category_id=?', [id])
    execute('DELETE FROM categories WHERE id=?', [id])
    return {success:true}
  })

  // 设置
  ipcMain.handle('settings:get', () => { const r = queryOne("SELECT value FROM settings WHERE key='app_settings'"); return r ? JSON.parse(r.value) : null })
  ipcMain.handle('settings:update', (_, s) => { execute("INSERT OR REPLACE INTO settings (key,value) VALUES ('app_settings',?)", [JSON.stringify(s)]); return s })

  // 导入导出
  ipcMain.handle('export:ics', async (_, range) => {
    const r = await require('electron').dialog.showSaveDialog({ title:'导出日程', defaultPath:`calendar-${new Date().toISOString().slice(0,10)}.ics`, filters:[{name:'ICS',extensions:['ics']}] })
    if (r.canceled) return {success:false,message:'已取消'}
    const events = range ? queryAll('SELECT * FROM events WHERE date(start_time)<=date(?) AND date(end_time)>=date(?) ORDER BY start_time ASC',[range.end,range.start]) : queryAll('SELECT * FROM events ORDER BY start_time ASC')
    exportToIcs(events, r.filePath)
    return {success:true,message:`成功导出 ${events.length} 条日程`}
  })
  ipcMain.handle('import:ics', async () => {
    const r = await require('electron').dialog.showOpenDialog({ title:'导入日程', filters:[{name:'ICS',extensions:['ics']}], properties:['openFile'] })
    if (r.canceled) return {success:false,message:'已取消'}
    const events = importFromIcs(r.filePaths[0])
    for (const ev of events) execute('INSERT INTO events (id,title,description,start_time,end_time,is_all_day,recurrence,reminder,color) VALUES (?,?,?,?,?,?,?,?,?)', [uuidv4(),ev.title,ev.description,ev.startTime,ev.endTime,ev.isAllDay?1:0,ev.recurrence,ev.reminder??15,ev.color])
    return {success:true,message:`成功导入 ${events.length} 条日程`}
  })
  ipcMain.handle('export:json', async () => {
    const r = await require('electron').dialog.showSaveDialog({ title:'备份数据', defaultPath:`backup-${new Date().toISOString().slice(0,10)}.json`, filters:[{name:'JSON',extensions:['json']}] })
    if (r.canceled) return {success:false,message:'已取消'}
    const data = { events:queryAll('SELECT * FROM events'), todos:queryAll('SELECT * FROM todos'), categories:queryAll('SELECT * FROM categories'), settings:queryAll('SELECT * FROM settings') }
    fs.writeFileSync(r.filePath, JSON.stringify(data,null,2),'utf-8')
    return {success:true,message:`成功备份 ${data.events.length} 条日程, ${data.todos.length} 条待办`}
  })
  ipcMain.handle('import:json', async () => {
    const r = await require('electron').dialog.showOpenDialog({ title:'恢复备份', filters:[{name:'JSON',extensions:['json']}], properties:['openFile'] })
    if (r.canceled) return {success:false,message:'已取消'}
    const raw = fs.readFileSync(r.filePaths[0],'utf-8')
    const data = JSON.parse(raw)
    const imp = (table, rows) => { if(!rows||!rows.length) return; execute(`DELETE FROM ${table}`); const cols=Object.keys(rows[0]); for(const row of rows) execute(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${cols.map(()=>'?').join(',')})`, Object.values(row)) }
    imp('categories', data.categories||[]); imp('events', data.events||[]); imp('todos', data.todos||[]); imp('settings', data.settings||[])
    return {success:true,message:`成功恢复 ${(data.events||[]).length} 条日程, ${(data.todos||[]).length} 条待办`}
  })
}

// ============================================================
// 窗口管理
// ============================================================
let mainWindow = null
let tray = null
let isQuitting = false

// ============================================================
// 窗口置于底层（Windows API）
// ============================================================
function moveWindowToBottom(win) {
  try {
    const hwndBuf = win.getNativeWindowHandle()
    const hwnd = hwndBuf.readBigUInt64LE(0)
    // HWND_BOTTOM = 1, flags = SWP_NOMOVE|SWP_NOSIZE|SWP_NOACTIVATE = 0x0013
    // 写入临时 .bat 用 start /min 执行，确保无窗口闪现
    const ps = `Add-Type -Name W32 -Namespace T -MemberDefinition '[DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h,IntPtr a,int x,int y,int c,int cy,uint f);';[T.W32]::SetWindowPos([IntPtr]::new(${hwnd}),[IntPtr]::new(1),0,0,0,0,0x0013)`
    const bat = path.join(app.getPath('temp'), 'cal-bg.bat')
    fs.writeFileSync(bat, `@echo off\r\nstart /min powershell -NoProfile -Command "${ps}"\r\ndel "%~f0"\r\n`)
    exec(`start /min cmd /c "${bat}"`, { windowsHide: true })
  } catch (e) {
    console.error('[底层] 错误:', e.message)
  }
}

function createTray() {
  // 日历风格托盘图标
  const iconPath = path.join(__dirname, '../../resources/tray-icon.png')
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
  tray = new Tray(icon)
  tray.setToolTip('日历清单')

  const contextMenu = Menu.buildFromTemplate([
    { label: '显示窗口', click: () => { mainWindow?.show(); mainWindow?.focus() } },
    { type: 'separator' },
    { label: '退出', click: () => { isQuitting = true; app.quit() } },
  ])
  tray.setContextMenu(contextMenu)

  // 双击托盘图标显示窗口
  tray.on('double-click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
}

function createWindow() {
  // 恢复上次的窗口位置和大小
  const savedBounds = queryOne("SELECT value FROM settings WHERE key='window_bounds'")
  let bounds = { width: 400, height: 600 }
  if (savedBounds) {
    try {
      const saved = JSON.parse(savedBounds.value)
      if (saved.width >= 340 && saved.height >= 420) {
        bounds = saved
      }
    } catch (e) { /* ignore */ }
  }

  mainWindow = new BrowserWindow({
    width: bounds.width, height: bounds.height,
    minWidth: 340, minHeight: 420,
    show: false, frame: false, titleBarStyle: 'hidden',
    resizable: true,
    skipTaskbar: true,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: false,
    },
  })

  // 恢复窗口位置（如果有保存）
  if (bounds.x !== undefined && bounds.y !== undefined) {
    mainWindow.setPosition(bounds.x, bounds.y)
  }

  // 窗口移动/调整大小时保存位置和大小（防抖 1 秒）
  let saveBoundsTimer = null
  const saveBounds = () => {
    if (saveBoundsTimer) clearTimeout(saveBoundsTimer)
    saveBoundsTimer = setTimeout(() => {
      if (!mainWindow || mainWindow.isDestroyed()) return
      // 最大化时不保存
      if (mainWindow.isMaximized()) return
      const b = mainWindow.getBounds()
      execute("INSERT OR REPLACE INTO settings (key,value) VALUES ('window_bounds',?)", [JSON.stringify(b)])
    }, 1000)
  }
  mainWindow.on('move', saveBounds)
  mainWindow.on('resize', saveBounds)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    // 置于底层
    moveWindowToBottom(mainWindow)
  })

  // 窗口获得焦点时重新压入底层（阻止点击将窗口带到前台）
  mainWindow.on('focus', () => {
    moveWindowToBottom(mainWindow)
  })

  // 点击 ✕ 不退出，隐藏到托盘
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  const isDev = !app.isPackaged
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // 窗口控制 IPC
  ipcMain.handle('window:minimize', () => mainWindow?.minimize())
  ipcMain.handle('window:maximize', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize())
  ipcMain.handle('window:close', () => mainWindow?.hide())
  ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false)
  ipcMain.handle('window:show', () => { mainWindow?.show(); mainWindow?.focus(); moveWindowToBottom(mainWindow) })
  ipcMain.handle('window:lock', (_e, locked) => { mainWindow?.setResizable(!locked); mainWindow?.setMovable(!locked) })
  ipcMain.handle('window:isLocked', () => !(mainWindow?.isResizable() ?? true))
  mainWindow.on('maximize', () => mainWindow?.webContents.send('window:maximizeChange', true))
  mainWindow.on('unmaximize', () => mainWindow?.webContents.send('window:maximizeChange', false))

  // 开机自启（使用 Electron 原生 API，写入注册表）
  ipcMain.handle('app:setAutoStart', (_e, enable) => {
    if (enable && !app.isPackaged) {
      console.warn('[开机自启] 开发模式下不支持开机自启，请使用正式版')
      return enable
    }
    app.setLoginItemSettings({ openAtLogin: enable })
    return enable
  })
  ipcMain.handle('app:getAutoStart', () => app.getLoginItemSettings().openAtLogin)
}

// ============================================================
// 启动
// ============================================================
app.whenReady().then(async () => {
  await initDatabase()
  registerIpc()
  createTray()
  createWindow()
  startReminderChecker(mainWindow)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
    else mainWindow?.show()
  })
})

app.on('window-all-closed', () => {
  stopReminderChecker()
  // 不退出应用，托盘保持运行
})

app.on('before-quit', () => {
  isQuitting = true
  stopReminderChecker()
})
