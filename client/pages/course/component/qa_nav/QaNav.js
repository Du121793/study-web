// 組件庫
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
// method
import { useUserToken } from '../../../../method/useUserToken'
import userService from '../../../../method/userService'
import adminService from '../../../../method/adminService'
// public
import dbArrowLeft from '../../../../public/profile/doubleArrowLeft.png'
import dbArrowRight from '../../../../public/profile/doubleArrowRight.png'
import ArrowLeft from '../../../../public/profile/leftArrow.png'
import ArrowRight from '../../../../public/profile/rightArrow.png'
import downArrow from '../../../../public/course/downArrow.png'
import ImageZoom from '../image_zoom/ImageZoom'
// 子組件
import AskNav from '../ask_qa/AskQA'
import ShowPublicQA from '../show_public_qa/ShowPublicQA'
import ShowMoreQA from '../show_more_qa/ShowMoreQA'
// style
import style from './style.module.css'

const client_URL = process.env.NEXT_PUBLIC_CLIENT_IP

export default function QaNav({ setContainerIndex, setLoading, qaHasUpload, setQaHasUpload, user_role, course_id, courseName }) {
  const token = useUserToken()
  const [courseQas, setCourseQas] = useState([])
  const [userToken, setUserToken] = useState('')
  // 頁數控制
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(30)
  const [totalPage, setTotalPage] = useState(1)

  const [defaultSortType, setDefaultSortType] = useState('')
  const [defaultSortBy, setDefaultSortBy] = useState('')

  // 控制 QA 區塊的開合與高度
  const [qaOpen, setQaOpen] = useState(false)
  const qaContentRef = useRef(null)
  const containerRef = useRef(null)
  const [qaHeight, setQaHeight] = useState(0)

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
  const [imgLoadComplete, setImgLoadComplete] = useState(false)
  // UX
  const [message, setMessage] = useState('')

  const initUX = () => {
    const timer = setTimeout(() => {
      setMessage('')
    }, 2000)
    return () => {
      clearTimeout(timer)
    }
  }

  // 新版邏輯 收合UI
  // 收合QA大標題
  const qalistContainerRef = useRef()

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
      setQaOpen(true)
    } else {
      setQaHeight(0)
      setQaOpen(false)
    }
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
    if (token && qaOpen) {
      setLoading(true)
      setQaLoading(true)
      const data = {
        // 沒有就用預設state
        sortType: sortBy,
        sortOrder: timeSort,
        pageSize: pageSize,
        page: page,
      }
      userService
        .getCourseQAs(token, course_id, data)
        .then((res) => {
          if (res.success) {
            setCourseQas(res.data)
            setTotalPage(res.totalPage)
            setLoading(false)
            setQaLoading(false)
          }
        })
        .catch(() => {
          setMessage('發生錯誤')
        })
        .finally(() => {
          initUX()
        })
    }
  }, [token, qaHasUpload, qaOpen, page])

  // 當qa有改變，會更新UI內部高度，第二次是為了在圖片加載後再次更新高度
  useEffect(() => {
    if (courseQas) {
      setQaHeight(navInnerRef?.current?.clientHeight + headerRef?.current?.clientHeight + 100)
      setTimeout(() => {
        setQaHeight(navInnerRef?.current?.clientHeight + headerRef?.current?.clientHeight + 100)
      }, 200)
    }
  }, [imgLoadComplete, qaOpen, courseQas])

  useEffect(() => {
    const localToken = localStorage.getItem('token')
    if (localToken) {
      setUserToken(localToken.split(' ')[1])
    }
  }, [])

  return (
    <div className={style['qa-nav']}>
      {/* 開關UI按鈕 */}
      <div
        onClick={toggleQA}
        className={style['header']}>
        <Image
          src={downArrow}
          alt="open Q & A nav's icon"
          width={40}
          height={40}
        />
        <span>Q & A</span>
      </div>
      {/* 放大圖片用 */}
      {imageIsZoom && (
        <ImageZoom
          setImageIsZoom={setImageIsZoom}
          imageUrl={zoomImage}
        />
      )}
      <div
        className={style['QA-area']}
        ref={qaContentRef}
        style={{
          height: qaOpen ? qaHeight : '0px',
          overflow: 'hidden',
          transition: 'height 0.3s ease',
        }}>
        <div
          className={style['container']}
          ref={containerRef}>
          <div
            className={style['QA-header']}
            ref={headerRef}>
            <div className={style['sort-by-area']}>
              <span
                className={style['sort-title']}
                onClick={test}>
                排序根據
              </span>
              <select
                className={style['select']}
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
            <div className={style['time-sort-area']}>
              <div>時間排序</div>
              <select
                className={style['select']}
                defaultValue={defaultSortBy !== '' ? defaultSortBy : timeSort}
                onChange={(e) => {
                  setTimeSort(e.target.value)
                  changeSort(sortBy, e.target.value)
                }}>
                <option value="desc">降序</option>
                <option value="asc">升序</option>
              </select>
            </div>
            {(user_role === 'teacher' || user_role === 'admin') && (
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
            {(user_role === 'teacher' || user_role === 'admin') && (
              <div
                className="g-red-btn"
                onClick={() => setRemoveingQA(!removeingQA)}>
                刪除問題
              </div>
            )}
            <AskNav
              userRole={user_role}
              setContainerIndex={setContainerIndex}
              showAskQA={showAskQA}
              setShowAskQA={setShowAskQA}
              qaHasUpload={qaHasUpload}
              setQaHasUpload={setQaHasUpload}
              course_id={course_id}
            />
          </div>
          <div className={`${style['page-switch-area']} page-switch`}>
            <Image
              alt="switch back to first page icon"
              src={dbArrowLeft}
              className={style['page-switcher']}
              width={24}
              height={24}
              onClick={() => setPage(1)}
            />
            <Image
              alt="switch back one page icon"
              src={ArrowLeft}
              className={'page-switcher'}
              width={24}
              height={24}
              onClick={() => {
                if (page > 1) setPage((p) => p - 1)
              }}
            />
            {getPage(totalPage, page).map((item, index) => (
              <div
                key={index}
                className={page === item ? `${'now-page'} ${'active'}` : 'now-page'}
                onClick={() => setPage(item)}>
                {item}
              </div>
            ))}
            <Image
              alt="switch next to left page icon"
              src={ArrowRight}
              className={'page-switcher'}
              width={24}
              height={24}
              onClick={() => {
                if (page < totalPage) setPage((p) => p + 1)
              }}
            />
            <Image
              alt="switch next one page icon"
              src={dbArrowRight}
              className={style['page-switcher']}
              width={24}
              height={24}
              onClick={() => setPage(totalPage)}
            />
          </div>
          <div
            className={style['QA-grid']}
            ref={navInnerRef}>
            <div
              className={style['QA-container']}
              ref={qa_container_ref}>
              {qaLoading && (
                <div
                  className={style['QA-list']}
                  style={{ padding: 0, border: 0, width: qaCardWidth }}>
                  <div
                    className={style['loading-area']}
                    style={{ width: '100%', height: '100%' }}></div>
                </div>
              )}
              {(defaultSortType !== 'none' || (sortBy && sortBy !== 'none')) &&
                courseQas.map((item, index) => {
                  if (item.tag) {
                    return (
                      <div
                        className={`${style['QA-list']}`}
                        key={index}
                        ref={qalistContainerRef}
                        style={{ width: qaCardWidth }}
                        onClick={() => {}}>
                        {/* 主標題 */}
                        {item.tag !== '' && (
                          <div className={style['QA-tag']}>
                            <div className={style['content']}>{item.tag}</div>
                          </div>
                        )}
                        {/* 副標題 */}
                        {item?.docs?.length > 0 &&
                          item.docs.map((doc, idx) => (
                            <Link
                              href={`${client_URL}/course/QaPage?qa_id=${doc._id}&courseName=${courseName}&course_id=${course_id}`}
                              key={idx}
                              className={style['qa-info']}>
                              {sortBy === 'resourceCategories' && (
                                <div className={style['qa-info-title']}>
                                  {doc?.hints.length > 0 &&
                                    Array.isArray(doc?.hints) &&
                                    doc?.hints.map((hint, index) => (
                                      <div
                                        key={index}
                                        className={style['content']}>
                                        {hint}
                                      </div>
                                    ))}
                                </div>
                              )}
                              {sortBy === 'hints' && (
                                <div className={style['qa-info-title']}>
                                  {doc?.resourceCategories.length > 0 &&
                                    Array.isArray(doc?.resourceCategories) &&
                                    doc?.resourceCategories.map((resourceCategories, index) => (
                                      <div
                                        key={index}
                                        className={style['content']}>
                                        {resourceCategories}
                                      </div>
                                    ))}
                                </div>
                              )}

                              <div className={style['btn-area']}>
                                {removeingQA && (
                                  <div
                                    style={{ width: '100%' }}
                                    className={style['remove-btn']}
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
                              <div className={style['qa-image-area']}>
                                {doc.image.length > 0 && userToken.length && (
                                  <Image
                                    key={idx}
                                    className={style['qa-image']}
                                    src={`${doc.image[0]}?token=${userToken}`}
                                    width={200}
                                    height={0}
                                    loading="lazy"
                                    onLoadingComplete={() => {
                                      setImgLoadComplete(!imgLoadComplete)
                                    }}
                                    style={{ height: 'auto' }}
                                    alt="qa-image"
                                  />
                                )}
                              </div>
                              <div className={style['time-replied-area']}>
                                <div className={style['time']}>{new Date(doc.date).toLocaleString()}</div>
                                <div className={style['not-replied']}>{doc.replied === false && '未回覆'}</div>
                                <div className={style['is-replied']}>{doc.replied === true && '已回覆'}</div>
                              </div>
                              <div className={style['qa-description']}>{doc.description}</div>
                              {doc.length >= 3 && (
                                <div
                                  className={style['load-more-btn']}
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
                        className={style['qa-info-area']}
                        style={{ width: qaCardWidth }}
                        key={index}>
                        {removeingQA && (
                          <button
                            className={style['g-light-red-btn']}
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
                            className={style['qa-image']}
                            src={`${item.image[0]}?token=${userToken}`}
                            width={300}
                            height={0}
                            alt="qa image pre view"
                            style={{ height: 'auto' }}
                            onLoadingComplete={() => {
                              setImgLoadComplete(!imgLoadComplete)
                            }}></Image>
                        )}
                        <div className={style['content']}>
                          <div
                            className={style['is-replied']}
                            style={{ color: item.replied ? 'purple' : 'blue' }}>
                            <div
                              className={style['title']}
                              style={{ color: 'black' }}>
                              描述
                            </div>
                            {item.replied ? '已回覆' : '未回覆'}
                          </div>
                          <div className={style['time']}>{new Date(item.date).toLocaleString()}</div>
                        </div>
                        <div className={style['description-area']}>{item.description}</div>
                      </Link>
                    )
                  }
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
