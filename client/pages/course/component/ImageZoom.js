// 組件庫
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useUserToken } from '../../../method/useUserToken'

export default function ImageZoom({ imageUrl, setImageIsZoom }) {
  const token = useUserToken()
  const [userToken, setUserToken] = useState('')
  const [containerWidth, setContainerWidth] = useState('80%')
  // 點擊圖片以外區域，回傳放大狀態給父組件，用以退出放大圖片畫面
  const cancelZoom = (e) => {
    if (e.className === 'image-zoom-area') setImageIsZoom(false)
  }
  // 點擊圖片可進一步放大或縮小
  const moreZoom = () => {
    if (containerWidth === '80%') {
      setContainerWidth('95%')
    } else {
      setContainerWidth('80%')
    }
  }
  // token解析
  useEffect(() => {
    if (token) {
      setUserToken(token.split(' ')[1])
    }
  }, [token])
  return (
    <div
      className="image-zoom-area"
      onClick={(e) => {
        cancelZoom(e.target)
      }}>
      <div
        className="container"
        style={{
          width: containerWidth,
        }}>
        <Image
          src={`${imageUrl}?token=${userToken}`}
          onClick={() => {
            moreZoom()
          }}
          className="image"
          alt="user clicked's image zoom model"
          layout="responsive"
          width={100}
          height={100}></Image>
      </div>
    </div>
  )
}
