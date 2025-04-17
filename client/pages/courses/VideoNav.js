import React from 'react'
// 組件庫
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// public
import downArrow from '../../public/course/downArrow.png'
import no_image_available_icon from '../../public/global/no-image-available-icon.jpg'

// method
import { useUserToken } from '../../method/useUserToken'
import userService from '../../method/userService'

// 子組件
import VideoUploadComponent from './UploadVideo'
import adminService from '../../method/adminService'
import EditVideoInfo from './component/EditVideoInfo'
import UploadOldVimeoVDO from '../components/UploadOldVimeoVDO'
// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP
const serverIp = process.env.NEXT_PUBLIC_SERVER_IP

export default function VideoNav({ course_id, courseName, user_role }) {
  const token = useUserToken()
  // nav 高度- 使用 ref 與 state 控制展開/收合
  const [videoNavOpen, setVideoNavOpen] = useState(false)
  const videoContentRef = useRef(null)
  const [videoContentHeight, setVideoContentHeight] = useState(0)
  const [lock, setLock] = useState(false)
  // 控制上傳影片UI
  const [showUploadVideoUI, setshowUploadVideoUI] = useState(false)
  const [uploadVideoUIHeight, setUploadVideoUIHeight] = useState(0)
  const [uploadVideoUIWidth, setUploadVideoUIWidth] = useState(0)
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
  const [chooseType, setChooseType] = useState('')
  const [videosShowPage, setVideosShowPage] = useState(1)
  const [videosPageSize, setVideosPageSize] = useState(8)
  const [chooseSortOrder, setChooseSortOrder] = useState('desc')
  const [isShowVideoUpload, setIsShowVideoUpload] = useState(false)

  // 給video子組件的參數
  const [uploadSuccess, setUploadSuccess] = useState(false) // 用於上傳完成更新影片區域
  const [uploadError, setUploadError] = useState(false) // 存取是否上傳發生錯誤

  // 開關編輯影片介面
  const [editShowVideoInfo, setShowEditVideoInfo] = useState(false)
  const [choseEditVideo, setChoseEditVideo] = useState({})
  // 編輯影片參數
  const [video_id, setVideo_id] = useState('false')

  // 控制移除影片的小圖案高度
  const [videoDeleteBtnHeight, setVideoDeleteBtnHeight] = useState('0px')

  const [hasChange, setHasChange] = useState(false)

  const [message, setMessage] = useState('無訊息')
  const [messageStatus, setMessageStatus] = useState(false)
  const [messageColor, setMessageColor] = useState('')

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
      userService
        .getVideoInfo(token, course_id, {
          type: 'MainClass',
          page: videosShowPage,
          pageSize: videosPageSize,
          sortBy: chooseType,
          sortOrder: chooseSortOrder,
        })
        .then((res) => {
          // 這行經常在剛npm run dev時出錯，有可能是api還沒啟動
          setVideos(res.data)
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

  // 點擊加載更多影片
  const showMoreVideos = () => {
    setVideosPageSize(videosPageSize + 8)
    setVideoContentHeight(0)
    getCourseVideos(true)
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
    console.log(videoDeleteBtnHeight)
  }

  // 二次確認是否刪除該影片
  const doubleCheckDelete = (e, item) => {
    const deleteBtn = document.querySelectorAll('.delete-video-btn')
    const from = Array.from(deleteBtn)
    if (e.innerText === '在點擊一次確認刪除') {
      setDeleteLoading(true)
      adminService.deleteVideo(token, item._id, course_id).then((res) => {
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

  // 當第一次渲染打開nav
  useEffect(() => {
    if (!lock) {
      if (videoContentRef.current) {
        setVideoContentHeight(videoContentRef.current.scrollHeight)
      }
      setVideoNavOpen(true)
      setLock(true)
    }
  }, [lock])

  // 若是任何一個有改變，重新發一次影片請求
  // 問題:會跑兩次
  useEffect(() => {
    if (token && course_id) {
      userService
        .getVideoInfo(token, course_id, {
          type: 'MainClass',
          page: videosShowPage,
          pageSize: videosPageSize,
          // 類型
          sortBy: chooseType,
          // 順序
          sortOrder: chooseSortOrder,
        })
        .then((res) => {
          if (res?.success) {
            setVideos(res.data)
            messageControl('加載成功', true)
          } else {
            messageControl('發生錯誤', false)
          }
        })
    }
  }, [token, course_id, chooseType, chooseSortOrder, uploadSuccess, videosShowPage, videosPageSize, hasChange])

  useEffect(() => {
    if (videoNavOpen && videoContentRef.current) {
      setVideoContentHeight(videoContentRef.current.scrollHeight)
    }
  }, [videos, videoNavOpen])

  return (
    <div
      className="nav"
      id="video-nav">
      {/* 上傳影片的子組件 */}
      <VideoUploadComponent
        setshowUploadVideoUI={setshowUploadVideoUI}
        showUploadVideoUI={showUploadVideoUI}
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
      {/* 編輯影片的子組件 */}
      {editShowVideoInfo && (
        <EditVideoInfo
          getCourseVideos={getCourseVideos}
          messageControl={messageControl}
          setShowEditVideoInfo={setShowEditVideoInfo}
          course_id={course_id}
          token={token}
          video_id={video_id}
          video_info={choseEditVideo}></EditVideoInfo>
      )}
      {/* 上傳舊vimeoVDO的組件 */}
      {showUploadOldVimeoVDOUI && (
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

      {/* nav 黑底頂部*/}
      <div
        onClick={toggleVideoNav}
        id="video-header"
        className="header">
        <Image
          src={downArrow}
          alt="open video nav's icon"
          width={40}
          height={40}
        />
        <span>影片專區</span>
      </div>
      {/* nav 內部 */}
      <div
        className="video-nav-content"
        ref={videoContentRef}
        style={{
          height: videoNavOpen ? videoContentHeight + 'px' : '0px',
          overflow: 'hidden',
          transition: 'height 0.3s ease',
        }}>
        {/* 頂部 */}
        <div className="update-video-area">
          {/* 上傳影片 */}
          {user_role && (user_role === 'teacher' || user_role === 'admin') && (
            <div
              className="g-blue-btn"
              onClick={() => {
                setshowUploadVideoUI(true)
                setTimeout(() => {
                  setUploadVideoUIHeight('80%')
                  setUploadVideoUIWidth('80%')
                  setUploadVideoUIInnerOpacity(1)
                }, 10)
              }}>
              上傳影片
            </div>
          )}
          {/* 移除影片button */}
          {user_role && (user_role === 'teacher' || user_role === 'admin') && (
            <div
              className="g-red-btn"
              onClick={showDeleteBtn}>
              移除影片
            </div>
          )}
          {/* 搬遷舊有Vimeo影片 button */}
          {user_role && user_role === 'admin' && (
            <div
              className="g-blue-btn"
              onClick={() => {
                setShowUploadOldVimeoVDOUI(true)
                setTimeout(() => {
                  setUploadOldVimeoVDOHeight('auto')
                  setUploadOldVimeoVDOWidht('80%')
                  setUploadOldVimeoVDOInnerEleOpacity(1)
                }, 10)
              }}>
              搬遷舊有Vimeo影片
            </div>
          )}
          {/* 編輯權限 button */}
          {user_role && (user_role === 'teacher' || user_role === 'admin') && (
            <Link
              href={{ pathname: `${clientIp}/courses/AccessSetting`, query: { course_name: courseName, course_id: course_id } }}
              className="g-black-btn">
              編輯權限
            </Link>
          )}
          {/* 排序根據 */}
          <span onClick={test}>排序根據</span>
          <div className="select">
            <select onChange={(e) => switchSortBy(e.target.value)}>
              <option value="">上傳時間</option>
              <option value="length">影片長度</option>
              <option value="recordDate">錄影時間</option>
            </select>
          </div>
          {/* 排序根據 */}
          <div className="select">
            <select onChange={(e) => switchSortOrder(e.target.value)}>
              <option value="desc">倒序</option>
              <option value="asc">正序</option>
            </select>
          </div>
        </div>

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
        <div className="video-area-container">
          {deleteLoading && (
            <div className="loading-main">
              <div className="loader"></div>
            </div>
          )}
          <div className="video-area">
            {videos &&
              videos.map((item) => (
                <Link
                  key={item._id}
                  style={{ cursor: item.access.isAccess ? 'pointer' : 'not-Allowed' }}
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
                  }}
                  className="video-card">
                  <div className="top-container">
                    {/* 刪除按鈕 */}
                    <div
                      className="delete-video-btn"
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
                        className="videos-shot"
                        loading="lazy"
                        alt={item.title}
                        width={142}
                        height={142}
                      />
                    ) : (
                      <Image
                        src={no_image_available_icon}
                        className="videos-shot"
                        loading="lazy"
                        alt={'no videos shot icon'}
                        width={100}
                        height={100}
                      />
                    )}
                    {/* 影片長度 */}
                    <div className="video-length">{formatSecondsToHMS(item.length)}</div>
                  </div>

                  <div className="bottom-container">
                    {/* 影片詳情 */}
                    <div className="info">
                      <div className="time">
                        <div className="day">
                          <div>{item.date.split(/[-T:.]/)[0]}/</div>
                          <div>{item.date.split(/[-T:.]/)[1]}/</div>
                          <div>{item.date.split(/[-T:.]/)[2]}</div>
                        </div>
                        <div className="clock">
                          <div>{item.date.split(/[-T:.]/)[3]}:</div>
                          <div>{item.date.split(/[-T:.]/)[4]}</div>
                        </div>
                        {item.isPrivate === true && (
                          <div className="isPublic">
                            <div className="content unprivate">未公開</div>
                          </div>
                        )}
                        {item.isPrivate === false && (
                          <div className="isPublic">
                            <div className="content private">公開</div>
                          </div>
                        )}
                      </div>

                      <div className="title">{item.title}</div>
                      <div className="bottom-area">
                        <div className="container">
                          {user_role === 'admin' && (
                            <div
                              className="edit-btn"
                              onClick={(e) => {
                                e.preventDefault()
                                setShowEditVideoInfo(true)
                                setVideo_id(item._id)
                                setChoseEditVideo(item)
                              }}>
                              編輯
                            </div>
                          )}
                          <div className={`access-time ${item.access.accessDate === null && !item.access.isAccess && 'light'}`}>
                            {item.access.accessDate === null && !item.access.isAccess && '無權限'}
                            {item.access.accessDate === null && item.access.isAccess && item.isPrivate === true && '無限期'}
                            {item.access.accessDate !== null &&
                              item.access.isAccess &&
                              `影片授權時間至${item.date.split(/[-T:.]/)[0]}/${item.date.split(/[-T:.]/)[1]}/${item.date.split(/[-T:.]/)[2]}
                              ${item.date.split(/[-T:.]/)[3]}:${item.date.split(/[-T:.]/)[4]}:}`}
                            {item.isPrivate === false && <div className="box">1</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>

        <div className="bottom-area">
          <div
            className="show-more-video-btn"
            onClick={showMoreVideos}>
            點擊加載更多影片
          </div>
        </div>
      </div>
    </div>
  )
}
