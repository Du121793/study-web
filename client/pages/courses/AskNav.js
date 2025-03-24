// 組件庫
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// global組件
import Header from '../../components/global/Header'

// method
import { useUserToken } from '../../method/useUserToken'
import userService from '../../method/userService'

// public
import downArrow from '../../public/course/downArrow.png'
import leftArrow from '../../public/course/leftArrow.png'

// nav組件
import VideoNav from './VideoNav'
import QaNav from './QaNav'

// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

export default function AskNav({ course_id, courseName }) {
  // count用於控制nav收合
  const [count, setCount] = useState(0)
  // 獲取資料
  const token = useUserToken()
  // 處理標籤狀態
  const [rerander, setRerander] = useState(false)
  // ref
  const fileInputRef = useRef(null)
  // 常用參數
  const baseUrl = `${clientIp}/`
  const [isLogined, setLogined] = useState(false)
  const [userInfo, setUserInfo] = useState(null)

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
  // 課程ID 陣列
  const [course_ids, setCourse_ids] = useState([])
  // 是否公開，只有教師可以設定
  const [isPublic, setIsPublic] = useState(false)
  // 圖片
  const [images, setImages] = useState([])
  // 主題
  const [theme, setTheme] = useState(['主題'])
  // 標籤 陣列
  const [hints, setHints] = useState(['標籤'])

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

  // ask，新增標籤功能
  const addNewTheme = () => {
    console.log(theme)
    if (
      theme.find((item) => {
        return item === themeInput
      }) ||
      themeInput === ''
    ) {
      console.log('這個標籤已經有了')
    } else {
      console.log('進行增加')
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
    if (
      hints.find((item) => {
        return item === hintInput
      }) ||
      hintInput === ''
    ) {
      console.log('這個標籤已經有了')
    } else {
      console.log('進行增加')
      setHints(hints, hints.push(hintInput))
      setRerander(!rerander)
    }
  }

  const initInput = () => {
    setDescription('')
    setImages([])
    setTheme(['主題'])
    setHints(['標籤'])
  }

  // ask，新增提問給該課程
  const createNewQA = () => {
    const _idArray = [course_id]
    const formData = new FormData()
    formData.append('isPublic', isPublic)
    _idArray.forEach((id) => {
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
    userService.createNewQuestion(token, formData).then((res) => {
      console.log(res)
      if (res.success) {
        messageControl('新增成功', true)
      }
    })
  }

  // 切換ask的展示收回狀態
  const toggleAsk = () => {
    if (!qaAsk) {
      if (askContentRef.current) {
        setAskContentHeight(askContentRef.current.scrollHeight)
      }
      setQaAsk(true)
    } else {
      setAskContentHeight(0)
      setQaAsk(false)
    }
  }

  // 初始化askNav高度
  const initToggle = () => {}

  const handleButtonClick = () => {
    fileInputRef.current.click()
  }

  const test = () => {
    console.log(hints)
    console.log(theme)
  }

  // 請求使用者資料
  useEffect(() => {
    if (token) {
      userService
        .getUserInfo(token)
        .then((res) => {
          setUserInfo(res.data)
          setLogined(true)
        })
        .catch((err) => console.error('Error:', err.message))
    }
  }, [token])

  // nav更新高度，count用來防止第一次渲染造成預設計算高度後直接開啟nav
  useEffect(() => {
    if (askContentRef.current && count > 0) {
      askContentRef.current.style.height = 'auto'
      // 延遲量測新高度（可使用 requestAnimationFrame 或 setTimeout）
      setTimeout(() => {
        const newHeight = askContentRef.current.scrollHeight
        setAskContentHeight(newHeight)
      }, 100)
    }
  }, [images, count])

  return (
    <div
      className="nav"
      id="ask-nav">
      <div
        onClick={toggleAsk}
        className="header">
        <Image
          src={downArrow}
          alt="open ask nav's icon"
          width={40}
          height={40}
        />
        <span>提問區</span>
      </div>
      <div
        style={{ height: messageStatus ? '20px' : '0', padding: messageStatus ? '24px' : '0', backgroundColor: messageColor }}
        className="message">
        {message}
      </div>
      {/* 打開部分 */}
      <div
        className="ask-area"
        ref={askContentRef}
        style={{
          height: qaAsk ? askContentHeight + 'px' : '0px',
          overflow: 'hidden',
          transition: 'height 0.3s ease',
        }}>
        <div className="ask-form">
          <div className="upload-img-area">
            <span onClick={test}>可上傳多張圖片</span>
            <button
              onClick={handleButtonClick}
              className="upload-img-btn">
              選擇檔案
            </button>
            {/* 處理上傳圖片 */}
            <input
              ref={fileInputRef}
              onChange={(e) => {
                setImages([...images, e.target.files?.[0]])
                const file = e.target.files?.[0]
                setPreviewUrl([...previewUrl, URL.createObjectURL(file)])
                if (!file) return
                console.log(e.target.value)
                e.target.value = ''
              }}
              style={{ display: 'none' }}
              accept="image/jpeg, image/png"
              type="file"
            />
            <div className="preview-img">
              {previewUrl.map((item, index) => (
                <div
                  key={index}
                  className="preview-images-container">
                  {/* 刪除圖片 */}
                  <div
                    className="remove-image-btn"
                    onClick={() => {
                      removeChoseImage(index)
                    }}>
                    刪除
                  </div>
                  <Image
                    className="preview-images"
                    src={item}
                    alt="user chose image"
                    width={400}
                    height={400}></Image>
                </div>
              ))}
            </div>
          </div>
          <div className="qa-info-area">
            {/* 主題 */}
            <div className="resourceCategory-input-area">
              <span>主題:</span>
              <input
                onChange={(e) => {
                  setThemeInput(e.target.value)
                }}
                type="text"
              />
              <button onClick={addNewTheme}>新增</button>
            </div>
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
            <div className="hints-input-area">
              <span>標籤:</span>
              <input
                onChange={(e) => {
                  setHintInput(e.target.value)
                }}
                className="hint-input"
                type="text"
              />
              <button onClick={addNewHint}>新增</button>
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
                onChange={(e) => {
                  setDescription(e.target.value)
                }}
                className="ask-text-area"></textarea>
            </div>
            <div className="submit-area">
              {userInfo && userInfo.role === 'teacher' && (
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
                className="submit">
                送出
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
