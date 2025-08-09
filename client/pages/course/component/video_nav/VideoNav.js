// 原生組件庫
import React from 'react'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// public
import downArrow from '../../../../public/course/downArrow.png'
import no_image_available_icon from '../../../../public/global/no-image-available-icon.jpg'
import dbArrowLeft from '../../../../public/profile/doubleArrowLeft.png'
import dbArrowRight from '../../../../public/profile/doubleArrowRight.png'
import ArrowLeft from '../../../../public/profile/leftArrow.png'
import ArrowRight from '../../../../public/profile/rightArrow.png'

// method
import { useUserToken } from '../../../../method/useUserToken'
import userService from '../../../../method/userService'
import adminService from '../../../../method/adminService'

// 子組件
import VideoUploadComponent from '../upload_video/UploadVideo'
import EditVideoInfo from '../edit_video_info/EditVideoInfo'
import UploadOldVimeoVDO from '../upload_old_vimeo_vdo/UploadOldVimeoVDO'

// style
import style from './style.module.css'

// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

export default function VideoNav({ course_id, courseName, user_role, setLoading }) {
  const token = useUserToken()
  // 控制頁面scroll狀態
  const [page_body, setPage_body] = useState([])
  // nav 高度- 使用 ref 與 state 控制展開/收合
  const [videoNavOpen, setVideoNavOpen] = useState(true)
  const videoContentRef = useRef(null)
  const [videoContentHeight, setVideoContentHeight] = useState(0)
  // 控制上傳影片UI
  const [uploadVideoUIInnerOpacity, setUploadVideoUIInnerOpacity] = useState(0)
  // 控制上傳舊vimeoUI
  const [UploadOldVimeoVDOHeight, setUploadOldVimeoVDOHeight] = useState(0)
  const [showUploadOldVimeoVDOUI, setShowUploadOldVimeoVDOUI] = useState(false)
  const [uploadOldVimeoVDOWidht, setUploadOldVimeoVDOWidht] = useState(0)
  const [uploadOldVimeoVDOInnerEleOpacity, setUploadOldVimeoVDOInnerEleOpacity] = useState(0)
  // 影片
  const [videos, setVideos] = useState([])

  //loading
  const [deleteLoading, setDeleteLoading] = useState(false)
  // 請求影片資訊的參數
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)
  const [totalPage, setTotalPage] = useState(1)
  const [chooseType, setChooseType] = useState('')
  const [chooseSortOrder, setChooseSortOrder] = useState('desc')
  const [isShowVideoUpload, setIsShowVideoUpload] = useState(false)

  // 給video子組件的參數
  const [uploadSuccess, setUploadSuccess] = useState(false) // 用於上傳完成更新影片區域
  const [uploadError, setUploadError] = useState(false) // 存取是否上傳發生錯誤

  // 開關編輯影片介面與按鈕
  const [showEditVideoBtn, setShowEditVideoBtn] = useState(false)
  const [editShowVideoInfo, setShowEditVideoInfo] = useState(false)
  const [choseEditVideo, setChoseEditVideo] = useState({})
  // 編輯影片參數
  const [video_id, setVideo_id] = useState('false')

  // 控制移除影片的小圖案高度
  const [videoDeleteBtnHeight, setVideoDeleteBtnHeight] = useState('0px')
  // 子元素有變更，用來更新video內容
  const [hasChange, setHasChange] = useState(false)
  // 控制訊息
  const [message, setMessage] = useState('無訊息')
  const [messageStatus, setMessageStatus] = useState(false)
  const [messageColor, setMessageColor] = useState('')
  // 全局寬度
  const [windowsWidth, setWindowsWidth] = useState(0)
  const inputRef = useRef(null)
  const videoRef = useRef(null)
  const loadMoreRef = useRef(null)
  const isClient = typeof window === 'object'
  // 影片區域動態變更內容寬度
  const [videoCardWidth, setVideoCardWidth] = useState(0)

  /* 用來將top-container內的圖片切成父元素寬高 */
  const topContainerRef = useRef(null)
  const [cardImageWidth, setCardImageWidth] = useState(0)
  const [cardImageHeight, setCardImageHeight] = useState(0)

  const componentsRef = useRef()

  /* 影片加載 */
  const [videoLoading, setVideoLoading] = useState(false)
  useEffect(() => {
    setCardImageWidth(topContainerRef?.current?.clientWidth)
    setCardImageHeight(topContainerRef?.current?.scrollHeight)
  }, [windowsWidth])

  const test = () => {
    console.log(videos)
  }

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

  // 獲得影片資訊
  const getCourseVideos = (changeMessage = Boolean) => {
    if (token && course_id) {
      setLoading(true)
      setVideoLoading(true)
      userService
        .getVideoInfo(token, course_id, {
          type: 'MainClass',
          page: page,
          pageSize: pageSize,
          sortBy: chooseType,
          sortOrder: chooseSortOrder,
        })
        .then((res) => {
          // 這行經常在剛npm run dev時出錯，有可能是api還沒啟動
          setVideos(res.data)
          setLoading(false)
          setVideoLoading(false)
          if (changeMessage) {
            messageControl('加載完成', true)
          } else {
            return
          }
        })
    }
  }

  // 計算高度進行切換，用於transition
  const toggleVideoNav = () => {
    if (!videoNavOpen) {
      if (videoContentRef.current) {
        setVideoContentHeight(videoContentRef.current.scrollHeight)
      }
      setVideoNavOpen(true)
    } else {
      setVideoContentHeight(0)
      setVideoNavOpen(false)
    }
  }

  // 切換排序的type
  const switchSortBy = (e) => {
    setChooseType(e)
  }

  // 切換排序的正倒序
  const switchSortOrder = (e) => {
    setChooseSortOrder(e)
  }

  // 影片長度計算
  const formatSecondsToHMS = (totalSeconds) => {
    // 先把秒數做四捨五入或直接取 floor
    // 這裡用 Math.floor 來避免有小數
    const seconds = Math.floor(totalSeconds)

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    // 補零 (padStart) 讓它們保持兩位數
    const hoursString = String(hours).padStart(2, '0')
    const minutesString = String(minutes).padStart(2, '0')
    const secsString = String(secs).padStart(2, '0')
    if (hoursString === '0000') {
      return `${hoursString}:${minutesString}:${secsString}`
    }
    return `${minutesString}:${secsString}`
  }

  // 開啟刪除影片的按鈕
  const showDeleteBtn = () => {
    if (videoDeleteBtnHeight === '0px') {
      setVideoDeleteBtnHeight('24px')
    } else {
      setVideoDeleteBtnHeight('0px')
    }
  }

  // 二次確認是否刪除該影片
  const doubleCheckDelete = (e, item) => {
    const deleteBtn = document.querySelectorAll('.delete-video-btn')
    const from = Array.from(deleteBtn)
    if (e.innerText === '在點擊一次確認刪除') {
      setLoading(true)
      setDeleteLoading(true)
      adminService.deleteVideo(token, item._id, course_id).then((res) => {
        setLoading(false)
        getCourseVideos(false)
        messageControl('移除成功', true)
        setDeleteLoading(false)
      })
    } else {
      from.map((item) => {
        if ((item.innerText = '在點擊一次確認刪除')) {
          item.innerText = 'x'
        }
      })
      e.innerText = '在點擊一次確認刪除'
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

  // 若是任何一個有改變，重新發一次影片請求
  useEffect(() => {
    if (token && course_id) {
      setLoading(true)
      userService
        .getVideoInfo(token, course_id, {
          type: 'MainClass',
          page: page,
          pageSize: pageSize,
          // 類型
          sortBy: chooseType,
          // 順序
          sortOrder: chooseSortOrder,
        })
        .then((res) => {
          if (res?.success) {
            setLoading(false)
            setVideoLoading(false)
            setVideos(res.data)
            setTotalPage(res.totalPage)
          } else {
            messageControl('發生錯誤', false)
          }
        })
    }
  }, [token, course_id, chooseType, chooseSortOrder, uploadSuccess, page, hasChange])

  // 當全局寬度有變動的話，計算nav內部元素的高度來相加並加上40
  useEffect(() => {
    if (!isClient) return false
    if (inputRef && videoRef && loadMoreRef) {
      // 控制內部元素寬
      setVideoCardWidth(videoRef?.current?.clientWidth / 5)
      // 控制整體高
      setVideoContentHeight(videoRef?.current?.scrollHeight + componentsRef?.current?.scrollHeight)
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

  // 控制nav高度
  useEffect(() => {
    if (videoNavOpen && inputRef && videoRef && loadMoreRef) {
      setVideoContentHeight(videoRef?.current?.scrollHeight + componentsRef?.current?.scrollHeight)
    }
  }, [videos, videoNavOpen])

  // 控制頁面scroll狀態
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setPage_body(document.querySelector('body'))
    }
    if (page_body && page_body.style) {
      page_body.style.overflow = 'auto'
    }
  }, [page_body])

  return (
    <div className={style['video-nav']}>
      {/* nav 黑底頂部*/}
      <div
        onClick={() => {
          toggleVideoNav()
        }}
        id={style['video-header']}
        className={style['header']}>
        <Image
          src={downArrow}
          alt="open video nav's icon"
          width={40}
          height={40}
        />
        <span>影片專區</span>
      </div>
      {/* nav 內部 */}
      {videoNavOpen && (
        <div
          className={style['components']}
          ref={componentsRef}>
          <div className={style['components-container']}>
            {/* 上傳影片的子組件 */}
            <VideoUploadComponent
              uploadVideoUIInnerOpacity={uploadVideoUIInnerOpacity}
              setUploadVideoUIInnerOpacity={setUploadVideoUIInnerOpacity}
              messageControl={messageControl}
              getCourseVideos={getCourseVideos}
              course_id={course_id}
              isShowVideoUpload={isShowVideoUpload}
              setIsShowVideoUpload={setIsShowVideoUpload}
              setUploadSuccess={setUploadSuccess}
              uploadSuccess={uploadSuccess}
              uploadError={uploadError}
              setUploadError={setUploadError}
            />
            {/* 移除影片button */}
            {user_role && (user_role === 'teacher' || user_role === 'admin') && (
              <div
                className="g-red-btn"
                onClick={showDeleteBtn}>
                移除影片
              </div>
            )}
            {/* 編輯影片的子組件 */}
            {/* 編輯影片 button */}
            {user_role && (user_role === 'teacher' || user_role === 'admin') && (
              <div>
                <span
                  onClick={() => {
                    setShowEditVideoBtn(!showEditVideoBtn)
                  }}
                  className="g-blue-btn">
                  編輯影片
                </span>
                {editShowVideoInfo && (
                  <EditVideoInfo
                    getCourseVideos={getCourseVideos}
                    messageControl={messageControl}
                    setShowEditVideoInfo={setShowEditVideoInfo}
                    course_id={course_id}
                    token={token}
                    video_id={video_id}
                    video_info={choseEditVideo}
                    setLoading={setLoading}></EditVideoInfo>
                )}
              </div>
            )}

            {/* 上傳舊vimeoVDO的組件 */}
            {user_role && (user_role === 'teacher' || user_role === 'admin') && (
              <UploadOldVimeoVDO
                course_id={course_id}
                UploadOldVimeoVDOHeight={UploadOldVimeoVDOHeight}
                setUploadOldVimeoVDOHeight={setUploadOldVimeoVDOHeight}
                uploadOldVimeoVDOWidht={uploadOldVimeoVDOWidht}
                setUploadOldVimeoVDOWidht={setUploadOldVimeoVDOWidht}
                showUploadOldVimeoVDOUI={showUploadOldVimeoVDOUI}
                setShowUploadOldVimeoVDOUI={setShowUploadOldVimeoVDOUI}
                uploadOldVimeoVDOInnerEleOpacity={uploadOldVimeoVDOInnerEleOpacity}
                setUploadOldVimeoVDOInnerEleOpacity={setUploadOldVimeoVDOInnerEleOpacity}></UploadOldVimeoVDO>
            )}

            {/* 編輯權限 button */}
            {user_role && (user_role === 'teacher' || user_role === 'admin') && (
              <Link
                href={{ pathname: `${clientIp}/course/AccessSetting`, query: { course_name: courseName, course_id: course_id } }}
                className="g-black-btn">
                編輯權限
              </Link>
            )}
          </div>
          <div className={style['sort-options']}>
            {/* 排序根據 */}
            <div
              className={style['content']}
              onClick={test}>
              排序根據
            </div>
            <div className={style['select']}>
              <select onChange={(e) => switchSortBy(e.target.value)}>
                <option value="">上傳時間</option>
                <option value="length">影片長度</option>
                <option value="recordDate">錄影時間</option>
              </select>
            </div>
            {/* 排序根據 */}
            <div className={style['select']}>
              <select onChange={(e) => switchSortOrder(e.target.value)}>
                <option value="desc">倒序</option>
                <option value="asc">正序</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div
        className={style['video-nav-content']}
        ref={videoContentRef}
        style={{
          height: videoNavOpen ? videoContentHeight + 'px' : '0px',
          overflow: 'hidden',
          transition: 'height 0.3s ease',
        }}>
        <div className={style['page-switch']}>
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
        {/* message */}
        {videoNavOpen && (
          <div className="meesage-area">
            <div
              style={{ top: '80px', height: messageStatus ? '20px' : '0', padding: messageStatus ? '24px' : '0', backgroundColor: messageColor }}
              className="message">
              {message}
            </div>
          </div>
        )}

        {/* 影片顯示區 */}
        <div
          className={style['video-area-container']}
          ref={videoRef}>
          {/* 刪除按鈕 */}
          {deleteLoading && (
            <div className={style['loading-main']}>
              <div className={style['loader']}></div>
            </div>
          )}

          <div className={style['video-area']}>
            {videoLoading && (
              <div
                className={style['video-card']}
                style={{ width: videoCardWidth }}>
                <div
                  className={style['loading-area']}
                  style={{ width: '100%', height: '90%' }}></div>
              </div>
            )}
            {videos &&
              videos.map((item) => (
                <Link
                  key={item._id}
                  style={{ cursor: item.access.isAccess ? 'pointer' : 'not-Allowed', width: windowsWidth > '1100' && videoCardWidth }}
                  className={style['video-card']}
                  onClick={(e) => {
                    if (!item.access.isAccess) {
                      e.preventDefault()
                    }
                  }}
                  href={{
                    pathname: `${clientIp}/videoPlay/Player`,
                    query: {
                      course_name: courseName,
                      video_id: item._id,
                      course_id: course_id,
                      info: JSON.stringify({ description: item.description, title: item.title, time: item.date }),
                    },
                  }}>
                  {showEditVideoBtn && (
                    <div
                      className={style['edit-btn']}
                      onClick={(e) => {
                        e.preventDefault()
                        setShowEditVideoInfo(true)
                        setVideo_id(item._id)
                        setChoseEditVideo(item)
                      }}>
                      編輯
                    </div>
                  )}

                  <div className={style['top-container']}>
                    {/* 刪除按鈕 */}
                    <div
                      className={style['delete-video-btn']}
                      style={{ height: videoDeleteBtnHeight }}
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        doubleCheckDelete(e.target, item)
                      }}>
                      x
                    </div>
                    {/* 影片縮圖 */}
                    {item?.thumbnail && (item?.thumbnail?.length > 0 || item?.thumbnail !== '') ? (
                      <Image
                        src={item.thumbnail}
                        className={style['videos-shot']}
                        loading="lazy"
                        alt={item.title}
                        width={0}
                        height={0}
                        onLoadingComplete={() => {
                          setVideoContentHeight(videoRef?.current?.scrollHeight + componentsRef?.current?.scrollHeight)
                        }}
                      />
                    ) : (
                      <Image
                        src={no_image_available_icon}
                        className={style['videos-shot']}
                        loading="lazy"
                        alt={'no videos shot icon'}
                        width={0}
                        height={0}
                        onLoadingComplete={() => {
                          setVideoContentHeight(videoRef?.current?.scrollHeight + componentsRef?.current?.scrollHeight)
                        }}
                      />
                    )}
                    {/* 影片長度 */}
                    <div className={style['video-length']}>{formatSecondsToHMS(item.length)}</div>
                  </div>

                  <div className={style['bottom-container']}>
                    {/* 影片詳情 */}
                    <div className={style['info']}>
                      <div className={style['title']}>{item.title}</div>
                      <div className={style['time']}>
                        <div className={style['day']}>
                          <div>{item.date.split(/[-T:.]/)[0]}/</div>
                          <div>{item.date.split(/[-T:.]/)[1]}/</div>
                          <div>{item.date.split(/[-T:.]/)[2]}</div>
                        </div>
                        <div className={style['clock']}>
                          <div>{item.date.split(/[-T:.]/)[3]}:</div>
                          <div>{item.date.split(/[-T:.]/)[4]}</div>
                        </div>
                        {item.isPrivate === true && (
                          <div className={style['isPublic']}>
                            <div className={style[('content', 'unprivate')]}>未公開</div>
                          </div>
                        )}
                        {item.isPrivate === false && (
                          <div className={style['isPublic']}>
                            <div className={style[('content', 'private')]}>公開</div>
                          </div>
                        )}
                      </div>

                      <div
                        className={style['bottom-area']}
                        ref={loadMoreRef}>
                        <div className={style['container']}>
                          <div className={`${item.access.accessDate === null && !item.access.isAccess && `${style['light']}`}`}>
                            {item.access.accessDate === null && !item.access.isAccess && '無權限'}
                            {item.access.accessDate === null && item.access.isAccess && item.isPrivate === true && '無限期'}
                            {item.access.accessDate !== null &&
                              item.access.isAccess &&
                              `影片授權時間至${item.date.split(/[-T:.]/)[0]}/${item.date.split(/[-T:.]/)[1]}/${item.date.split(/[-T:.]/)[2]}
                              ${item.date.split(/[-T:.]/)[3]}:${item.date.split(/[-T:.]/)[4]}:}`}
                            {item.isPrivate === false && <div className={style['box']}></div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
