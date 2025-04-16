// 組件庫
import { useEffect, useRef, useState } from 'react'
import Masonry from 'react-masonry-css'
import Image from 'next/image'
import Link from 'next/link'
// method
import { useUserToken } from '../../method/useUserToken'
import userService from '../../method/userService'
import adminService from '../../method/adminService'
// public
import downArrow from '../../public/course/downArrow.png'
import ShowMoreQA from './component/ShowMoreQA'
import ShowPublicQA from './component/ShowPublicQA'
import ImageZoom from './component/ImageZoom'
// 子組件
import AskNav from './component/AskQA'

const client_URL = process.env.NEXT_PUBLIC_CLIENT_IP

export default function QaNav({ qaHasUpload, setQaHasUpload, user_role, course_id, courseName }) {
  const token = useUserToken()
  const [courseQas, setCourseQas] = useState([])
  const [userToken, setUserToken] = useState('')

  const [defaultSortType, setDefaultSortType] = useState('')
  const [defaultSortBy, setDefaultSortBy] = useState('')

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
  const [doubleCheck, setDoubleCheck] = useState(false)

  // get參數
  const [pageSize, setPageSize] = useState(8)
  const [page, setPage] = useState(1)

  // 刪除qa
  const [removeingQA, setRemoveingQA] = useState(false)

  // 提問區
  const [showAskQA, setShowAskQA] = useState(false)
  const [askQAHeight, setAskQAHeight] = useState(0)

  const changeSort = (sortBy, timeSort) => {
    const data = {
      sortType: sortBy,
      sortOrder: timeSort,
      pageSize: pageSize,
      page: page,
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

  const test = () => {
    console.log(courseQas)
  }

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

  const removeQAFromCourse = (qaInfo) => {
    let course_ids_temp = []
    course_ids_temp = qaInfo?.courses.filter((item) => item !== course_id)

    if (qaInfo) {
      let data = {
        question_id: qaInfo._id,
        course_ids: course_ids_temp,
      }
      adminService.patchQaToFolders(token, data).then((res) => {
        console.log(res)
        const tempData = {
          // 沒有就用預設state
          sortType: sortBy,
          sortOrder: timeSort,
          pageSize: pageSize,
          page: page,
        }
        userService.getCourseQAs(token, course_id, tempData).then((res) => {
          if (res?.success) {
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
          }
        })
      })
    }
  }

  const showPublicQAClick = () => {
    const pageSize = 9999
    adminService.publicInfo(token, pageSize).then((res) => {
      setPublicQAInfo(res.data)
      setShowPublicQA(true)
    })
  }

  // 取得 localStorage 中的 token
  useEffect(() => {
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        const localToken = window.localStorage.getItem('token')
        if (localToken) {
          setUserToken(localToken.split(' ')[1])
        }
        const localSortType = window.localStorage.getItem('qa_sort_by')
        if (localToken) {
          setDefaultSortType(localSortType)
        }
        const localSortBy = window.localStorage.getItem('qa_time_sort_by')
        if (localToken) {
          setDefaultSortBy(localSortBy)
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
        pageSize: pageSize,
        page: page,
      }
      userService.getCourseQAs(token, course_id, data).then((res) => {
        if (res.success) {
          messageControl('加載完成', true)
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
        } else {
          messageControl('加載失敗', true)
        }
      })
    }
  }, [token, course_id, qaHasUpload, qaOpen, pageSize])

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
                defaultValue={defaultSortType !== '' ? defaultSortType : sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value)
                  changeSort(e.target.value, timeSort)
                }}>
                <option value="none">無</option>
                <option value="resourceCategories">主題排序</option>
                <option value="hints">標籤排序</option>
              </select>
            </div>
            <div className="time-sort-area">
              <div>時間</div>
              <select
                className="select"
                defaultValue={defaultSortBy !== '' ? defaultSortBy : timeSort}
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
                className="g-blue-btn"
                onClick={showPublicQAClick}>
                公共問題區
              </div>
            )}
            {((user_role && user_role === 'teacher') || (user_role && user_role === 'admin')) && (
              <div
                className="g-red-btn"
                onClick={() => setRemoveingQA(!removeingQA)}>
                刪除QA
              </div>
            )}
            <div
              className="g-black-btn"
              onClick={() => {
                setShowAskQA(true)
              }}>
              提問
            </div>
            {showAskQA && (
              <AskNav
                showAskQA={showAskQA}
                setShowAskQA={setShowAskQA}
                qaHasUpload={qaHasUpload}
                setQaHasUpload={setQaHasUpload}
                course_id={course_id}
              />
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
                course_name={courseName}
                qaHasUpload={qaHasUpload}
                setQaHasUpload={setQaHasUpload}
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
              {(defaultSortType !== 'none' || (sortBy && sortBy !== 'none')) &&
                courseQas.map((item, index) => {
                  if (item.tag) {
                    return (
                      <div
                        className="QA-list"
                        key={index}>
                        {/* 主標題 */}
                        {item.tag !== '' && (
                          <div className="QA-tag">
                            <div className="content">{item.tag}</div>
                          </div>
                        )}
                        {/* 副標題 */}
                        {item?.docs?.length > 0 &&
                          item.docs.map((doc, idx) => (
                            <Link
                              href={`${client_URL}/courses/QaPage?qa_id=${doc._id}&courseName=${courseName}&course_id=${course_id}`}
                              key={idx}
                              className="qa-info">
                              {sortBy === 'resourceCategories' && (
                                <div className="qa-info-title">
                                  {doc?.hints.length > 0 &&
                                    Array.isArray(doc?.hints) &&
                                    doc?.hints.map((hint, index) => (
                                      <div
                                        key={index}
                                        className="content">
                                        {hint}
                                      </div>
                                    ))}
                                </div>
                              )}
                              {sortBy === 'hints' && (
                                <div className="qa-info-title">
                                  {doc?.resourceCategories.length > 0 &&
                                    Array.isArray(doc?.resourceCategories) &&
                                    doc?.resourceCategories.map((resourceCategories, index) => (
                                      <div
                                        key={index}
                                        className="content">
                                        {resourceCategories}
                                      </div>
                                    ))}
                                </div>
                              )}

                              <div className="btn-area">
                                {removeingQA && (
                                  <div
                                    style={{ width: '100%' }}
                                    className="remove-btn"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      if (e.target.innerText === '刪除') {
                                        e.target.innerText = '確認刪除'
                                        e.target.className = 'g-red-btn'
                                        return
                                      }
                                      if (e.target.innerText === '確認刪除') {
                                        // 刪除function
                                        removeQAFromCourse(doc)
                                      }
                                    }}>
                                    刪除
                                  </div>
                                )}
                              </div>
                              <div className="qa-image-area">
                                {doc.image.length > 0 && userToken.length && (
                                  <Image
                                    key={idx}
                                    className="qa-image"
                                    src={`${doc.image[0]}?token=${userToken}`}
                                    width={200}
                                    height={0}
                                    loading="lazy"
                                    style={{ height: 'auto' }}
                                    alt="qa-image"
                                  />
                                )}
                              </div>
                              <div className="time-replied-area">
                                <div className="time">{new Date(doc.date).toLocaleString()}</div>
                                <div className="not-replied">{doc.replied === false && '未回覆'}</div>
                                <div className="is-replied">{doc.replied === true && '已回覆'}</div>
                              </div>
                              <div className="qa-description">{doc.description}</div>
                              {doc.length >= 3 && (
                                <div
                                  className="load-more-btn"
                                  onClick={() => {
                                    setShowMoreQA(true)
                                    setSelectBy(doc.tag)
                                  }}>
                                  點擊加載全部
                                </div>
                              )}
                            </Link>
                          ))}
                        {item?.docs?.length >= 3 && (
                          <div
                            className="g-blue-btn"
                            onClick={() => {
                              setShowMoreQA(true)
                              setSelectBy(item.tag)
                            }}>
                            點擊加載全部
                          </div>
                        )}
                      </div>
                    )
                  }
                })}

              {/* 沒有主題 */}
              {(defaultSortType === 'none' || (sortBy && sortBy === 'none')) &&
                courseQas.map((item, index) => {
                  if (item.description) {
                    return (
                      <Link
                        href={`${client_URL}/courses/QaPage?qa_id=${item._id}&courseName=${courseName}&course_id=${course_id}`}
                        className="qa-info-area"
                        key={index}>
                        {removeingQA && (
                          <button
                            className="g-light-red-btn"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              if (e.target.innerText === '刪除') {
                                e.target.innerText = '確認刪除'
                                e.target.className = 'g-red-btn'
                                return
                              }
                              if (e.target.innerText === '確認刪除') {
                                // 刪除function
                                removeQAFromCourse(item)
                              }
                            }}>
                            刪除
                          </button>
                        )}
                        {item.image && item.image.length > 0 && (
                          <Image
                            className="qa-image"
                            src={`${item.image[0]}?token=${userToken}`}
                            width={300}
                            height={0}
                            alt='qa image pre view'
                            style={{ height: 'auto' }}></Image>
                        )}
                        <div className="content">
                          <div
                            className="is-replied"
                            style={{ color: item.replied ? 'purple' : 'blue' }}>
                            <div
                              className="title"
                              style={{ color: 'black' }}>
                              描述
                            </div>
                            {item.replied ? '已回覆' : '未回覆'}
                          </div>
                          <div className="time">{new Date(item.date).toLocaleString()}</div>
                        </div>
                        <div className="description-area">{item.description}</div>
                      </Link>
                    )
                  }
                })}
            </Masonry>

            <div className="btn-area">
              {(defaultSortType === 'none' || (sortBy && sortBy === 'none')) && (
                <button
                  className="g-loadmore-btn "
                  onClick={() => {
                    setPageSize(pageSize + 8)
                  }}>
                  加載更多問題
                </button>
              )}
            </div>
          </div>

          {qaOpen && (
            <div
              style={{
                top: '50%',
                height: messageStatus ? '20px' : '0',
                padding: messageStatus ? '24px' : '0',
                backgroundColor: messageColor,
              }}
              className="message">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
