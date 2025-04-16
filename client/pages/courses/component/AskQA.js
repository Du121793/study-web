// 組件庫
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// method
import { useUserToken } from '../../../method/useUserToken'
import userService from '../../../method/userService'

// public
import downArrow from '../../../public/course/downArrow.png'
import leftArrow from '../../../public/course/leftArrow.png'

// nav組件
import VideoNav from '../VideoNav'
import QaNav from '../QaNav'

export default function AskNav({ showAskQA, setShowAskQA, qaHasUpload, setQaHasUpload, course_id, courseName, user_role }) {
  // 控制內部滾輪
  const [page_body, setPage_body] = useState([])
  // count用於控制nav收合
  const [count, setCount] = useState(0)
  // 獲取資料
  const token = useUserToken()
  // 處理標籤狀態
  const [rerander, setRerander] = useState(false)
  // ref
  const fileInputRef = useRef(null)
  const innerEleHeight = useRef(null)
  // loading
  const [postLoading, setpostLoading] = useState(false)
  // ask 區塊 - 同樣使用 ref 與 state 控制展開/收合
  const [qaAsk, setQaAsk] = useState(false)
  const askContentRef = useRef(null)
  const [askContentHeight, setAskContentHeight] = useState(0)

  // ask 區塊
  const [hintInput, setHintInput] = useState('')
  const [themeInput, setThemeInput] = useState('')

  // ask 請求參數
  // 描述
  const [description, setDescription] = useState('')
  // 是否公開，只有教師可以設定
  const [isPublic, setIsPublic] = useState(false)
  // 圖片
  const [images, setImages] = useState([])
  // 主題
  const [theme, setTheme] = useState([])
  // 標籤 陣列
  const [hints, setHints] = useState([])

  // 控制訊息
  const [message, setMessage] = useState('無訊息')
  const [messageStatus, setMessageStatus] = useState(false)
  const [messageColor, setMessageColor] = useState('')

  // 用於預覽圖片
  const [previewUrl, setPreviewUrl] = useState([])

  // 控制訊息
  const messageControl = (info, isSuccess) => {
    setMessage(info)
    setMessageStatus(true)
    if (isSuccess) {
      setMessageColor('rgba(195, 240, 178, 0.8)')
    } else {
      setMessageColor('rgba(240, 178, 178, 0.8)')
    }
    setTimeout(() => {
      setMessageStatus(false)
      setTimeout(() => {
        setMessage('無訊息')
        setMessageColor('')
      }, 200)
    }, 2000)
  }

  // 點擊刪除移除圖片功能
  const removeChoseImage = (imageIndex) => {
    setImages(
      images.filter((item, index) => {
        return index !== imageIndex
      })
    )
    setPreviewUrl(
      previewUrl.filter((item, index) => {
        return index !== imageIndex
      })
    )
  }

  // ask，移除標籤功能
  const removeTheme = (themes) => {
    if (
      theme.find((item) => {
        return item === themes
      })
    ) {
      console.log('刪除')
      setTheme(
        theme.filter((item) => {
          return item !== themes
        })
      )
    } else {
      console.log('沒找到')
    }
  }

  // ask，新增主題功能
  const addNewTheme = () => {
    if (themeInput.length > 19) return
    if (
      theme.find((item) => {
        return item === themeInput
      }) ||
      themeInput === ''
    ) {
      console.log('這個標籤已經有了')
    } else {
      setTheme(theme, theme.push(themeInput))
      setRerander(!rerander)
    }
  }

  // ask，移除標籤功能
  const removeHint = (hint) => {
    console.log(hint)
    if (
      hints.find((item) => {
        return item === hint
      })
    ) {
      console.log('刪除')
      setHints(
        hints.filter((item) => {
          return item !== hint
        })
      )
    } else {
      console.log('沒找到')
    }
  }

  // ask，新增標籤功能
  const addNewHint = () => {
    if (hintInput.length > 19) return
    if (
      hints.find((item) => {
        return item === hintInput
      }) ||
      hintInput === ''
    ) {
      console.log('這個標籤已經有了')
    } else {
      setHints(hints, hints.push(hintInput))
      setRerander(!rerander)
    }
  }

  const initInput = () => {
    setDescription('')
    setImages([])
    setTheme([])
    setHints([])
    setPreviewUrl([])
  }

  // ask，新增提問給該課程
  const createNewQA = () => {
    const idArray = [course_id]
    const formData = new FormData()
    formData.append('isPublic', isPublic)
    idArray.forEach((id) => {
      formData.append('course_ids[]', id)
    })
    formData.append('description', description)
    if (images.length) {
      images.forEach((file) => formData.append('image', file))
    }
    theme.forEach((item) => {
      formData.append('resourceCategories[]', item)
    })

    hints.forEach((item) => {
      formData.append('hints[]', item)
    })
    initInput()
    setpostLoading(true)
    userService.createNewQuestion(token, formData).then((res) => {
      if (res.success) {
        setpostLoading(false)
        messageControl('新增成功', true)
        setQaHasUpload(!qaHasUpload)
        initInput()
      }
    })
  }

  // 替換input按鈕
  const handleButtonClick = () => {
    fileInputRef.current.click()
  }

  const initScrollHeight = () => {
    setTimeout(() => {
      setAskContentHeight(innerEleHeight.current.scrollHeight)
    }, 10)
  }

  const closeUI = () => {
    setShowAskQA(false)
    page_body.style.overflow = 'auto'
  }

  const test = () => {}

  // 控制頁面scroll狀態
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setPage_body(document.querySelector('body'))
    }
    if (page_body && page_body.style) {
      page_body.style.overflow = 'hidden'
    }
  }, [page_body])

  // 刪除圖片後，nav更新高度
  useEffect(() => {
    setTimeout(() => {
      setAskContentHeight(innerEleHeight.current.scrollHeight)
    }, 10)
  }, [images, count, theme, hints])

  return (
    <div
      className="ask-area"
      onClick={closeUI}>
      <div
        style={{ height: messageStatus ? '20px' : '0', padding: messageStatus ? '24px' : '0', backgroundColor: messageColor }}
        className="message">
        {message}
      </div>
      <div
        onClick={(e) => {
          e.stopPropagation()
        }}
        className="ask-form"
        ref={innerEleHeight}>
        {postLoading && (
          <div className="loading-main">
            <div className="loader"></div>
          </div>
        )}
        <div className="upload-img-area shadow">
          <button
            onClick={handleButtonClick}
            className="g-black-btn">
            上傳圖片
          </button>
          {/* 處理上傳圖片 */}
          <input
            ref={fileInputRef}
            onChange={(e) => {
              setImages([...images, e.target.files?.[0]])
              const file = e.target.files?.[0]
              setPreviewUrl([...previewUrl, URL.createObjectURL(file)])
              if (!file) return
              e.target.value = ''
            }}
            style={{ display: 'none' }}
            accept="image/jpeg, image/png"
            type="file"
          />
          {previewUrl.length > 0 && (
            <div className="preview-img">
              {previewUrl.map((item, index) => (
                <div
                  key={index}
                  className="preview-images-container">
                  {/* 刪除圖片 */}
                  <div
                    className="remove-image-btn g-light-red-btn"
                    onClick={() => {
                      removeChoseImage(index)
                    }}>
                    刪除
                  </div>
                  <Image
                    className="preview-images"
                    src={item}
                    alt="user chose image"
                    width={300}
                    height={0}
                    style={{ height: 'auto' }}></Image>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="qa-info-area">
          {/* 輸入主題 */}
          <div className="sortType-input-area">
            <span className="title">主題:</span>
            <input
              className="input"
              onChange={(e) => {
                setThemeInput(e.target.value)
              }}
              type="text"
            />
            <button
              className="g-green-btn"
              onClick={addNewTheme}>
              <div
                className=""
                onClick={initScrollHeight}>
                新增
              </div>
            </button>
          </div>
          {/* 顯示主題 */}
          <div className="themes-area">
            {theme.map((item, index) => (
              <div
                className="theme"
                key={index}>
                {item}
                <span
                  className="delete-theme"
                  onClick={() => {
                    removeTheme(item)
                  }}>
                  x
                </span>
              </div>
            ))}
          </div>
          {/* 輸入標籤 */}
          <div className="sortType-input-area">
            <span className="title">標籤:</span>
            <input
              className="input"
              onChange={(e) => {
                setHintInput(e.target.value)
              }}
              type="text"
            />
            <button
              className="g-green-btn"
              onClick={addNewHint}>
              <div
                className="content"
                onClick={initScrollHeight}>
                新增
              </div>
            </button>
          </div>
          {/* 顯示標籤 */}
          <div className="hints-area">
            {hints &&
              hints.map((item, index) => (
                <div
                  className="hint"
                  key={index}>
                  {item}
                  <span
                    className="delete-hint"
                    onClick={() => {
                      removeHint(item)
                    }}>
                    x
                  </span>
                </div>
              ))}
          </div>
          {/* 問題描述區 */}
          <div className="description-input-area">
            <span>問題描述</span>
            <textarea
              value={description}
              className="ask-text-area"
              onChange={(e) => {
                setDescription(e.target.value)
              }}></textarea>
          </div>
          {/* 送出按鈕 */}
          <div className="submit-area">
            {user_role && user_role === 'teacher' && (
              <div className="public-area">
                是否要公開此提問
                <input
                  type="checkbox"
                  className="isPublic-checkbox"
                  onChange={(e) => {
                    setIsPublic(e.target.checked)
                  }}
                />
              </div>
            )}
            <button
              onClick={createNewQA}
              className="g-green-btn">
              送出
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
