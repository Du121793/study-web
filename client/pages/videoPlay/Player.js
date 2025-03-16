// 組件庫
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'
// public
import arrow from '../../public/videoPlay/arrow.png'
import downArrow from '../../public/videoPlay/downArrow.png'
import logo from '../../public/videoPlay/logo2.png'
// method
import { useUserToken } from '../../method/useUserToken'
import userService from '../../method/userService'

// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

export default function Player() {
  const baseUrl = `${clientIp}/`
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
  // 用戶資料
  const [userInfo, setUserInfo] = useState([])
  const [userToken, setUserToeken] = useState('')
  // 根據是否打開清單決定影片資訊部分是否為置中
  const [isAlignCenter, setIsAlignCenter] = useState('flex-start')

  //   開關右邊列表
  const listSwitch = (e) => {
    if (e === 'close-button') {
      setIsAlignCenter('center')
      setVideoListIsOpen(false)
      setVideoListWidth(0)
      setVideoListMarginRight('-300px')
      setPlayerHeight(700)
    } else if (e === 'open-button') {
      setIsAlignCenter('flex-start')
      setVideoListIsOpen(true)
      setVideoListWidth(300)
      setVideoListMarginRight('0')
      setPlayerHeight(600)
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
        console.log(res)
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
          setVideosList(res.data)
        })
    }
    if (token) {
      userService.getUserInfo(token).then((res) => {
        setUserInfo(res.data)
      })
    }
    if (typeof window !== 'undefined') {
      setUserToeken(window.localStorage.getItem('token').split(' ')[1])
    }
  }, [token, course_id, video_id])

  const test = () => {
    
    console.log(VideosList)
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
        <Image
          className="user-shot"
          src={userInfo.userinfo && userInfo.userinfo.pictureUrl}
          alt="user's shot"
          width={100}
          height={100}
        />
      </div>
      <div className="player-area">
        {/* 左側影片播放器 */}
        <div className="player">
          <iframe
            style={{ height: `${playerHeight}px` }}
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
            className="title"
            style={{ opacity: !videoListIsOpen ? 0 : 1 }}>
            影片列表
            <div
              id="close-button"
              className="hidden-info-btn"
              onClick={(e) => {
                listSwitch(e.target.id)
              }}>
              X
            </div>
          </div>
          <ul
            className="videos-area"
            style={{ opacity: !videoListIsOpen ? 0 : 1 }}>
            {VideosList &&
              VideosList.map((item, index) => {
                if (item._id === video_id && item.access.isAccess === true) {
                  return (
                    <Link
                      className="video active"
                      key={index}
                      href={{
                        pathname: `${clientIp}/videoPlay/Player`,
                        query: {
                          course_name: course_name,
                          video_id: item._id,
                          course_id: course_id,
                          info: JSON.stringify({ description: item.description, title: item.title, time: item.recordDate }),
                        },
                      }}>
                      {item.title}
                    </Link>
                  )
                } else {
                  return (
                    <Link
                      className="video"
                      key={index}
                      href={{
                        pathname: `${clientIp}/videoPlay/Player`,
                        query: {
                          course_name: course_name,
                          video_id: item._id,
                          course_id: course_id,
                          info: JSON.stringify({ description: item.description, title: item.title, time: item.recordDate }),
                        },
                      }}>
                      {item.title}
                    </Link>
                  )
                }
              })}
          </ul>
        </div>
      </div>
    </div>
  )
}
