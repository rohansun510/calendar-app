import { useState, useEffect } from 'react'
import { Lock, Unlock } from 'lucide-react'

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isLocked, setIsLocked] = useState(false)

  useEffect(() => {
    window.api.isMaximized().then(setIsMaximized)
    window.api.isWindowLocked().then(setIsLocked)
    window.api.onMaximizeChange(setIsMaximized)
  }, [])

  const toggleLock = () => {
    const newLocked = !isLocked
    setIsLocked(newLocked)
    window.api.lockWindow(newLocked)
  }

  const btnClass = 'w-3 h-3 rounded-full transition-colors cursor-pointer no-drag'

  return (
    <div className="drag-region h-[34px] flex items-center justify-between px-3
                    border-b border-[rgba(var(--border-color)/0.15)] z-50">
      {/* macOS 风格按钮 */}
      <div className="flex items-center gap-2 pl-0.5">
        <button
          onClick={() => window.api.closeWindow()}
          className={`${btnClass} bg-[#ed6a5e] hover:bg-[#c05048]`}
          title="隐藏到托盘"
        />
        <button
          onClick={() => window.api.minimizeWindow()}
          className={`${btnClass} bg-[#f5bd4f] hover:bg-[#d4a33d]`}
          title="最小化"
        />
        <button
          onClick={() => window.api.maximizeWindow()}
          className={`${btnClass} bg-[#61c454] hover:bg-[#4ea33d]`}
          title={isMaximized ? '还原' : '最大化'}
        />
      </div>

      <div className="text-xs font-medium text-[rgb(var(--text-secondary))] select-none">
        日历清单
      </div>

      <div className="flex items-center gap-2 no-drag">
        <button
          onClick={toggleLock}
          className={`p-0.5 rounded transition-colors ${
            isLocked
              ? 'text-[rgb(var(--theme-color))]'
              : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]'
          }`}
          title={isLocked ? '解锁窗口大小' : '锁定窗口大小'}
        >
          {isLocked ? <Lock size={13} /> : <Unlock size={13} />}
        </button>
      </div>
    </div>
  )
}
