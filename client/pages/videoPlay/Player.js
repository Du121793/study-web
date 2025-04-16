// 組件庫
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'
// public
import arrow from '../../public/videoPlay/arrow.png'
import logo from '../../public/videoPlay/logo2.png'
// method
import { useUserToken } from '../../method/useUserToken'
import userService from '../../method/userService'
import Footer from '../../components/global/Footer'
// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

export default function Player() {
  const token = useUserToken()
  // 路由初始化
  const router = useRouter()
  const { course_name, video_id, course_id, info } = router.query
  // 解析info的JSON將其轉為真正物件
  const [parsedInfo, setParsedInfo] = useState({})
  // 控制右側列表開關
  const [videoListIsOpen, setVideoListIsOpen] = useState(false)
  const [playerHeight, setPlayerHeight] = useState(700)
  const [videoListWidth, setVideoListWidth] = useState(0)
  const [videoListMarginRight, setVideoListMarginRight] = useState('#fff')
  // 播放器需要的影片url
  const [videoUrl, setVideoUrl] = useState()
  // 影片清單
  const [VideosList, setVideosList] = useState([])
  // 根據是否打開清單決定影片資訊部分是否為置中
  const [isAlignCenter, setIsAlignCenter] = useState('flex-start')
  // 使用者line縮圖
  const [userShot, setUserShot] = useState(null)
  //   開關右邊列表
  const listSwitch = (e) => {
    if (e === 'close-button') {
      setIsAlignCenter('center')
      setVideoListIsOpen(false)
      setVideoListWidth(0)
      setVideoListMarginRight('-500px')
      setPlayerHeight('70%')
    } else if (e === 'open-button') {
      setIsAlignCenter('flex-start')
      setVideoListIsOpen(true)
      setVideoListWidth(500)
      setVideoListMarginRight('0')
      setPlayerHeight('60%')
    }
  }

  function formatTime(seconds) {
    const hour = Math.floor(seconds / 3600)
    const min = Math.floor((seconds % 3600) / 60)
    const sec = seconds % 60

    if (hour > 0) {
      // 當有小時時，分鐘和秒都補0
      const hourStr = hour.toString()
      const minStr = min < 10 ? `0${min}` : min.toString()
      const secStr = sec < 10 ? `0${sec}` : sec.toString()
      return `${hourStr}:${minStr}:${secStr}`
    } else if (min > 0) {
      // 當只有分鐘（無小時），分鐘不用補0，秒補0
      const minStr = min.toString()
      const secStr = sec < 10 ? `0${sec}` : sec.toString()
      return `${minStr}:${secStr}`
    } else {
      // 當小時和分鐘皆為0，固定輸出0作為分鐘，秒補0
      const secStr = sec < 10 ? `0${sec}` : sec.toString()
      return `0:${secStr}`
    }
  }

  function timeAgo(isoDate) {
    const past = new Date(isoDate)
    const now = new Date()
    const diffMs = now - past

    const seconds = Math.floor(diffMs / 1000)
    if (seconds < 60) {
      return `${seconds}秒前`
    }

    const minutes = diffMs / (1000 * 60)
    if (minutes < 60) {
      return `${Math.floor(minutes)}分鐘前`
    }

    const hours = diffMs / (1000 * 60 * 60)
    if (hours < 24) {
      return `${Math.floor(hours)}小時前`
    }

    const days = diffMs / (1000 * 60 * 60 * 24)
    if (days < 7) {
      return `${Math.floor(days)}天前`
    } else if (days < 30) {
      return `${Math.floor(days / 7)}周前`
    } else if (days < 365) {
      return `${Math.floor(days / 30)}個月前`
    } else {
      return `${Math.floor(days / 365)}年前`
    }
  }

  // 解析query的JSON
  useEffect(() => {
    if (info) {
      setParsedInfo(JSON.parse(info))
    }
  }, [info])

  /*
  1. 請求獲得影片路徑
  2. 請求獲得影片資訊
  3. 請求獲得使用者資料
 */
  useEffect(() => {
    if (token && course_id && video_id) {
      userService.getVideoLink(token, course_id, video_id).then((res) => {
        setVideoUrl(res.data.embedLink)
      })
    }
    if (token && course_id) {
      userService
        .getVideoInfo(token, course_id, {
          type: 'MainClass',
          page: 1,
          sortBy: 'recordDate',
          sortOrder: 'asc',
        })
        .then((res) => {
          console.log(res)
          setVideosList(res.data)
        })
    }
  }, [token, course_id, video_id])

  useEffect(() => {
    const shot = localStorage.getItem('user_line_shot')
    if (shot) {
      setUserShot(shot)
    }
  }, [])

  const test = () => {
    console.log(formatTime(10))
  }

  return (
    <div className="video-player-main">
      <div className="header">
        <div
          className="back-to-course-btn"
          onClick={() => {
            window.location = `${clientIp}/courses/Course?courseName=${course_name}&courseId=${course_id}`
          }}>
          回到課程
        </div>
        <Image
          onClick={test}
          src={logo}
          alt="123"
          className="logos"
          width={100}
          height={100}></Image>
        {userShot && (
          <Image
            className="user-shot"
            src={userShot}
            alt="user's shot"
            width={100}
            height={100}
          />
        )}
      </div>
      <div className="player-area">
        {/* 左側影片播放器 */}
        <div className="player">
          <iframe
            style={{ height: `${playerHeight}` }}
            id="iframe"
            src={videoUrl}
            title="Video Player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />

          {/* 影片資訊 */}
          <div
            className="video-info"
            style={{ alignItems: isAlignCenter }}>
            {parsedInfo && <div className="title">{parsedInfo.title}</div>}
            {parsedInfo && (
              <div className="introduce">
                <div className="time">{new Date(parsedInfo.time).toLocaleString()}</div>
                <div className="description">{parsedInfo.description}</div>
              </div>
            )}
          </div>
        </div>

        {/* 切換右側列表的按鈕 */}
        {!videoListIsOpen && (
          <button
            id="open-button"
            className="open-button"
            onClick={(e) => {
              listSwitch(e.target.id)
            }}>
            <Image
              className="arrow"
              src={arrow}
              alt="switch video list's arrow button"></Image>
            打開列表
          </button>
        )}

        {/* 右側影片集數列表 */}
        <div
          className="video-info-list"
          style={{
            width: `${videoListWidth}px`,
            marginRight: `${videoListMarginRight}`,
          }}>
          {/* 開關按鈕 */}
          <div
            id="close-button"
            className="hidden-info-btn"
            onClick={(e) => {
              listSwitch(e.target.id)
            }}>
            隱藏列表
          </div>
          <ul
            className="videos-area"
            style={{ opacity: !videoListIsOpen ? 0 : 1 }}>
            {VideosList &&
              VideosList.map((item, index) => {
                if (item.access && item.access.isAccess === true) {
                  return (
                    <Link
                      className={`video ${item._id === video_id ? 'active' : ''}`}
                      key={index}
                      onClick={() => {
                        console.log(item)
                      }}
                      href={{
                        pathname: `${clientIp}/videoPlay/Player`,
                        query: {
                          course_name: course_name,
                          video_id: item._id,
                          course_id: course_id,
                          info: JSON.stringify({ description: item.description, title: item.title, time: item.recordDate }),
                        },
                      }}>
                      <div className="image-area">
                        {item?.thumbnail && (
                          <Image
                            className="pre-view-image"
                            src={item.thumbnail}
                            width={180}
                            height={0}
                            alt="video image"></Image>
                        )}
                        <div className="video-time">{formatTime(item.length)}</div>
                      </div>
                      <div className="info">
                        <div className="video-title">{item.title}</div>
                        <div className="video-time">{timeAgo(item.date)}</div>
                      </div>
                    </Link>
                  )
                }
              })}
          </ul>
        </div>
      </div>
      <Footer></Footer>
    </div>
  )
}
