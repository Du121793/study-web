// 組件庫
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// global組件
import Header from '../../components/global/Header'

// method
import { useUserToken } from '../methods/service/useUserToken'
import userService from '../methods/service/userService'

// public
import downArrow from '../../public/course/downArrow.png'
import leftArrow from '../../public/course/leftArrow.png'

// nav組件
import VideoNav from './videoNav'
import QaNav from './qaNav'

// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

const AskNav = (courseId, courseName) => {
  // 獲取資料
  const token = useUserToken()

  // 常用參數
  const baseUrl = `${clientIp}/`
  const backToMyCoursePageUrl = `${clientIp}/profiles/profile`
  const [course_id, setCourse_id] = useState('')
  const [isLogined, setLogined] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const [isShowVideoUpload, setIsShowVideoUpload] = useState(false)

  // ask 區塊 - 同樣使用 ref 與 state 控制展開/收合
  const [qaAsk, setQaAsk] = useState(false)
  const askContentRef = useRef(null)
  const [askContentHeight, setAskContentHeight] = useState(0)

  // ask 區塊
  const [hintInput, setHintInput] = useState('')

  // ask 請求參數
  // 描述
  const [description, setDescription] = useState('')
  // 課程ID 陣列
  const [course_ids, setCourse_ids] = useState([])
  // 是否公開，只有教師可以設定
  const [isPublic, setIsPublic] = useState(false)
  // 圖片
  const [image, setImage] = useState('')
  // 主題
  const [resourceCategoriesm, setResourceCategories] = useState('')
  // 標籤 陣列
  const [hints, setHints] = useState(['標籤'])

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

  // ask使用的，存大量course_id
  useEffect(() => {
    setCourse_ids([courseId])
    // setCourse_ids(course_id)
  }, [courseId])

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

  // ask，新增提問給該課程
  const createNewQA = () => {
    console.log(courseId.courseId)
    userService
      .createNewQuestion(token, {
        isPublic: isPublic,
        course_ids: [courseId.courseId],
        description: description,
        image: [image],
        resourceCategoriesm: resourceCategoriesm,
        hints: hints,
      })
      .then((res) => {
        console.log(res)
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
          {userInfo && userInfo.role === 'teacher' && (
            <div className="public-area">
              是否要公開此提問
              <input
                type="checkbox"
                onChange={(e) => {
                  setIsPublic(e.target.checked)
                }}
              />
            </div>
          )}
          <div className="upload-img-area">
            <span>可選:</span>
            <input
              onChange={(e) => {
                setImage(e.target.files?.[0])
              }}
              className="upload-img-btn"
              accept="image/jpeg, image/png"
              type="file"
            />
          </div>
          <div className="description-input-area">
            <span>問題描述</span>
            <textarea
              onChange={(e) => {
                setDescription(e.target.value)
              }}
              className="ask-text-area"></textarea>
          </div>
          <div className="resourceCategory-input-area">
            <span>主題</span>
            <select
              onChange={(e) => {
                setResourceCategories(e.target.value)
              }}>
              <option value="">無特定主題</option>
            </select>
          </div>
          <div className="hints-area">
            {hints &&
              hints.map((item) => (
                <div className="hint">
                  {item}
                  <span
                    onClick={() => {
                      removeHint(item)
                    }}>
                    x
                  </span>
                </div>
              ))}
          </div>
          <div className="hints-input-area">
            <span>標籤:</span>
            <input
              onChange={(e) => {
                setHintInput(e.target.value)
              }}
              type="text"
            />
            <button onClick={addNewHint}>新增</button>
          </div>
          <button
            onClick={createNewQA}
            className="submit">
            送出
          </button>
        </div>
      </div>
    </div>
  )
}

export default AskNav
