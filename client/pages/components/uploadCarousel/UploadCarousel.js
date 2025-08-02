// 組件庫
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, scale } from 'framer-motion'
// method
import { useUserToken } from '../../../method/useUserToken'
import userService from '../../../method/userService'
import adminService from '../../../method/adminService'
// css
import style from './uploadCarousel.module.css'
import btn_style from '../../../styles/global/button.module.css'

export default function UploadCarousel({ bannerHasChange, setBannerHasChange }) {
  // 控制UI的顯示
  const [showCarouselEdit, setShowCarouselEdit] = useState(false)
  // 控制body滑動條
  const [page_body, setPage_body] = useState([])
  // 二次確認刪除用
  const [wantRemoveImageId, setWantRemoveImageId] = useState('')
  // 收起預覽圖片
  const [hideBackImage, setHideBackImage] = useState(['0'])
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
  const [message, setMessage] = useState('')
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
    const data = {
      numbers: wantRemoveImageId,
    }
    adminService
      .deleteCarousels(token, data)
      .then((res) => {
        if (res.success) {
          setBannerHasChange(!bannerHasChange)
          init()
          messageControl('刪除成功', true)
        }
      })
      .catch((err) => {
        console.error(err)
        messageControl('刪除失敗', false)
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

  const test = () => {}

  return (
    <div>
      <div
        className={'g-blue-btn'}
        onClick={() => {
          setShowCarouselEdit(true)
        }}>
        編輯輪播圖
      </div>
      <AnimatePresence>
        {showCarouselEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className={style['upload-carousel-main']}>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.1 }}
              className={style['upload-carousel-container']}>
              <div
                className={style['upload-ui']}
                onClick={(e) => {
                  e.stopPropagation()
                }}>
                <div
                  className={style['title']}
                  onClick={test}>
                  編輯輪播圖功能
                </div>
                {carousel && carousel.length > 0 ? (
                  <div className={style['image-area']}>
                    <div className={style['setting-area']}>
                      <div
                        className={`${btn_style['g-red-btn']} ${style['header-option-btn']}`}
                        onClick={() => {
                          setShowCarouselEdit(false)
                        }}>
                        關閉介面
                      </div>
                      <div
                        className={`${btn_style['g-blue-btn']} ${style['header-option-btn']}`}
                        onClick={() => {
                          inputHandle.current.click()
                        }}>
                        選擇圖片
                      </div>
                      <div
                        className={`${btn_style['g-blue-btn']} ${style['header-option-btn']}`}
                        onClick={postCarousel}>
                        執行上傳
                      </div>
                      <input
                        type="file"
                        className={style['file-input']}
                        accept="image/png image/jpg"
                        style={{ display: 'none' }}
                        ref={inputHandle}
                        onClick={(e) => (e.target.value = null)}
                        onChange={(e) => {
                          setPreviewUrl(URL.createObjectURL(e.target.files[0]))
                          setFiles(e.target.files[0])
                        }}
                      />
                    </div>
                    <div className={style['images']}>
                      {carousel.map((item, index) => (
                        <div
                          className={style['image']}
                          key={index}
                          onClick={() => {}}>
                          <div className={style['image-btn-area']}>
                            {/* 刪除按鈕 */}
                            {wantRemoveImageId !== item.split('/').pop().split('-')[1].split('.')[0] && (
                              <button
                                className={btn_style['g-red-btn']}
                                onClick={() => {
                                  setWantRemoveImageId(item.split('/').pop().split('-')[1].split('.')[0])
                                }}>
                                刪除
                              </button>
                            )}
                            {wantRemoveImageId === item.split('/').pop().split('-')[1].split('.')[0] && (
                              <div
                                className={btn_style['g-red-btn']}
                                onClick={() => {
                                  deleteCarousel()
                                }}>
                                確定刪除
                              </div>
                            )}
                            {wantRemoveImageId === item.split('/').pop().split('-')[1].split('.')[0] && (
                              <div
                                className={btn_style['g-green-btn']}
                                onClick={() => {
                                  setWantRemoveImageId('')
                                }}>
                                取消
                              </div>
                            )}

                            {/* 收放圖片 */}
                            {hideBackImage &&
                              hideBackImage.every((imageNumber) => {
                                return imageNumber !== item.split('/').pop().split('-')[1].split('.')[0]
                              }) && (
                                <div
                                  className={btn_style['g-blue-btn']}
                                  onClick={() => {
                                    const image_number = item.split('/').pop().split('-')[1].split('.')[0]
                                    setHideBackImage([...hideBackImage, image_number])
                                  }}>
                                  收起圖片
                                </div>
                              )}

                            {hideBackImage && hideBackImage.length > 0 && hideBackImage.find((imageNumber) => imageNumber === item.split('/').pop().split('-')[1].split('.')[0]) && (
                              <div
                                className={btn_style['g-blue-btn']}
                                onClick={() => {
                                  const image_number = item.split('/').pop().split('-')[1].split('.')[0]
                                  const newArray = hideBackImage.filter((imageNumber) => imageNumber !== image_number)
                                  setHideBackImage(newArray)
                                }}>
                                復原圖片
                              </div>
                            )}
                          </div>
                          <Image
                            src={item}
                            width={0}
                            height={0}
                            style={{
                              height: hideBackImage.find((imageNumber) => {
                                return imageNumber === item.split('/').pop().split('-')[1].split('.')[0]
                              })
                                ? 100
                                : 'auto',
                            }}
                            alt="banner preview"
                            className={style['carousel']}></Image>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={style['h2']}>現在還沒有圖片</div>
                )}
                <div className={style['preview-image-area']}>
                  {previewUrl && (
                    <Image
                      alt="selected image preview"
                      src={previewUrl}
                      className={style['image']}
                      width={0}
                      height={0}
                      style={{ height: 'auto' }}></Image>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
