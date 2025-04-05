// 組件庫
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
// method
import { useUserToken } from '../../method/useUserToken'
import userService from '../../method/userService'
import adminService from '../../method/adminService'

// public
import trashCanIcon from '../../public/index/banner/trashCanIcon.png'

export default function UploadCarousel({ showCarouselEdit, setShowCarouselEdit, bannerHasChange, setBannerHasChange }) {
  // 控制body滑動條
  const [page_body, setPage_body] = useState([])
  // 二次確認刪除用
  const [dbCheckTemp, setDbCheckTemp] = useState([])
  const [dbCheckHeight, setDbCheckHeight] = useState(0)
  // 替代原生input
  const inputHandle = useRef(null)
  // 預覽圖片處理
  const [previewUrl, setPreviewUrl] = useState(null)
  // 請求參數
  const token = useUserToken()
  const [files, setFiles] = useState(null)
  const formData = new FormData()
  // 請求獲得參數
  const [carousel, setCarousel] = useState(null)

  // 控制訊息
  const [message, setMessage] = useState('無訊息')
  const [messageStatus, setMessageStatus] = useState(false)
  const [messageColor, setMessageColor] = useState('')
  // 綁定timeout，用於重計
  const messageTimer = useRef(null)
  const resetTimer = useRef(null)

  // 控制訊息
  const messageControl = (info, isSuccess) => {
    setMessage(info)
    setMessageStatus(true)
    if (isSuccess) {
      setMessageColor('rgba(195, 240, 178, 0.8)')
    } else {
      setMessageColor('rgba(240, 178, 178, 0.8)')
    }

    // 清除之前的 timer
    if (messageTimer.current) clearTimeout(messageTimer.current)
    if (resetTimer.current) clearTimeout(resetTimer.current)

    messageTimer.current = setTimeout(() => {
      setMessageStatus(false)
      resetTimer.current = setTimeout(() => {
        setMessage('無訊息')
        setMessageColor('')
      }, 200)
    }, 2000)
  }

  // 上傳輪播圖
  const postCarousel = () => {
    if (files) {
      formData.append('image', files)
      adminService.postCarousels(token, formData).then((res) => {
        if (res.success) {
          setBannerHasChange(!bannerHasChange)
          init()
          messageControl('上傳成功', true)
        } else {
          messageControl('上傳失敗', false)
        }
      })
    }
  }

  // 刪除輪播圖
  const deleteCarousel = () => {
    let number = []
    number.push(dbCheckTemp)
    const data = {
      numbers: number,
    }
    adminService.deleteCarousels(token, data).then((res) => {
      if (res.success) {
        setBannerHasChange(!bannerHasChange)
        init()
        messageControl('刪除成功', true)
      } else {
        console.log(res)
        messageControl('刪除失敗', false)
      }
    })
  }

  const init = () => {
    userService.getCarousels(token).then((res) => {
      if (res.success) {
        setCarousel(res.data)
      }
    })
  }

  // 獲得所有輪播圖
  useEffect(() => {
    if (token) {
      userService.getCarousels(token).then((res) => {
        if (res.success) {
          setCarousel(res.data)
        } else {
          messageControl('獲取輪播圖資訊失敗', false)
        }
      })
    }
  }, [token])

  const test = () => {
  }

  // 控制頁面scroll狀態
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setPage_body(document.querySelector('body'))
    }
    if (page_body && page_body.style) {
      page_body.style.overflow = 'hidden'
    }
  }, [page_body])

  return (
    <div
      className="upload-carousel-main"
      onClick={() => {
        page_body.style.overflow = 'auto'
        setShowCarouselEdit(false)
      }}>
      <div
        className="upload-ui"
        onClick={(e) => {
          e.stopPropagation()
        }}>
        <div
          style={{ height: messageStatus ? '20px' : '0', padding: messageStatus ? '24px' : '0', backgroundColor: messageColor }}
          className="message">
          {message}
        </div>
        <div
          className="title"
          onClick={test}>
          編輯輪播圖功能
        </div>
        {carousel && carousel.length > 0 ? (
          <div className="image-area">
            {carousel.map((item, index) => (
              <div
                className="image"
                key={index}>
                {item.split('/').pop().split('-')[1].split('.')[0] === dbCheckTemp && (
                  <div className="db-check-btm">
                    <div
                      style={{ height: dbCheckHeight }}
                      className="content confirm"
                      onClick={() => {
                        deleteCarousel()
                      }}>
                      確定刪除
                    </div>
                  </div>
                )}
                <Image
                  src={trashCanIcon}
                  width={24}
                  height={24}
                  alt="trashcan icon"
                  className="trashcan"
                  onClick={() => {
                    setDbCheckTemp(item.split('/').pop().split('-')[1].split('.')[0])
                    setTimeout(() => {
                      setDbCheckHeight(24)
                    }, 100)
                  }}></Image>
                <Image
                  src={item}
                  width={600}
                  height={0}
                  style={{ height: 'auto' }}
                  alt="banner preview"
                  className="carousel"></Image>
              </div>
            ))}
          </div>
        ) : (
          <div className="h2">現在還沒有圖片</div>
        )}
        <div className="hint-content">建議長寬2比1</div>
        <input
          type="file"
          className="file-input"
          accept="image/png image/jpg"
          style={{ display: 'none' }}
          ref={inputHandle}
          onChange={(e) => {
            setPreviewUrl(URL.createObjectURL(e.target.files[0]))
            setFiles(e.target.files[0])
          }}
        />
        <div className="btn-area">
          <div
            className="btn"
            onClick={() => {
              inputHandle.current.click()
            }}>
            選擇圖片
          </div>
          <div
            className="btn"
            onClick={postCarousel}>
            上傳
          </div>
        </div>
        <div className="preview-image-area">
          {previewUrl && (
            <Image
              alt="selected image preview"
              src={previewUrl}
              width={600}
              height={0}
              style={{ height: 'auto' }}></Image>
          )}
        </div>
      </div>
      <div className="announcement-area"></div>
    </div>
  )
}
