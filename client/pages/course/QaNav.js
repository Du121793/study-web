// 組件庫
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
// method
import { useUserToken } from '../../method/useUserToken'
import userService from '../../method/userService'
import adminService from '../../method/adminService'
// public
import dbArrowLeft from '../../public/profile/doubleArrowLeft.png'
import dbArrowRight from '../../public/profile/doubleArrowRight.png'
import ArrowLeft from '../../public/profile/leftArrow.png'
import ArrowRight from '../../public/profile/rightArrow.png'
import downArrow from '../../public/course/downArrow.png'
import ShowMoreQA from './component/ShowMoreQA'
import ShowPublicQA from './component/ShowPublicQA'
import ImageZoom from './component/ImageZoom'
// 子組件
import AskNav from './component/AskQA'

const client_URL = process.env.NEXT_PUBLIC_CLIENT_IP

export default function QaNav({ setLoading, qaHasUpload, setQaHasUpload, user_role, course_id, courseName }) {
  const token = useUserToken()
  const [courseQas, setCourseQas] = useState([])
  const [userToken, setUserToken] = useState('')
  // 頁數控制
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(4)
  const [totalPage, setTotalPage] = useState(1)

  const [defaultSortType, setDefaultSortType] = useState('')
  const [defaultSortBy, setDefaultSortBy] = useState('')

  // 控制 QA 區塊的開合與高度
  const [qaOpen, setQaOpen] = useState(false)
  const qaContentRef = useRef(null)
  const containerRef = useRef(null)
  const [qaHeight, setQaHeight] = useState(0)

  /* 控制訊息*/
  const [message, setMessage] = useState('無訊息')
  const [messageStatus, setMessageStatus] = useState(false)
  const [messageColor, setMessageColor] = useState('')
  /* 其他狀態*/
  const [imageIsZoom, setImageIsZoom] = useState(false)
  const [zoomImage, setZoomImage] = useState()
  const [sortBy, setSortBy] = useState('resourceCategories')
  const [timeSort, setTimeSort] = useState('desc')
  const [publicQAInfo, setPublicQAInfo] = useState({})
  const [showMoreQA, setShowMoreQA] = useState(false)
  const [showPublicQA, setShowPublicQA] = useState(false)
  const [selectBy, setSelectBy] = useState(null)
  /* 刪除qa*/
  const [removeingQA, setRemoveingQA] = useState(false)
  /* 控制顯示提問區*/
  const [showAskQA, setShowAskQA] = useState(false)
  /* 全局寬度*/
  const [windowsWidth, setWindowsWidth] = useState(0)
  const isClient = typeof window === 'object'
  const headerRef = useRef(null)
  const navInnerRef = useRef(null)
  // 控制內部卡片的寬度
  const qa_container_ref = useRef(null)
  const [qaCardWidth, setQaCardWidth] = useState(0)
  /* QA加載中 */
  const [qaLoading, setQaLoading] = useState(false)

  const test = () => {}

  // 切換排序
  const changeSort = (sortBy, timeSort) => {
    setPage(1)
    const data = {
      sortType: sortBy,
      sortOrder: timeSort,
      pageSize: pageSize,
      page: 1,
    }
    setLoading(true)
    setQaLoading(true)
    userService.getCourseQAs(token, course_id, data).then((res) => {
      if (res.success) {
        setLoading(false)
        setQaLoading(false)
        setCourseQas(res.data)
        setTimeout(() => {
          setQaHeight(navInnerRef?.current?.clientHeight + headerRef?.current?.clientHeight + 100)
        }, 30)
      }
    })
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

  // 刪除QA按鈕
  const removeQAFromCourse = (qaInfo) => {
    let course_ids_temp = []
    course_ids_temp = qaInfo?.courses.filter((item) => item !== course_id)

    if (qaInfo) {
      let data = {
        question_id: qaInfo._id,
        course_ids: course_ids_temp,
      }
      adminService.patchQaToFolders(token, data).then((res) => {
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

  // 顯示公開問題按鈕
  const showPublicQAClick = () => {
    const pageSize = 9999
    adminService.publicInfo(token, pageSize).then((res) => {
      setPublicQAInfo(res.data)
      setShowPublicQA(true)
    })
  }

  // 參數:總頁數，中間頁數，從中間往左右總共要幾頁
  function getPage(total, thisPage, pageSize = 5) {
    if (total <= 0 || thisPage <= 0 || thisPage > total) {
      return []
    }

    let page = []
    if (total <= pageSize) {
      for (let i = 0; i < total; i++) {
        page.push(i + 1)
      }
      return page
    }

    const leftSize = Math.floor((pageSize - 1) / 2)
    const rightSize = pageSize - 1 - leftSize

    let start = Math.max(1, thisPage - leftSize)
    let end = Math.min(total, thisPage + rightSize)

    if (start === 1) {
      end = Math.min(total, pageSize)
      start = 1
    } else if (end === total) {
      start = Math.max(1, total - pageSize + 1)
      end = total
    }

    for (let i = start; i <= end; i++) {
      page.push(i)
    }

    return page
  }

  // 當全局寬度有變動的話，計算nav內部元素的高度來相加並加上40
  useEffect(() => {
    if (!isClient) return false
    const container = navInnerRef?.current
    if (!container) return
    if (headerRef && navInnerRef) {
      const innerWidth = navInnerRef?.current?.clientWidth
      const headerWidth = headerRef?.current?.clientWidth
      const innerHeight = navInnerRef?.current?.clientHeight
      const headerHeight = headerRef?.current?.clientHeight
      setQaHeight(innerHeight + headerHeight + 40)
    }
  }, [windowsWidth])

  // 監聽全局寬度變化
  useEffect(() => {
    if (!isClient) return false

    const handleResize = () => {
      setWindowsWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    // 先觸發一次，保證初始值正確
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [isClient])

  // 寬度變動會改變內部qa card寬度
  useEffect(() => {
    if (qaContentRef) setQaCardWidth(qaContentRef?.current?.clientWidth / 5)
    setQaHeight(navInnerRef?.current?.clientHeight + headerRef?.current?.clientHeight + 100)
  }, [windowsWidth])

  // 渲染頁面時取得 QA 資料
  useEffect(() => {
    if (token) {
      setLoading(true)
      setQaLoading(true)
      const data = {
        // 沒有就用預設state
        sortType: sortBy,
        sortOrder: timeSort,
        pageSize: pageSize,
        page: page,
      }
      userService.getCourseQAs(token, course_id, data).then((res) => {
        if (res.success) {
          setCourseQas(res.data)
          setTotalPage(res.totalPage)
          setLoading(false)
          setQaLoading(false)
          setTimeout(() => {
            setQaHeight(navInnerRef?.current?.clientHeight + headerRef?.current?.clientHeight + 100)
          }, 30)
        } else {
          messageControl('加載失敗', true)
        }
      })
    }
  }, [token, qaHasUpload, qaOpen, page])

  useEffect(() => {
    const localToken = localStorage.getItem('token')
    if (localToken) {
      setUserToken(localToken.split(' ')[1])
    }
  }, [])

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
      {/* 圖片放大 */}
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
          {/* header */}
          <div
            className="QA-header"
            ref={headerRef}>
            <form
              className="search-area"
              onSubmit={(e) => {
                e.preventDefault()
              }}>
              <input type="text" />
              <button
                type="submit"
                className="g-blue-btn">
                搜尋
              </button>
            </form>
            <div className="sort-by-area">
              <span
                className="sort-title"
                onClick={test}>
                排序根據
              </span>
              <select
                className="select"
                defaultValue={sortBy}
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
              <div>時間排序</div>
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
                公共問題
              </div>
            )}
            {((user_role && user_role === 'teacher') || (user_role && user_role === 'admin')) && (
              <div
                className="g-red-btn"
                onClick={() => setRemoveingQA(!removeingQA)}>
                刪除問題
              </div>
            )}
            <div
              className="g-black-btn"
              onClick={() => {
                setShowAskQA(true)
              }}>
              我要提問
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

          {/* 頁數切換 */}
          <div className="page-switch">
            <Image
              alt="switch back to first page icon"
              src={dbArrowLeft}
              className="page-switcher"
              width={24}
              height={24}
              onClick={() => {
                setPage(1)
              }}></Image>
            <Image
              alt="switch back one page icon"
              src={ArrowLeft}
              className="page-switcher"
              width={24}
              height={24}
              onClick={() => {
                if (page === 1) {
                  return
                } else {
                  setPage((prop) => prop - 1)
                }
              }}></Image>
            {getPage(totalPage, page).map((item, index) => {
              if (page === item) {
                return (
                  <div
                    key={index}
                    className="now-page active">
                    {item}
                  </div>
                )
              }
              return (
                <div
                  onClick={() => {
                    setPage(item)
                  }}
                  key={index}
                  className="now-page">
                  {item}
                </div>
              )
            })}
            <Image
              alt="switch next to left page icon"
              src={ArrowRight}
              className="page-switcher"
              width={24}
              height={24}
              onClick={() => {
                if (page === totalPage) {
                  return
                } else {
                  setPage((prop) => prop + 1)
                }
              }}></Image>
            <Image
              alt="switch next one page icon"
              src={dbArrowRight}
              className="page-switcher"
              width={24}
              height={24}
              onClick={() => {
                setPage(totalPage)
              }}></Image>
          </div>

          {/* inner */}
          <div
            className="QA-grid"
            ref={navInnerRef}>
            <div
              className="QA-container"
              ref={qa_container_ref}>
              {qaLoading && (
                <div
                  className="QA-list"
                  style={{ padding: 0, border: 0, width: qaCardWidth }}>
                  <div
                    className="loading-area"
                    style={{ width: '100%', height: '100%' }}></div>
                </div>
              )}
              {(defaultSortType !== 'none' || (sortBy && sortBy !== 'none')) &&
                courseQas.map((item, index) => {
                  if (item.tag) {
                    return (
                      <div
                        className="QA-list"
                        key={index}
                        style={{ width: qaCardWidth }}
                        onClick={() => {}}>
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
                              href={`${client_URL}/course/QaPage?qa_id=${doc._id}&courseName=${courseName}&course_id=${course_id}`}
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
                                    onClick={() => {
                                      console.log(doc)
                                    }}
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
                        href={`${client_URL}/course/QaPage?qa_id=${item._id}&courseName=${courseName}&course_id=${course_id}`}
                        className="qa-info-area"
                        style={{ width: qaCardWidth }}
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
                            alt="qa image pre view"
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
