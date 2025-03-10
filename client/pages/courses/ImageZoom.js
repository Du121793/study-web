// 組件庫
import Image from 'next/image'

export default function ImageZoom({ imageUrl, setImageIsZoom }) {
  // 傳給父組件放大圖片的狀態，用於取消放大
  const cancelZoom = (e) => {
    if (e.className === 'image-zoom-area') setImageIsZoom(false)
  }
  // 點擊圖片可進一步放大或縮小
  const moreZoom = (e) => {
    if (e.width < 800) {
      e.width = 800
      e.height = 800
    } else {
      e.width = 600
      e.height = 600
    }
  }
  return (
    <div
      className="image-zoom-area"
      onClick={(e) => {
        cancelZoom(e.target)
      }}>
      <Image
        src={imageUrl}
        onClick={(e) => {
          moreZoom(e.target)
        }}
        alt="user clicked's image zoom model"
        width={600}
        height={600}></Image>
    </div>
  )
}
