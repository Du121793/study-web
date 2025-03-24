// 組件庫
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Masonry from 'react-masonry-css'
import Image from 'next/image'
import Link from 'next/link'

// method
import { useUserToken } from '../../method/useUserToken'
import userService from '../../method/userService'

// public
import downArrow from '../../public/course/downArrow.png'
import client from 'react-dom/client'

// 子組件
import ShowMoreQA from './ShowMoreQA'
import ShowPublicQA from './ShowPublicQA'
import adminService from '../../method/adminService'
import ImageZoom from './ImageZoom'

// env
const client_URL = process.env.NEXT_PUBLIC_CLIENT_IP

export default function QaNav({ course_id, courseName }) {
  const token = useUserToken()
  const [courseQas, setCourseQas] = useState([])
  const [userToken, setUserToken] = useState('')

  setTimeout(() => {
    if (typeof window !== 'undefined') {
      setUserToken(window.localStorage.getItem('token').split(' ')[1])
    }
  }, 100)

  // 響應式斷點
  const breakpointColumnsObj = {
    default: 4,
  }

  // 控制圖片放大狀態
  const [imageIsZoom, setImageIsZoom] = useState(false)
  const [zoomImage, setZoomImage] = useState()

  // nav 展開/收合
  const [qaOpen, setQaOpen] = useState(false)
  const qaContentRef = useRef(null)
  const [qaContentHeight, setQaContentHeight] = useState(0)

  // 請求參數的狀態
  const [sortBy, setSortBy] = useState('resourceCategories')
  const [timeSort, setTimeSort] = useState('desc')

  // 用戶資料
  const [userInfo, setUserInfo] = useState({})

  // 公開QA資料
  const [publicQAInfo, setPublicQAInfo] = useState({})

  // 用狀態控制是否顯示加載更多QA，解決函式調用無法進到父組件的渲染樹問題
  const [showMoreQA, setShowMoreQA] = useState(false)

  // 控制公開QA的組件
  const [showPublicQA, setShowPublicQA] = useState(false)

  // 給子組件發請求用的參數
  const [selectBy, setSelectBy] = useState(null)

  // 控制刪除按鈕的狀態
  const [showRemoveBtn, setShowRemoveBtn] = useState(false)
  const [doubleCheck, setDoubleCheck] = useState(false)

  // 控制訊息
  const [message, setMessage] = useState('無訊息')
  const [messageStatus, setMessageStatus] = useState(false)
  const [messageColor, setMessageColor] = useState('')

  // 切換整個 nav 區域的展開/收合
  const toggleQA = () => {
    console.log('收合')
    // 若即將從 "關閉" -> "打開", 先計算內容高度
    if (!qaOpen && qaContentRef.current) {
      // 先打開，再量高度
      setQaOpen(true)
      setQaContentHeight(qaContentRef.current.scrollHeight)
    } else {
      // 收合 nav
      setQaOpen(false)
    }
  }

  // 將值傳給放大圖片功能
  const clickZoomImage = (imageUrl) => {
    setZoomImage(imageUrl)
    setImageIsZoom(true)
  }

  const test = () => {
    console.log(courseQas)
  }

  const showPublicQAClick = () => {
    const pageSize = 9999
    adminService.publicInfo(token, pageSize).then((res) => {
      setPublicQAInfo(res.data)
      setShowPublicQA(true)
    })
  }

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

  // 刪除問題
  const removeQuestion = (question_id) => {
    adminService.removeQuestion(token, question_id).then((res) => {
      userService
        .getCourseQAs(token, course_id, sortBy)
        .then((res) => {
          if (res.success) {
            messageControl('刪除成功', true)
          }
          setCourseQas(res.data)
        })
        .catch((err) => console.error('Error:', err.message))
    })
  }

  // 取得 QA 資料
  useEffect(() => {
    if (token && course_id && sortBy && timeSort) {
      userService
        .getCourseQAs(token, course_id, sortBy, timeSort)
        .then((res) => {
          setCourseQas(res.data)
        })
        .catch((err) => console.error('Error:', err.message))
    }
    if (token) {
      userService.getUserInfo(token).then((res) => {
        setUserInfo(res.data)
      })
    }
  }, [token, course_id, sortBy, timeSort])

  return (
    <div
      className="nav"
      id="qa-nav">
      <div
        onClick={toggleQA}
        className="header">
        <Image
          src={downArrow}
          alt="open Q & A nav's icon"
          width={40}
          height={40}
        />
        <span>Q & A</span>
      </div>
      <div
        style={{ height: messageStatus ? '20px' : '0', padding: messageStatus ? '24px' : '0', backgroundColor: messageColor }}
        className="message">
        {message}
      </div>
      {imageIsZoom && (
        <ImageZoom
          setImageIsZoom={setImageIsZoom}
          imageUrl={zoomImage}></ImageZoom>
      )}
      {/* nav 內容區域 */}
      <div
        className="QA-area"
        ref={qaContentRef}
        style={{ height: qaOpen ? qaContentHeight + 'px' : '0px', transition: '0.3s' }}>
        <div className="QA-header">
          <div className="sort-by-area">
            <span
              className="sort-title"
              onClick={test}>
              排序根據
            </span>
            <select
              className="select"
              onChange={(e) => {
                setSortBy(e.target.value)
              }}>
              <option value="resourceCategories">主題排序</option>
              <option value="hints">標籤排序</option>
            </select>
          </div>
          <div className="time-sort-area">
            <div>時間</div>
            <select
              className="select"
              onChange={(e) => {
                setTimeSort(e.target.value)
              }}>
              <option value="desc">降序</option>
              <option value="asc">升序</option>
            </select>
          </div>

          {userInfo.role === 'teacher' ||
            ('admin' && (
              <div
                className="show-public-QA"
                onClick={showPublicQAClick}>
                顯示公開QA
              </div>
            ))}
          {userInfo.role === 'teacher' ||
            ('admin' && (
              <div
                className="show-delete-btn"
                onClick={() => {
                  setShowRemoveBtn(!showRemoveBtn)
                }}>
                刪除QA
              </div>
            ))}
          {showPublicQA && (
            <ShowPublicQA
              showPublicQA={showPublicQA}
              setShowPublicQA={setShowPublicQA}
              publicQAInfo={publicQAInfo}
              resourceCategory={sortBy === 'resourceCategories' && selectBy}
              hint={sortBy === 'hints' && selectBy}
              courseName={courseName}
              token={token}
              course_id={course_id}
            />
          )}
          {showMoreQA && (
            <ShowMoreQA
              setShowMoreQA={setShowMoreQA}
              showMoreQA={showMoreQA}
              courseName={courseName}
              token={token}
              course_id={course_id}
              resourceCategory={sortBy === 'resourceCategories' && selectBy}
              hint={sortBy === 'hints' && selectBy}
            />
          )}
        </div>
        <div className="QA-grid">
          <Masonry
            className="QA-container"
            breakpointCols={breakpointColumnsObj}
            columnClassName="my-masonry-grid_column">
            {courseQas.map((item, index) => (
              <div
                className="QA-list"
                key={index}>
                {/* 標題處理 */}
                {item.tag !== '' && (
                  <div className="QA-tag">
                    <div className="content">{item.tag}</div>
                  </div>
                )}
                {item.tag === '' && sortBy === 'resourceCategories' && (
                  <div className="QA-tag">
                    <div className="content">無主題</div>
                  </div>
                )}
                {item.tag === '' && sortBy === 'hints' && (
                  <div className="QA-tag">
                    <div className="content">標籤</div>
                  </div>
                )}
                {/* qa內容處理 */}
                {/* 參數
                date
                description
                hints : []
                resourceCategories : []
                image : []
                lastUpdate
                replied
                _id
              */}
                {item.qas.map((qaInfo, index) => (
                  <div
                    key={index}
                    className="qa-info">
                    {/* 處理小標題 */}
                    {qaInfo.hints[0] === '' && sortBy === 'resourceCategories' && (
                      <div className="qa-info-title">
                        <div className="content">無標籤</div>
                      </div>
                    )}
                    {qaInfo.resourceCategories[0] === '' && sortBy === 'hints' && (
                      <div className="qa-info-title">
                        <div className="content">無主題</div>
                      </div>
                    )}
                    {qaInfo.hints[0] !== '' && sortBy === 'resourceCategories' && (
                      <div className="qa-info-title">
                        {qaInfo.hints.slice().map((content, index) => (
                          <div
                            className="content"
                            key={index}>
                            {content}
                          </div>
                        ))}
                      </div>
                    )}
                    {qaInfo.resourceCategories[0] !== '' && sortBy === 'hints' && (
                      <div className="qa-info-title">
                        {qaInfo.resourceCategories.slice().map((content, index) => (
                          <div
                            className="content"
                            key={index}>
                            {content}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="btn-area">
                      <Link
                        className="into-qa-btn"
                        href={`${client_URL}/courses/QaPage?qa_id=${qaInfo._id}&courseName=${courseName}&course_id=${course_id}`}>
                        問題頁面
                      </Link>
                      {/* 刪除按鈕 */}
                      {showRemoveBtn && (
                        <div
                          className="remove-btn"
                          onClick={(e) => {
                            if (e.target.innerText === '確認刪除') {
                              setDoubleCheck(true)
                              removeQuestion(qaInfo._id)
                            }
                            if (e.target.innerText === '刪除') {
                              e.target.innerText = '確認刪除'
                            }
                          }}>
                          刪除
                        </div>
                      )}
                    </div>
                    {/* 圖片處理 */}
                    <div className="qa-image-area">
                      {qaInfo.image.length > 0 && userToken.length && (
                        <Image
                          key={index}
                          className="qa-image"
                          src={`${qaInfo.image[0]}?token=${userToken}`}
                          width={200}
                          height={0}
                          style={{ height: 'auto' }}
                          alt="qa-image"
                          onClick={() => {
                            console.log(`${qaInfo.image[0]}?token=${userToken}`)
                            clickZoomImage(`${qaInfo.image[0]}`)
                          }}></Image>
                      )}
                    </div>
                    {/* 時間處理 */}
                    <div className="time-replied-area">
                      <div className="time">{new Date(qaInfo.date).toLocaleString()}</div>
                      <div className="not-replied">{qaInfo.replied === false && '未回覆'}</div>
                      <div className="is-replied">{qaInfo.replied === true && '已回覆'}</div>
                    </div>
                    {/* 簡易的提問內容處理 */}
                    <div className="qa-description">{qaInfo.description}</div>
                  </div>
                ))}
                {item.qas.length === 3 && (
                  <div
                    className="load-more-btn"
                    onClick={() => {
                      setShowMoreQA(true)
                      setSelectBy(item.tag)
                    }}>
                    點擊加載全部
                  </div>
                )}
              </div>
            ))}
          </Masonry>
        </div>
      </div>
    </div>
  )
}
