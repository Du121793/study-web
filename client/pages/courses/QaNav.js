import { useEffect, useRef, useState } from 'react'
import Masonry from 'react-masonry-css'
import Image from 'next/image'
import Link from 'next/link'

import { useUserToken } from '../../method/useUserToken'
import userService from '../../method/userService'
import adminService from '../../method/adminService'

import downArrow from '../../public/course/downArrow.png'
import ShowMoreQA from './component/ShowMoreQA'
import ShowPublicQA from './component/ShowPublicQA'
import ImageZoom from './component/ImageZoom'

const client_URL = process.env.NEXT_PUBLIC_CLIENT_IP

export default function QaNav({ qaHasUpload, setQaHasUpload, user_role, course_id, courseName }) {
  const token = useUserToken()
  const [courseQas, setCourseQas] = useState([])
  const [userToken, setUserToken] = useState('')

  // 控制 QA 區塊的開合與高度
  const [qaOpen, setQaOpen] = useState(false)
  const qaContentRef = useRef(null)
  const containerRef = useRef(null)
  const [qaHeight, setQaHeight] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  // 控制訊息
  const [message, setMessage] = useState('無訊息')
  const [messageStatus, setMessageStatus] = useState(false)
  const [messageColor, setMessageColor] = useState('')

  // 其他狀態
  const [imageIsZoom, setImageIsZoom] = useState(false)
  const [zoomImage, setZoomImage] = useState()
  const breakpointColumnsObj = { default: 4 }
  const [sortBy, setSortBy] = useState('resourceCategories')
  const [timeSort, setTimeSort] = useState('desc')
  const [publicQAInfo, setPublicQAInfo] = useState({})
  const [showMoreQA, setShowMoreQA] = useState(false)
  const [showPublicQA, setShowPublicQA] = useState(false)
  const [selectBy, setSelectBy] = useState(null)
  const [showRemoveBtn, setShowRemoveBtn] = useState(false)
  const [doubleCheck, setDoubleCheck] = useState(false)

  // 取得 localStorage 中的 token
  useEffect(() => {
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        const localToken = window.localStorage.getItem('token')
        if (localToken) {
          setUserToken(localToken.split(' ')[1])
        }
      }
    }, 100)
  }, [])

  // 渲染頁面時取得 QA 資料
  useEffect(() => {
    if (token) {
      const localStorageSortBy = localStorage.getItem('qa_sort_by')
      const localStorageTimeSortBy = localStorage.getItem('qa_time_sort_by')

      const data = {
        // 沒有就用預設state
        sortType: localStorageSortBy ? localStorageSortBy : sortBy,
        sortOrder: localStorageTimeSortBy ? localStorageTimeSortBy : timeSort,
      }

      userService.getCourseQAs(token, course_id, data).then((res) => {
        if (res.success) {
          setCourseQas(res.data)
          // 更新nav高度
          setTimeout(() => {
            setQaHeight(containerRef.current.scrollHeight)
          }, 30)
          setTimeout(() => {
            setQaHeight(containerRef.current.scrollHeight)
          }, 30)
          setTimeout(() => {
            setQaHeight(containerRef.current.scrollHeight)
          }, 30)
          // 沒有就用預設state，有就不變
          localStorageSortBy ? localStorage.getItem('qa_sort_by') : localStorage.setItem('qa_sort_by', sortBy)
          localStorageTimeSortBy ? localStorage.getItem('qa_time_sort_by') : localStorage.setItem('qa_time_sort_by', timeSort)
        }
      })
    }
  }, [token, course_id, qaHasUpload, qaOpen])

  const changeSort = (sortBy, timeSort) => {
    console.log(timeSort)
    const data = {
      sortType: sortBy,
      sortOrder: timeSort,
    }

    userService.getCourseQAs(token, course_id, data).then((res) => {
      if (res.success) {
        setCourseQas(res.data)
        // 更新nav高度
        setTimeout(() => {
          setQaHeight(containerRef.current.scrollHeight)
        }, 30)
        setTimeout(() => {
          setQaHeight(containerRef.current.scrollHeight)
        }, 30)
        setTimeout(() => {
          setQaHeight(containerRef.current.scrollHeight)
        }, 30)
        if (sortBy) localStorage.setItem('qa_sort_by', sortBy)
        if (timeSort) localStorage.setItem('qa_time_sort_by', timeSort)
      }
    })
  }

  const test = () => {}

  // 切換 QA 區塊展開/收合
  const toggleQA = () => {
    if (!qaOpen) {
      if (qaContentRef.current) {
        setQaHeight(qaContentRef.current.scrollHeight)
      }
      setQaOpen(true)
    } else {
      setQaHeight(0)
      setQaOpen(false)
    }
  }

  // 放大圖片功能
  const clickZoomImage = (imageUrl) => {
    setZoomImage(imageUrl)
    setImageIsZoom(true)
  }

  // 控制訊息顯示
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

  // 刪除 QA
  const removeQuestion = (question_id) => {
    adminService.removeQuestion(token, question_id).then((res) => {
      userService
        .getCourseQAs(token, course_id, sortBy)
        .then((res) => {
          if (res.success) {
            messageControl('刪除成功', true)

            setTimeout(() => {
              setQaHeight(containerRef.current.scrollHeight)
            }, 30)
          }
          setCourseQas(res.data)
        })
        .catch((err) => console.error('Error:', err.message))
    })
  }

  const showPublicQAClick = () => {
    const pageSize = 9999
    adminService.publicInfo(token, pageSize).then((res) => {
      setPublicQAInfo(res.data)
      setShowPublicQA(true)
    })
  }

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
        style={{
          height: messageStatus ? '20px' : '0',
          padding: messageStatus ? '24px' : '0',
          backgroundColor: messageColor,
        }}
        className="message">
        {message}
      </div>
      {imageIsZoom && (
        <ImageZoom
          setImageIsZoom={setImageIsZoom}
          imageUrl={zoomImage}
        />
      )}
      <div
        className="QA-area"
        ref={qaContentRef}
        style={{
          height: qaOpen ? qaHeight : '0px',
          overflow: 'hidden',
          transition: 'height 0.3s ease',
        }}>
        <div
          className="container"
          ref={containerRef}>
          <div className="QA-header">
            <div className="sort-by-area">
              <span
                className="sort-title"
                onClick={test}>
                排序根據
              </span>
              <select
                className="select"
                defaultValue={localStorage.getItem('qa_sort_by') ? localStorage.getItem('qa_sort_by') : sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value)
                  changeSort(e.target.value, timeSort)
                }}>
                <option value="">無</option>
                <option value="resourceCategories">主題排序</option>
                <option value="hints">標籤排序</option>
              </select>
            </div>
            <div className="time-sort-area">
              <div>時間</div>
              <select
                className="select"
                defaultValue={localStorage.getItem('qa_time_sort_by') ? localStorage.getItem('qa_time_sort_by') : timeSort}
                onChange={(e) => {
                  setTimeSort(e.target.value)
                  changeSort(sortBy, e.target.value)
                }}>
                <option value="desc">降序</option>
                <option value="asc">升序</option>
              </select>
            </div>
            {((user_role && user_role === 'teacher') || (user_role && user_role === 'admin')) && (
              <div
                className="show-public-QA"
                onClick={showPublicQAClick}>
                顯示公開QA
              </div>
            )}
            {((user_role && user_role === 'teacher') || (user_role && user_role === 'admin')) && (
              <div
                className="show-delete-btn"
                onClick={() => setShowRemoveBtn(!showRemoveBtn)}>
                刪除QA
              </div>
            )}
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
              style={{
                height: containerHeight,
              }}
              breakpointCols={breakpointColumnsObj}
              columnClassName="my-masonry-grid_column">
              {courseQas.map((item, index) => (
                <div
                  className="QA-list"
                  key={index}>
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
                  {item.qas.map((qaInfo, idx) => (
                    <div
                      key={idx}
                      className="qa-info">
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
                          {qaInfo.hints.map((content, idx2) => (
                            <div
                              className="content"
                              key={idx2}>
                              {content}
                            </div>
                          ))}
                        </div>
                      )}
                      {qaInfo.resourceCategories[0] !== '' && sortBy === 'hints' && (
                        <div className="qa-info-title">
                          {qaInfo.resourceCategories.map((content, idx2) => (
                            <div
                              className="content"
                              key={idx2}>
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
                      <div className="qa-image-area">
                        {qaInfo.image.length > 0 && userToken.length && (
                          <Image
                            key={idx}
                            className="qa-image"
                            src={`${qaInfo.image[0]}?token=${userToken}`}
                            width={200}
                            height={0}
                            loading="lazy"
                            style={{ height: 'auto' }}
                            alt="qa-image"
                            onClick={() => clickZoomImage(`${qaInfo.image[0]}`)}
                          />
                        )}
                      </div>
                      <div className="time-replied-area">
                        <div className="time">{new Date(qaInfo.date).toLocaleString()}</div>
                        <div className="not-replied">{qaInfo.replied === false && '未回覆'}</div>
                        <div className="is-replied">{qaInfo.replied === true && '已回覆'}</div>
                      </div>
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
    </div>
  )
}
