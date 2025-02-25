import React from 'react'
// 組件庫
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// public
import downArrow from '../../public/course/downArrow.png'
import leftArrow from '../../public/course/leftArrow.png'

// method
import { useUserToken } from '../methods/service/useUserToken'
import userService from '../methods/service/userService'

// 子組件
import VideoUploadComponent from './uploadVideo'

// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

const VideoNav = ({ course_id, courseName }) => {
  const test = () => {
    console.log(baseUrl)
  }

  const token = useUserToken()
  // 使用者資料狀態
  const [userInfo, setUserInfo] = useState(null)
  const [isLogined, setLogined] = useState(false)
  // 影片
  const [videos, setVideos] = useState([])
  // 影片專區 - 使用 ref 與 state 控制展開/收合
  const [videoNavOpen, setVideoNavOpen] = useState(false)
  const videoContentRef = useRef(null)
  const [videoContentHeight, setVideoContentHeight] = useState(0)

  // 請求影片資訊的參數
  const baseUrl = `${clientIp}/`
  const backToMyCoursePageUrl = `${clientIp}/profiles/profile`
  const [chooseType, setChooseType] = useState('')
  const [videosShowPage, setVideosShowPage] = useState(1)
  const [videosPageSize, setVideosPageSize] = useState(8)
  const [chooseSortOrder, setChooseSortOrder] = useState('desc')
  const [isShowVideoUpload, setIsShowVideoUpload] = useState(false)

  // 給video子組件的參數
  const [uploadSuccess, setUploadSuccess] = useState(false) // 用於上傳完成更新影片區域
  const [uploadError, setUploadError] = useState(false) // 存取是否上傳發生錯誤

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

  useEffect(() => {
    if (videoNavOpen && videoContentRef.current) {
      setVideoContentHeight(videoContentRef.current.scrollHeight)
    }
  }, [videos, videoNavOpen])

  // 若是任何一個有改變，重新發一次影片請求
  useEffect(() => {
    getCourseVideos()
  }, [token, course_id, chooseType, chooseSortOrder, uploadSuccess, videosPageSize])
  // 獲得影片資訊
  const getCourseVideos = () => {
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
  }

  // 切換排序的type
  const switchSortBy = (e) => {
    setChooseType(e)
  }

  // 切換排序的正倒序
  const switchSortOrder = (e) => {
    setChooseSortOrder(e)
  }

  // 關閉上傳影片的介面
  const closeVideoUploadOnclick = () => {
    if (isShowVideoUpload) {
      let videoUpload = document.querySelector('.upload-vidoe-main')
      let background = document.querySelector('.background')
      videoUpload.style.height = '0'
      background.style.display = 'none'
      setIsShowVideoUpload(false)
    }
  }

  // 開啟上傳影片的介面
  const showVideoUploadComponent = () => {
    if (!isShowVideoUpload) {
      let videoUpload = document.querySelector('.upload-vidoe-main')
      let background = document.querySelector('.background')
      videoUpload.style.height = '720px'
      background.style.display = 'block'
      setIsShowVideoUpload(true)
    } else {
      let videoUpload = document.querySelector('.upload-vidoe-main')
      videoUpload.style.height = '0'
      setIsShowVideoUpload(false)
    }
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

  return (
    <div
      className="nav"
      id="video-nav">
      {/* 上傳影片的子組件 */}
      <VideoUploadComponent
        course_id={course_id}
        isShowVideoUpload={isShowVideoUpload}
        setIsShowVideoUpload={setIsShowVideoUpload}
        setUploadSuccess={setUploadSuccess}
        uploadSuccess={uploadSuccess}
        uploadError={uploadError}
        setUploadError={setUploadError}
      />
      <div
        className="background"
        onClick={closeVideoUploadOnclick}></div>
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
      <div
        className="video-nav-content"
        ref={videoContentRef}
        style={{
          height: videoNavOpen ? videoContentHeight + 'px' : '0px',
          overflow: 'hidden',
          transition: 'height 0.3s ease',
        }}>
        <div className="update-video-area">
          {userInfo && userInfo.role === 'teacher' && (
            <div
              className="button"
              onClick={showVideoUploadComponent}>
              上傳影片
            </div>
          )}
          <span onClick={test}>排序根據</span>
          <div className="select">
            <select onChange={(e) => switchSortBy(e.target.value)}>
              <option value="">上傳時間</option>
              <option value="length">影片長度</option>
              <option value="recordDate">錄影時間</option>
            </select>
          </div>
          <div className="select">
            <select onChange={(e) => switchSortOrder(e.target.value)}>
              <option value="desc">倒序</option>
              <option value="asc">正序</option>
            </select>
          </div>
        </div>
        <div className="video-area">
          {videos &&
            videos.map((item) => (
              <Link
                key={item._id}
                href={`${baseUrl}videoPlay/player?course_name=${courseName}&video_id=${item._id}&course_id=${course_id}&info=${[item.description, item.title, item.date]}`}
                className="video">
                <img
                  src={item.thumbnail}
                  className="videos-shot"
                  alt={item.title}
                />
                <div className="video-length">{formatSecondsToHMS(item.length)}</div>
                <div className="info">
                  <div className="title">{item.title}</div>
                  <div className="time">
                    <div className="day">
                      <div>{item.date.split(/[-T:.]/)[0]}/</div>
                      <div>{item.date.split(/[-T:.]/)[1]}/</div>
                      <div>{item.date.split(/[-T:.]/)[2]}</div>
                    </div>
                    <div className="clock">
                      {item.date.split(/[-T:.]/)[3] >= 0 && item.date.split(/[-T:.]/)[3] && <div>{Number(item.date.split(/[-T:.]/)[3]) + 8}點</div>}
                      <div>{item.date.split(/[-T:.]/)[4]}分</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
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

export default VideoNav
