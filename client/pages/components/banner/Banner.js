// 組件庫
import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
// method
import { useUserToken } from '../../../method/useUserToken'
import userService from '../../../method/userService'
// public
import blackRightArrow from '../../../public/arrow/right_arrow_black.png'
import blackleftArrow from '../../../public/arrow/left_arrow_black.png'
// css
import style from './banner.module.css'

export default function Banner({ bannerHasChange = null, initialCarousel = [] }) {
  const token = useUserToken()
  const [role, setRole] = useState('')
  const [carousel, setCarousel] = useState(initialCarousel)
  // currentIndex 以克隆後的陣列來定位，初始值為 1（即第一個真實圖片）
  const [currentIndex, setCurrentIndex] = useState(1)
  // 控制是否開啟 CSS transition（在跳轉時關閉，以達到無縫效果）
  const [transitionEnabled, setTransitionEnabled] = useState(true)
  // 紀錄圖片
  const [slides, setSlides] = useState([])
  const [slideCount, setSlideCount] = useState([])
  const autoSlideRef = useRef(null)
  // 旋轉讀取
  const [loading, setLoading] = useState(false)
  // 節流鎖
  const lockRef = useRef(false)

  // 利用克隆方法：當原始陣列不為空時，在前面加上最後一張，在後面加上第一張
  const getSlides = useCallback(() => {
    setSlideCount(carousel.length)
    if (carousel.length === 0) {
      setSlides([])
      return
    }
    const slides = []
    slides.push(carousel[carousel?.length - 1]) // 克隆最後一張放最前面
    slides.push(...carousel)
    slides.push(carousel[0]) // 克隆第一張放最後面
    setSlides(slides)
  })

  useEffect(() => {
    if (carousel) {
      getSlides()
    }
  }, [carousel])

  const nextSlide = () => {
    if (lockRef.current) return
    lockRef.current = true
    setCurrentIndex((prev) => prev + 1)
    setTransitionEnabled(true)
    setTimeout(() => {
      lockRef.current = false
    }, 1000)
  }

  const prevSlide = () => {
    if (lockRef.current) return
    lockRef.current = true
    setCurrentIndex((prev) => prev - 1)
    setTransitionEnabled(true)
    setTimeout(() => {
      lockRef.current = false
    }, 1000)
  }

  // 當 transition 結束後，檢查是否處於克隆圖片位置
  const handleTransitionEnd = () => {
    // 若當前為最後一張的克隆 (即 slides.length - 1)，無縫跳轉到真實第一張（index 1）
    if (currentIndex === slides.length - 1) {
      setTransitionEnabled(false)
      setCurrentIndex(1)
    }
    // 若當前為最前端的克隆 (index 0)，跳轉到真實最後一張（index = slideCount）
    if (currentIndex === 0) {
      setTransitionEnabled(false)
      setCurrentIndex(slideCount)
    }
  }

  // 計算真實的目前頁面索引（0 為第一頁）
  const getRealIndex = () => {
    if (carousel.length === 0) return 0
    if (currentIndex === 0) return slideCount - 1
    if (currentIndex === slides.length - 1) return 0
    return currentIndex - 1
  }

  // 點擊指示器切換頁面
  const handleIndicatorClick = (index) => {
    // 真實圖片 index 對應到 slides 陣列中為 index+1
    setCurrentIndex(index + 1)
    setTransitionEnabled(true)
  }

  // 取得 user_role
  useEffect(() => {
    const userRole = localStorage.getItem('user_role')
    if (userRole) setRole(userRole)
  }, [])

  // 取得輪播圖圖片（這裡假設回傳的資料為圖片 URL 陣列）
  useEffect(() => {
    setLoading(true)
    userService.getCarousels().then((res) => {
      if (res.success) {
        setLoading(false)
        setCarousel(res.data)
        setCurrentIndex(1) // 重新設定起始位置
      }
    })
  }, [bannerHasChange])

  // 自動切換，每 5 秒移動下一張
  useEffect(() => {
    // 確保 document 存在（即只在客戶端執行）
    if (typeof document === 'undefined') return

    const startInterval = () => {
      if (carousel && carousel.length > 0 && !document.hidden) {
        autoSlideRef.current = setInterval(() => {
          nextSlide()
        }, 5000)
      }
    }

    const clearAutoSlide = () => {
      if (autoSlideRef.current) {
        clearInterval(autoSlideRef.current)
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearAutoSlide()
      } else {
        startInterval()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    startInterval()

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearAutoSlide()
    }
  }, [carousel])

  return (
    <div className={style['banner-main']}>
      <div
        className={style['right-bottom-loading-area']}
        style={{ right: loading ? '8px' : '-100%' }}>
        <div className={style['loading']}></div>
      </div>
      <div className={style['banner']}>
        {/* 左箭頭 */}
        <div
          className={style['left-arrow-area']}
          onClick={prevSlide}>
          <Image
            className={style['arrow']}
            src={blackleftArrow}
            width={32}
            height={32}
            alt="banner left arrow icon"></Image>
        </div>
        {/* 輪播圖 */}
        <div
          className={style['carousel-container']}
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: transitionEnabled ? 'transform 0.5s ease-in-out' : 'none',
          }}
          onTransitionEnd={handleTransitionEnd}>
          {slides.map((item, index) => (
            <div
              key={index}
              className={style['carousel-item']}>
              <Image
                src={item}
                loading={index === 0 ? 'eager' : 'lazy'}
                alt={`banner image ${index}`}
                layout="fill"
                objectFit="contain"
              />
            </div>
          ))}
        </div>
        {/* 右箭頭 */}
        <div
          className={style['right-arror-area']}
          onClick={nextSlide}>
          <Image
            className={style['arrow']}
            src={blackRightArrow}
            width={32}
            height={32}
            alt="banner right arrow icon"></Image>
        </div>
        {/* 底部指示器 */}
        <div className={style['indicator-bar']}>
          <div className={style['indicator']}>
            {carousel &&
              carousel.length > 0 &&
              carousel.map((_, idx) => (
                <div
                  key={idx}
                  className={style['indicator-dot-container']}>
                  <div
                    className={`${style['indicator-dot']} ${getRealIndex() === idx ? style['active'] : ''}`}
                    onClick={() => handleIndicatorClick(idx)}></div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
