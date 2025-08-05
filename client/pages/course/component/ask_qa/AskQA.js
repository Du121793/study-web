// 組件庫
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

// method
import { useUserToken } from '../../../../method/useUserToken'
import userService from '../../../../method/userService'
// nav組件
import adminService from '../../../../method/adminService'
// style
import style from './style.module.css'

export default function AskNav({ setShowAskQA, qaHasUpload, setQaHasUpload, course_id, user_role }) {
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

  // 現有主題與標籤
  const [searchTheme, setSearchTheme] = useState([])
  const [showSearchTheme, setShowSearchTheme] = useState(false)
  const [searchHint, setSearchHint] = useState([])
  const [showSearchhHint, setShowSearchHint] = useState(false)

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
      setTheme(
        theme.filter((item) => {
          return item !== themes
        })
      )
    }
  }

  // ask，新增主題功能
  const addNewTheme = (themeName = null) => {
    if (themeInput.length > 19) return

    if (themeName) {
      if (theme.find((item) => item === themeName)) {
        messageControl('這個主題已經有了', false)
        return
      }
      setTheme(theme, theme.push(themeName))
      setRerander(!rerander)
      return
    }

    if (themeInput.trim() === '') {
      messageControl('主題不能為空', false)
      return
    }

    if (theme.find((item) => item === themeInput)) {
      messageControl('這個主題已經有了', false)
      return
    }

    setTheme(theme, theme.push(themeInput))
    setRerander(!rerander)
  }

  // ask，移除標籤功能
  const removeHint = (hint) => {
    if (
      hints.find((item) => {
        return item === hint
      })
    ) {
      setHints(
        hints.filter((item) => {
          return item !== hint
        })
      )
    }
  }

  // ask，新增標籤功能
  const addNewHint = (hintName) => {
    if (hintInput.length > 19) return
    if (hintName) {
      if (hints.find((item) => item === hintName)) {
        messageControl('這個標籤已經有了')
        return
      }
      setHints(hints, hints.push(hintName))
      setRerander(!rerander)
      return
    }

    if (hintInput.trim() === '') {
      messageControl('標籤不能為空', false)
      return
    }
    if (hints.find((item) => item === hintInput)) {
      messageControl('這個標籤已經有了')
      return
    }
    setHints(hints, hints.push(hintInput))
    setRerander(!rerander)
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

  useEffect(() => {
    if (token) {
      adminService.getCourseQAsByTag(token, course_id).then((res) => {
        if (res?.success) {
          setSearchTheme(res.data.resourceCategories)
          setSearchHint(res.data.hints)
        }
      })
    }
  }, [token])

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
      className={style['ask-area']}
      onClick={closeUI}>
      <div
        style={{ height: messageStatus ? '20px' : '0', padding: messageStatus ? '24px' : '0', backgroundColor: messageColor }}
        className={style['message']}>
        {message}
      </div>
      <div
        onClick={(e) => e.stopPropagation()}
        className={style['ask-form']}
        ref={innerEleHeight}>
        {postLoading && (
          <div className={style['loading-main']}>
            <div className={style['loader']}></div>
          </div>
        )}
        <div className={style['upload-img-area']}>
          <button
            onClick={handleButtonClick}
            className={style['g-black-btn']}>
            上傳圖片
          </button>
          <input
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              setImages([...images, file])
              setPreviewUrl([...previewUrl, URL.createObjectURL(file)])
              e.target.value = ''
            }}
            style={{ display: 'none' }}
            accept="image/jpeg, image/png"
            type="file"
          />
          {previewUrl.length > 0 && (
            <div className={style['preview-img']}>
              {previewUrl.map((item, index) => (
                <div
                  key={index}
                  className={style['preview-images-container']}>
                  <div
                    className={`${style['remove-image-btn']} ${style['g-light-red-btn']}`}
                    onClick={() => removeChoseImage(index)}>
                    刪除
                  </div>
                  <Image
                    className={style['preview-images']}
                    src={item}
                    alt="user chose image"
                    width={0}
                    height={0}
                    style={{ height: 'auto' }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={style['qa-info-area']}>
          {showSearchTheme && (
            <div className={style['view-card-area']}>
              {searchTheme.map((item, idx) => (
                <div
                  key={idx}
                  className={style['card']}
                  onClick={() => addNewTheme(item)}
                  style={{ cursor: 'pointer' }}>
                  {item}
                </div>
              ))}
            </div>
          )}
          <div className={style['sortType-input-area']}>
            <span className={style['title']}>主題:</span>
            <input
              className={style['input']}
              onChange={(e) => setThemeInput(e.target.value)}
              type="text"
            />
            <button
              className={style['g-green-btn']}
              onClick={() => addNewTheme()}>
              <div onClick={initScrollHeight}>新增</div>
            </button>
            <button
              className={style['g-blue-btn']}
              onClick={() => setShowSearchTheme(true)}>
              顯示現有主題
            </button>
          </div>
          <div className={style['view-card-area']}>
            {theme.map((item, index) => (
              <div
                key={index}
                className={style['card']}>
                {item}
                <span
                  className={style['delete-btn']}
                  onClick={() => removeTheme(item)}>
                  x
                </span>
              </div>
            ))}
          </div>

          {showSearchhHint && (
            <div className={style['view-card-area']}>
              {searchHint.map((item, idx) => (
                <div
                  key={idx}
                  className={style['card']}
                  style={{ cursor: 'pointer' }}
                  onClick={() => addNewHint(item)}>
                  {item}
                </div>
              ))}
            </div>
          )}
          <div className={style['sortType-input-area']}>
            <span className={style['title']}>標籤:</span>
            <input
              className={style['input']}
              onChange={(e) => setHintInput(e.target.value)}
              type="text"
            />
            <button
              className={style['g-green-btn']}
              onClick={() => addNewHint()}>
              <div
                className={style['content']}
                onClick={initScrollHeight}>
                新增
              </div>
            </button>
            <button
              className={style['g-blue-btn']}
              onClick={() => setShowSearchHint(true)}>
              顯示現有標籤
            </button>
          </div>
          <div className={style['view-card-area']}>
            {hints.map((item, index) => (
              <div
                key={index}
                className={style['card']}>
                {item}
                <span
                  className={style['delete-btn']}
                  onClick={() => removeHint(item)}>
                  x
                </span>
              </div>
            ))}
          </div>

          <div className={style['description-input-area']}>
            <span>問題描述</span>
            <textarea
              value={description}
              className={style['ask-text-area']}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className={style['submit-area']}>
            {user_role === 'teacher' && (
              <div className={style['public-area']}>
                是否要公開此提問
                <input
                  type="checkbox"
                  className={style['isPublic-checkbox']}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
              </div>
            )}
            <button
              onClick={createNewQA}
              className={style['g-green-btn']}>
              送出
            </button>
            <button
              onClick={closeUI}
              className={style['g-red-btn']}>
              關閉介面
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
