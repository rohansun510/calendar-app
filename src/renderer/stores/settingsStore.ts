import { create } from 'zustand'
import type { AppSettings } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'
import * as ipc from '@/lib/ipc'

interface SettingsStore {
  settings: AppSettings
  loaded: boolean

  load: () => Promise<void>
  update: (partial: Partial<AppSettings>) => Promise<void>
  applyTheme: () => void
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  load: async () => {
    const saved = await ipc.getSettings()
    if (saved) {
      set({ settings: { ...DEFAULT_SETTINGS, ...saved }, loaded: true })
    } else {
      // 首次启动，保存默认设置
      await ipc.updateSettings(DEFAULT_SETTINGS)
      set({ settings: DEFAULT_SETTINGS, loaded: true })
    }
    get().applyTheme()
  },

  update: async (partial: Partial<AppSettings>) => {
    const newSettings = { ...get().settings, ...partial }
    await ipc.updateSettings(newSettings)
    set({ settings: newSettings })
    get().applyTheme()
  },

  applyTheme: () => {
    const { themeColor, themeMode, fontSize, glassOpacity } = get().settings

    // 应用主题色
    const r = parseInt(themeColor.slice(1, 3), 16)
    const g = parseInt(themeColor.slice(3, 5), 16)
    const b = parseInt(themeColor.slice(5, 7), 16)
    document.documentElement.style.setProperty('--theme-color', `${r} ${g} ${b}`)

    // 应用字体大小
    const fontSizeMap = {
      small: { base: '12px', sm: '10px', xs: '9px' },
      medium: { base: '14px', sm: '12px', xs: '10px' },
      large: { base: '16px', sm: '14px', xs: '12px' },
    }
    const sizes = fontSizeMap[fontSize] || fontSizeMap.medium
    document.documentElement.style.setProperty('--font-size-base', sizes.base)
    document.documentElement.style.setProperty('--font-size-sm', sizes.sm)
    document.documentElement.style.setProperty('--font-size-xs', sizes.xs)

    // 应用透明度（百分比转小数，限制范围 15-90）
    const opacity = Math.max(15, Math.min(90, glassOpacity)) / 100
    document.documentElement.style.setProperty('--glass-opacity-window', String(opacity))
    document.documentElement.style.setProperty('--glass-opacity-panel', String(opacity * 0.65))
    document.documentElement.style.setProperty('--glass-opacity-surface', String(opacity * 0.45))

    // 应用深色/浅色模式
    const root = document.documentElement
    if (themeMode === 'dark') {
      root.classList.add('dark')
    } else if (themeMode === 'light') {
      root.classList.remove('dark')
    } else {
      // system — 跟随系统
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  },
}))
