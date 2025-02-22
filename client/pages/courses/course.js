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
// video組件
import VideoUploadComponent from './uploadVideo'

export default function Course() {
  // 假資料 (Q&A)
  const QAs = [
    { type: '天文', title: '112-1-1 天文問題', date: '2024年1月1號', time: '下午4點' },
    { type: '天文', title: '112-1-1 天文問題', date: '2024年1月1號', time: '下午4點' },
    { type: '天文', title: '112-1-1 天文問題', date: '2024年1月1號', time: '下午4點' },
    { type: '地質', title: '112-1-1 地質問題', date: '2024年1月1號', time: '下午4點' },
    { type: '地質', title: '112-1-1 地質問題', date: '2024年1月1號', time: '下午4點' },
    { type: '無知識點', title: '112-1-1 無知識點問題', date: '2024年1月1號', time: '下午4點' },
    { type: '大氣', title: '112-1-1 大氣問題', date: '2024年1月1號', time: '下午4點' },
    { type: '大氣', title: '112-1-1 大氣問題', date: '2024年1月1號', time: '下午4點' },
    { type: '天然災害', title: '112-1-1 天然災害問題', date: '2024年1月1號', time: '下午4點' },
    { type: '天然災害', title: '112-1-1 天然災害問題', date: '2024年1月1號', time: '下午4點' },
  ]
  // 獲取資料
  const token = useUserToken()
  const router = useRouter()
  const { courseName, courseId } = router.query

  // 給video子組件的參數
  const [uploadSuccess, setUploadSuccess] = useState(false) // 用於上傳完成更新影片區域
  const [uploadError, setUploadError] = useState(false) // 存取是否上傳發生錯誤

  // 參數
  const baseUrl = 'http://localhost:3000/'
  const backToMyCoursePageUrl = 'http://localhost:3000/profiles/profile'
  const [course_id, setCourse_id] = useState('')
  const [isLogined, setLogined] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const [chooseType, setChooseType] = useState('')
  const [videosShowPage, setVideosShowPage] = useState(1)
  const [videosPageSize, setVideosPageSize] = useState(8)
  const [chooseSortOrder, setChooseSortOrder] = useState('desc')
  const [isShowVideoUpload, setIsShowVideoUpload] = useState(false)
  const [videos, setVideos] = useState([])

  // 影片專區 - 使用 ref 與 state 控制展開/收合
  const [videoNavOpen, setVideoNavOpen] = useState(false)
  const videoContentRef = useRef(null)
  const [videoContentHeight, setVideoContentHeight] = useState(0)

  // Q&A 區塊 - 同樣使用 ref 與 state 控制展開/收合
  const [qaOpen, setQaOpen] = useState(false)
  const qaContentRef = useRef(null)
  const [qaContentHeight, setQaContentHeight] = useState(0)

  // 切換影片專區的展示收回狀態
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

  // 切換Q&A的展示收回狀態
  const toggleQA = () => {
    if (!qaOpen) {
      if (qaContentRef.current) {
        setQaContentHeight(qaContentRef.current.scrollHeight)
      }
      setQaOpen(true)
    } else {
      setQaContentHeight(0)
      setQaOpen(false)
    }
  }

  useEffect(() => {
    if (videoNavOpen && videoContentRef.current) {
      setVideoContentHeight(videoContentRef.current.scrollHeight)
    }
  }, [videos, videoNavOpen])

  useEffect(() => {
    if (qaOpen && qaContentRef.current) {
      setQaContentHeight(qaContentRef.current.scrollHeight)
    }
  }, [qaOpen])

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

  // 透過query拿到的courseName來更改course_id的狀態
  useEffect(() => {
    if (courseName) {
      setCourse_id(courseId)
    }
  }, [courseName, courseId])

  // 若是任何一個有改變，重新發一次影片請求
  useEffect(() => {
    getCourseVideos()
  }, [videosPageSize])

  // 若是任何一個有改變，重新發一次影片請求
  useEffect(() => {
    getCourseVideos()
  }, [token, courseId, chooseType, chooseSortOrder, uploadSuccess])

  // 透過query的courseId請求課程影片
  const getCourseVideos = () => {
    if (token && courseId) {
      try {
        userService
          .getVideoInfo(token, courseId, {
            type: 'MainClass',
            page: videosShowPage,
            pageSize: videosPageSize,
            sortBy: chooseType,
            sortOrder: chooseSortOrder,
          })
          .then((res) => {
            console.log(res)
            setVideos(res.data)
          })
      } catch (e) {
        console.log(e)
      }
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

  // 點擊加載更多影片
  const showMoreVideos = () => {
    setVideosPageSize(videosPageSize + 8)
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

  const types = [...new Set(QAs.map((item) => item.type))]

  // const test = () => {
  //   videos.map((item) => {
  //     console.log(item.length)
  //   })
  // }

  return (
    <div className="course-main">
      {/* <button onClick={test}>123456</button> */}
      <div
        className="background"
        onClick={closeVideoUploadOnclick}></div>
      <Header loginState={isLogined} />
      <div className="container">
        <VideoUploadComponent
          course_id={course_id}
          isShowVideoUpload={isShowVideoUpload}
          setIsShowVideoUpload={setIsShowVideoUpload}
          setUploadSuccess={setUploadSuccess}
          uploadSuccess={uploadSuccess}
          uploadError={uploadError}
          setUploadError={setUploadError}
        />
        <div className="header-title-area">
          <div className="course-title">{courseName}</div>
          <Link
            className="back-to-course-btn"
            href={backToMyCoursePageUrl}>
            <Image
              src={leftArrow}
              alt="back of course page button icon"
              width={24}
              height={24}
            />
            <div className="home-btn">回到我的課程</div>
          </Link>
        </div>
        {/* 影片專區 */}
        <div
          className="nav"
          id="video-nav">
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
              <span>排序根據</span>
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
                    href={`${baseUrl}videoPlay/player?course_name=${courseName}&video_id=${item._id}&course_id=${courseId}&info=${[item.description, item.title, item.date]}`}
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

        {/* Q&A 區塊 */}
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
          {/* 打開部分 */}
          <div
            className="QA-area"
            ref={qaContentRef}
            style={{
              height: qaOpen ? qaContentHeight + 'px' : '0px',
              overflow: 'hidden',
              transition: 'height 0.3s ease',
            }}>
            <div className="QA-header">
              <span>排序根據</span>
              <div className="select">
                <select>
                  <option value="">主題排序</option>
                  <option value="">內容排序</option>
                </select>
              </div>
              <div className="select">
                <select>
                  <option value="">倒序</option>
                  <option value="">正序</option>
                </select>
              </div>
            </div>
            <div className="QA-grid">
              {types.map((type) => {
                const filteredQAs = QAs.filter((qa) => qa.type === type)
                return (
                  <div
                    className="type-section"
                    key={type}>
                    <h2>{type}</h2>
                    <ul className="qa-list">
                      {filteredQAs.map((qa, index) => (
                        <li
                          key={index}
                          className="qa-item">
                          <div className="image"></div>
                          <div className="qa-title">{qa.title}</div>
                          <div className="qa-dateTime">
                            {qa.date}　{qa.time}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
