# 📅 日历清单

> macOS 风格的 Windows 11 桌面日历待办应用 · 纯本地 · 无需联网

![版本](https://img.shields.io/badge/version-1.0.2-blue)
![平台](https://img.shields.io/badge/platform-Windows%2011-0078d4)
![Electron](https://img.shields.io/badge/Electron-33-9feaf9)
![React](https://img.shields.io/badge/React-18-61dafb)
![许可](https://img.shields.io/badge/license-MIT-green)

## ✨ 功能

- 📅 **月历视图** — 完整月历网格，周一起始，日程圆点标记
- 🔔 **日程管理** — 时间范围、全天事件、重复规则、提醒通知
- ✅ **待办清单** — 复选框、三级优先级、截止日期、分类标签
- 🎨 **主题系统** — 6 种预设配色 + 自定义取色器，浅色/深色/跟随系统
- 🔍 **毛玻璃质感** — 半透明 frosted glass，仿 macOS Vibrancy
- 📌 **底层浮窗** — 窗口常驻桌面底层，不遮挡其他程序
- 🔒 **窗口锁定** — 一键固定窗口大小和位置
- ⬅️➡️ **面板拖拽** — 侧边栏和上下区域可自由调整大小
- 📥📤 **ICS 导入导出** — 兼容 Google Calendar / Apple Calendar / Outlook
- 💾 **JSON 备份还原** — 完整数据迁移
- 🚀 **开机自启** — 随系统启动
- 🔤 **字体大小调节** — 小/中/大三档
- 💧 **透明度调节** — 15%-90% 滑块

## 🖥️ 界面

左侧月历 + 右侧日程/待办双面板，可拖拽调整比例。石墨灰默认配色，半透明毛玻璃质感。

## 📦 安装

从 [Releases](../../releases) 页面下载最新的 `日历清单 Setup x.x.x.exe`，双击安装。

- 支持自定义安装路径
- 安装到同一路径会自动替换旧版本
- 数据库（日程/待办/设置）存储在用户目录，不受重装影响

## 🛠️ 技术栈

| 层 | 技术 |
|---|------|
| 桌面框架 | Electron 33 |
| 前端 | React 18 + TypeScript 5 |
| 构建 | Vite 6 + electron-vite 5 |
| 样式 | Tailwind CSS 3 + CSS 玻璃效果 |
| 数据库 | sql.js (SQLite WASM) |
| 状态管理 | Zustand 5 |
| 日期处理 | date-fns + zhCN locale |
| 定时通知 | node-cron + Electron Notification |
| 打包 | electron-builder + NSIS |

## 🔧 开发

```bash
# 安装依赖
npm install --registry https://registry.npmjs.org

# 开发模式
npm run dev

# 构建打包
npm run package
```

> ⚠️ 如果系统环境变量中有 `ELECTRON_RUN_AS_NODE=1`，需先清除再运行。

## 📄 许可

MIT License
