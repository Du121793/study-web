import { useEffect, useState } from 'react'
import style from './style.module.css'

export default function MessageAnime({ message, top, left, right, bottom, duration = 2000 }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration)
    return () => clearTimeout(timer)
  }, [duration])

  return visible ? (
    <div
      className={style.floating_message}
      style={{
        top: top ?? '50%',
        left: left ?? 'null',
        right: right ?? 'null',
        bottom: bottom ?? 'null',
      }}>
      {message}
    </div>
  ) : null
}

/*
{message && (
  <MessageAnime
    message={message}
    top="100px"
    duration={2000}
  />
)}
*/
