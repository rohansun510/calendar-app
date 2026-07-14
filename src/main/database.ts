import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'

let db: SqlJsDatabase | null = null

/**
 * 获取数据库文件路径
 */
function getDbPath(): string {
  const userDataPath = app.getPath('userData')
  if (!existsSync(userDataPath)) {
    mkdirSync(userDataPath, { recursive: true })
  }
  return join(userDataPath, 'calendar-data.db')
}

/**
 * 保存数据库到文件
 */
function saveDb(): void {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  writeFileSync(getDbPath(), buffer)
}

/**
 * 初始化数据库
 */
export async function initDatabase(): Promise<void> {
  const dbPath = getDbPath()
  console.log('[DB] 数据库路径:', dbPath)

  const SQL = await initSqlJs()

  // 尝试加载已有数据库
  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath)
    db = new SQL.Database(buffer)
    console.log('[DB] 已加载现有数据库')
  } else {
    db = new SQL.Database()
    console.log('[DB] 已创建新数据库')
  }

  // 创建表
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id            TEXT PRIMARY KEY,
      title         TEXT NOT NULL,
      description   TEXT DEFAULT '',
      start_time    TEXT NOT NULL,
      end_time      TEXT NOT NULL,
      is_all_day    INTEGER DEFAULT 0,
      recurrence    TEXT DEFAULT NULL,
      reminder      INTEGER DEFAULT 15,
      color         TEXT DEFAULT NULL,
      created_at    TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at    TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id            TEXT PRIMARY KEY,
      title         TEXT NOT NULL,
      description   TEXT DEFAULT '',
      completed     INTEGER DEFAULT 0,
      priority      INTEGER DEFAULT 0,
      due_date      TEXT DEFAULT NULL,
      category_id   TEXT DEFAULT NULL,
      sort_order    INTEGER DEFAULT 0,
      created_at    TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at    TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      color         TEXT DEFAULT '#6b7280',
      created_at    TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key           TEXT PRIMARY KEY,
      value         TEXT NOT NULL
    )
  `)

  // 预置分类
  const catResult = db.exec('SELECT COUNT(*) as count FROM categories')
  const catCount = catResult[0]?.values[0]?.[0] ?? 0
  if (catCount === 0) {
    db.run('INSERT OR IGNORE INTO categories (id, name, color) VALUES (?, ?, ?)', ['cat_work', '工作', '#ef4444'])
    db.run('INSERT OR IGNORE INTO categories (id, name, color) VALUES (?, ?, ?)', ['cat_personal', '个人', '#3b82f6'])
    db.run('INSERT OR IGNORE INTO categories (id, name, color) VALUES (?, ?, ?)', ['cat_study', '学习', '#10b981'])
    console.log('[DB] 预置分类已创建')
  }

  // 预置默认设置
  const setResult = db.exec('SELECT COUNT(*) as count FROM settings')
  const setCount = setResult[0]?.values[0]?.[0] ?? 0
  if (setCount === 0) {
    db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [
      'app_settings',
      JSON.stringify({ themeColor: '#4b5563', themeMode: 'system', weekStartDay: 1, language: 'zh-CN' }),
    ])
    console.log('[DB] 默认设置已创建')
  }

  saveDb()
  console.log('[DB] 数据库初始化完成')
}

/**
 * 获取数据库实例
 */
export function getDb(): SqlJsDatabase {
  if (!db) {
    throw new Error('数据库未初始化，请先调用 initDatabase()')
  }
  return db
}

/**
 * 执行查询并返回行数组
 */
export function queryAll(sql: string, params: any[] = []): any[] {
  const database = getDb()
  const stmt = database.prepare(sql)
  if (params.length > 0) {
    stmt.bind(params)
  }
  const rows: any[] = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

/**
 * 执行查询并返回单行
 */
export function queryOne(sql: string, params: any[] = []): any | null {
  const rows = queryAll(sql, params)
  return rows[0] || null
}

/**
 * 执行写操作（INSERT/UPDATE/DELETE）
 */
export function execute(sql: string, params: any[] = []): void {
  const database = getDb()
  database.run(sql, params)
  saveDb()
}

/**
 * 关闭数据库
 */
export function closeDatabase(): void {
  if (db) {
    saveDb()
    db.close()
    db = null
    console.log('[DB] 数据库已关闭')
  }
}
