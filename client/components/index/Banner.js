import banner from '../../public/index/banner/banner.png'

// 組件庫
import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function Banner({ showCarouselEdit, setShowCarouselEdit }) {
  const [role, setRole] = useState('')
  useEffect(() => {
    if (sessionStorage.getItem('user_role')) {
      const userRole = sessionStorage.getItem('user_role')
      setRole(userRole)
    }
  })
  return (
    <div className="banner-main">
      {role && role === 'admin' && (
        <div className="banner-btn-area">
          <div
            className="btn"
            onClick={() => {
              setShowCarouselEdit(true)
            }}>
            編輯輪播圖
          </div>
        </div>
      )}
      <div className="banner">
        <Image
          className="img"
          src={banner}
          alt="banner,s image"
          width={400}
        />
      </div>
    </div>
  )
}
