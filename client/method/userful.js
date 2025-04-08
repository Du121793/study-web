import { useRef } from 'react'

// 使用方法
// const strictClickCloseUI = useStrictClickHandler(() => {
//   ...
// })
export function useStrictClickHandler(callback) {
  const downTargetRef = useRef(null)
  const upTargetRef = useRef(null)

  const handleMouseDown = (e) => {
    // 記錄 mousedown 事件的目標
    downTargetRef.current = e.target
  }

  const handleMouseUp = (e) => {
    // 記錄 mouseup 事件的目標
    upTargetRef.current = e.target
  }

  const handleClick = (e) => {
    // 檢查 mousedown 與 mouseup 的目標是否都與 click 時的 e.target 一致
    if (downTargetRef.current === e.target && upTargetRef.current === e.target) {
      callback && callback(e)
    } else {
      // 不符合條件則阻止事件繼續冒泡與執行預設行為
      e.stopPropagation()
      e.preventDefault()
    }
  }

  return {
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onClick: handleClick,
  }
}
