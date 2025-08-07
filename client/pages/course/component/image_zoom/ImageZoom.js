import React, { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import { useUserToken } from '../../../../method/useUserToken'
import style from './style.module.css'

export default function ImageZoom({ imageUrl, imageIsZoom, setImageIsZoom }) {
  const token = useUserToken()
  const [userToken, setUserToken] = useState('')
  const containerRef = useRef(null)
  const zoomRef = useRef(40)

  // 解析 token
  useEffect(() => {
    if (token) {
      const parts = token.split(' ')
      setUserToken(parts[1] || '')
    }
  }, [token])

  // 鎖頁面背景滾動
  useEffect(() => {
    if (imageIsZoom) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [imageIsZoom])

  // 滾輪放大縮小圖片
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleWheel = (e) => {
      e.preventDefault()
      // 放大／縮小邏輯
      zoomRef.current += e.deltaY < 0 ? 10 : -10
      zoomRef.current = Math.min(300, Math.max(40, zoomRef.current))
      el.style.width = zoomRef.current + '%'
    }

    // 新增監聽與卸載
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', handleWheel, { passive: false })
    }
  }, [])

  // 點擊外層遮罩關閉
  const cancelZoom = (e) => {
    if (e.target === e.currentTarget) {
      setImageIsZoom(false)
    }
  }

  return (
    <div
      className={style['image-zoom-main']}
      onClick={cancelZoom}>
      <div
        className={style['container']}
        ref={containerRef}
        style={{ width: '40%' }}>
        <Image
          src={`${imageUrl}?token=${userToken}`}
          className={style['image']}
          alt="Zoomed image"
          layout="responsive"
          width={0}
          height={0}
        />
      </div>
    </div>
  )
}
