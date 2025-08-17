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
// components
import MessageAnime from '../../../components/message_anime/MessageAnime'
import LoadingAnime from '../../../components/loading_anime/LoadingAnime'

export default function UploadCarousel({ setHasPop, bannerHasChange, setBannerHasChange }) {
  // 控制UI的顯示
  const [showCarouselEdit, setShowCarouselEdit] = useState(false)
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
  const [carousel, setCarousel] = useState('')

  // UX
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // 初始化UX
  const initUX = () => {
    const timer = setTimeout(() => {
      setMessage('')
    }, 2000)
    setLoading(false)
    return () => {
      clearTimeout(timer)
    }
  }

  // 取得輪播圖
  const getCarousels = () => {
    setLoading(true)
    setWantRemoveImageId(null)
    userService
      .getCarousels(token)
      .then((res) => {
        if (res.success) {
          setCarousel(res.data)
          initCarouselsTemp()
        } else {
          setMessage('獲取輪播圖資訊失敗')
        }
      })
      .catch((err) => {
        console.error(err)
        setMessage('發生錯誤')
      })
      .finally(() => {
        initUX()
      })
  }

  const initCarouselsTemp = () => {
    setFiles(null)
    setPreviewUrl(null)
  }

  // 上傳輪播圖
  const postCarousel = () => {
    if (files) {
      setLoading(true)
      formData.append('image', files)
      adminService
        .postCarousels(token, formData)
        .then((res) => {
          if (res.success) {
            setBannerHasChange(!bannerHasChange)
            getCarousels()
            setMessage('上傳成功')
            initCarouselsTemp()
          } else {
            setMessage('發生錯誤，上傳失敗')
          }
        })
        .catch((err) => {
          console.error(err)
          setMessage('發生錯誤')
        })
        .finally(() => {
          initUX()
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
          getCarousels()
          setMessage('刪除成功')
          initCarouselsTemp()
        } else {
          setMessage('發生錯誤，刪除失敗')
        }
      })
      .catch((err) => {
        console.error(err)
        setMessage('發生錯誤')
      })
      .finally(() => {
        initUX()
      })
  }

  // 關閉UI
  const closeUI = () => {
    setShowCarouselEdit(false)
    setHasPop(false) // 關閉彈窗
    setPreviewUrl('') // 清空預計要被上傳的圖片的預覽圖
    setFiles(null) // 清空預計要被上傳的圖片
    setWantRemoveImageId(null) // 清空預計要被刪除的id
  }

  // 獲得所有輪播圖
  useEffect(() => {
    if (token) {
      setLoading(true)
      userService
        .getCarousels(token)
        .then((res) => {
          if (res.success) {
            setCarousel(res.data)
            initCarouselsTemp()
          } else {
            setMessage('獲取輪播圖資訊失敗')
          }
        })
        .catch((err) => {
          console.error(err)
          setMessage('發生錯誤')
        })
        .finally(() => {
          initUX()
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
          setHasPop(true)
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
                {loading && <LoadingAnime top={'50%'}></LoadingAnime>}
                <div
                  className={style['title']}
                  onClick={test}>
                  編輯輪播圖功能
                </div>
                <div className={style['image-area']}>
                  <div className={style['setting-area']}>
                    <div
                      className={`${btn_style['g-red-btn']} ${style['header-option-btn']}`}
                      onClick={closeUI}>
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
                    {carousel.length > 0 &&
                      carousel.map((item, index) => (
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
