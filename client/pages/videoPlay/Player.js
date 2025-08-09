// 組件庫
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'
// public
import arrow from '../../public/videoPlay/arrow.png'
import logo from '../../public/videoPlay/logo2.png'
import noThumbnailImg from '../../public/global/no-image-available-icon.jpg'
// method
import { useUserToken } from '../../method/useUserToken'
import userService from '../../method/userService'
import Footer from '../../components/footer/Footer'
// css
import style from './player.module.css'

export default function Player() {
  // 監控視窗寬度
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0 // SSR 安全
  )
  // env
  const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP
  // url
  const profilePage = `${clientIp}/profile`
  // auth for api
  const token = useUserToken()
  // 路由初始化
  const router = useRouter()
  const { course_name, video_id, course_id, info } = router.query
  // 解析info的JSON將其轉為真正物件
  const [parsedInfo, setParsedInfo] = useState({})
  // 控制右側列表開關
  const [videoListIsOpen, setVideoListIsOpen] = useState(false)
  const [playerHeight, setPlayerHeight] = useState('70%')
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

  /* 根據寬度顯示畫面中間的影片清單 */
  const [showVideoListAfterInfo, setShowVideoListAfterInfo] = useState(false)

  // 旋轉讀取
  const [loading, setLoading] = useState(false)

  /* 監聽全局寬度變化，寬度變化設定windowsWidth */
  const isClient = typeof window === 'object'
  const [windowsWidth, setWindowsWidth] = useState(0)

  const playerRef = useRef()
  const hideListRef = useRef()
  // 開關影片詳細資訊
  const videoInfoRef = useRef()
  const [isHideInfo, setIsHideInfo] = useState(false)

  /* 開關右方影片列表，僅在電腦寬度下出現 */
  const listSwitch = (e) => {
    if (e === 'close-button') {
      setIsAlignCenter('center')
      setVideoListIsOpen(false)
      setVideoListWidth(0)
      setVideoListMarginRight('-500px')
      setPlayerHeight('80%')
    } else if (e === 'open-button') {
      setIsAlignCenter('flex-start')
      setVideoListIsOpen(true)
      setVideoListWidth(500)
      setVideoListMarginRight('0')
      setPlayerHeight('70%')
    }
  }

  function formatTime(seconds) {
    // 先取整，抹去任何小数部分
    const total = Math.floor(seconds)

    const hour = Math.floor(total / 3600)
    const min = Math.floor((total % 3600) / 60)
    const sec = total % 60

    if (hour > 0) {
      const hourStr = hour.toString()
      const minStr = min < 10 ? `0${min}` : min.toString()
      const secStr = sec < 10 ? `0${sec}` : sec.toString()
      return `${hourStr}:${minStr}:${secStr}`
    } else if (min > 0) {
      const minStr = min.toString()
      const secStr = sec < 10 ? `0${sec}` : sec.toString()
      return `${minStr}:${secStr}`
    } else {
      // 小时和分钟皆为 0
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
  // 監控全局寬度
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

  /* 根據寬度顯示畫面中間的影片清單 */
  useEffect(() => {
    if (windowsWidth <= 860) {
      setShowVideoListAfterInfo(true)
    }
    if (windowsWidth > 860) {
      setShowVideoListAfterInfo(false)
    }
  }, [windowsWidth])

  /*
    1. 請求獲得影片路徑
    2. 請求獲得影片資訊
    3. 請求獲得使用者資料
  */
  useEffect(() => {
    if (token && course_id && video_id) {
      setLoading(true)
      userService.getVideoLink(token, course_id, video_id).then((res) => {
        setLoading(false)
        setVideoUrl(res.data.embedLink)
      })
    }
    if (token && course_id) {
      setLoading(true)
      userService
        .getVideoInfo(token, course_id, {
          type: 'MainClass',
          page: 1,
          sortBy: 'recordDate',
          sortOrder: 'asc',
        })
        .then((res) => {
          setLoading(false)
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
  // 解析query的JSON
  useEffect(() => {
    if (info) {
      setParsedInfo(JSON.parse(info))
    }
  }, [info])

  return (
    <div className={style['video-player-main']}>
      <div
        className={style['right-bottom-loading-area']}
        style={{ right: loading ? '8px' : '-100%' }}>
        <div className="loading"></div>
      </div>
      <div className={style['header']}>
        {/* 返回按鈕 */}
        <div
          id={style['back-btn']}
          onClick={() => {
            window.location = `${clientIp}/course?courseName=${course_name}&courseId=${course_id}`
          }}>
          回到課程
        </div>
        {/* logo */}
        <Link
          href={{
            pathname: clientIp,
          }}
          className={style['logo-container']}>
          <Image
            onClick={() => {
              setLoading(!loading)
            }}
            title={'王佑物理首頁'}
            src={logo}
            alt="logo"
            className={style['logo']}
            width={100}
            height={100}></Image>
        </Link>
        {userShot && (
          <Link
            href={{
              pathname: profilePage,
              query: {
                fc: 'public',
                to: 'profile',
              },
            }}>
            <Image
              title={'個人資訊頁面'}
              className={style['user-shot']}
              src={userShot}
              alt="user's shot"
              width={100}
              height={100}
            />
          </Link>
        )}
      </div>
      {/* 影片播放器、影片清單 */}
      <div
        className={style['player-area']}
        ref={playerRef}>
        {/* 播放器 */}
        <div className={style['player']}>
          <iframe
            id={style['iframe']}
            src={videoUrl}
            title="Video Player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />

          {/* 影片資訊 */}
          <div className={style['video-info']}>
            {parsedInfo && (
              <div
                className={style['introduce']}
                ref={videoInfoRef}
                style={{ padding: windowsWidth <= 860 && isHideInfo ? '12px' : '24px', minHeight: windowsWidth <= 860 && isHideInfo ? '34px' : '200px', height: windowsWidth <= 860 && isHideInfo ? '34px' : 'auto' }}>
                {!isHideInfo && windowsWidth && windowsWidth <= 860 && (
                  <div
                    onClick={() => {
                      setIsHideInfo(true)
                    }}
                    className={style['hide-info-btn']}>
                    <span>收回影片詳細資訊</span>
                  </div>
                )}
                {isHideInfo && windowsWidth && windowsWidth <= 860 && (
                  <div
                    onClick={() => {
                      setIsHideInfo(false)
                    }}
                    className={style['show-info-btn']}>
                    <span>打開影片詳細資訊</span>
                  </div>
                )}
                <div className={style['title']}>{parsedInfo.title}</div>
                <div className={style['time']}>{new Date(parsedInfo.time).toLocaleString()}</div>
                <div className={style['description']}>{parsedInfo.description}</div>
              </div>
            )}
          </div>
        </div>

        {/* 切換清單按鈕 */}
        {!videoListIsOpen && (
          <button
            id="open-button"
            className={style['open-button']}
            onClick={(e) => {
              listSwitch(e.target.id)
            }}>
            <Image
              className={style['arrow']}
              src={arrow}
              alt="switch video list's arrow button"></Image>
            打開列表
          </button>
        )}

        {/* 清單本體 */}
        <div
          className={style['video-info-list']}
          style={{
            width: `${videoListWidth}px`,
          }}>
          {/* 切換按鈕 */}
          <div
            id={'close-button'}
            ref={hideListRef}
            className={style['hidden-info-btn']}
            onClick={(e) => {
              listSwitch(e.target.id)
            }}>
            隱藏列表
          </div>

          {/* 影片列表 */}
          <ul
            className={style['videos-area']}
            style={{ opacity: !videoListIsOpen ? 0 : 1 }}>
            {/* 顯示目前播放的 */}
            {VideosList &&
              VideosList.map((item, index) => {
                if (item.access && item.access.isAccess === true && item._id === video_id) {
                  return (
                    <Link
                      className={`${style['video']} ${style['active']}`}
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
                      <div className={style['image-area']}>
                        {item.thumbnail !== '' && (
                          <Image
                            className={style['pre-view-image']}
                            src={item.thumbnail !== '' && item.thumbnail !== undefined ? item.thumbnail : noThumbnailImg}
                            width={0}
                            height={0}
                            objectFit="contain"
                            alt="video image"></Image>
                        )}

                        <div className={style['video-time']}>{formatTime(item.length)}</div>
                      </div>
                      <div className={style['info']}>
                        <div className={style['video-title']}>{item.title}</div>
                        <div className={style['video-time']}>{timeAgo(item.date)}</div>
                      </div>
                    </Link>
                  )
                }
              })}
            {VideosList &&
              VideosList.map((item, index) => {
                if (item.access && item.access.isAccess === true && item._id !== video_id) {
                  return (
                    <Link
                      className={style['video']}
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
                      <div className={style['image-area']}>
                        {item.thumbnail !== '' && (
                          <Image
                            className={style['pre-view-image']}
                            src={item.thumbnail !== '' && item.thumbnail !== undefined ? item.thumbnail : noThumbnailImg}
                            width={0}
                            height={0}
                            objectFit="contain"
                            alt="video image"></Image>
                        )}

                        <div className={style['video-time']}>{formatTime(item.length)}</div>
                      </div>
                      <div className={style['info']}>
                        <div className={style['video-title']}>{item.title}</div>
                        <div className={style['video-time']}>{timeAgo(item.date)}</div>
                      </div>
                    </Link>
                  )
                }
              })}
          </ul>
        </div>
      </div>
      {showVideoListAfterInfo && (
        <div className={style['video-list-after-info-area']}>
          {/* 最上面顯示目前播放的影片 */}
          {VideosList.map((item, idx) => {
            if (item.access.isAccess && item._id === video_id) {
              return (
                <div
                  className={style['container']}
                  key={idx}>
                  <span className={style['hint']}>目前播放中</span>
                  <Link
                    href={{
                      pathname: `${clientIp}/videoPlay/Player`,
                      query: {
                        course_name: course_name,
                        video_id: item._id,
                        course_id: course_id,
                        info: JSON.stringify({ description: item.description, title: item.title, time: item.recordDate }),
                      },
                    }}
                    className={`${style['info']} ${style['active']}`}>
                    <div className={style['left']}>
                      <Image
                        src={item.thumbnail !== '' ? item.thumbnail : noThumbnailImg}
                        width={0}
                        height={0}
                        alt="video image"
                        className={style['image']}></Image>
                      <div className={style['video-length']}>{formatTime(item.length)}</div>
                    </div>
                    <div className={style['right']}>
                      <div className={style['title']}>{item.description}</div>
                      <div className={style['time']}>{timeAgo(item.date)}</div>
                    </div>
                  </Link>
                </div>
              )
            }
          })}
          {VideosList.map((item, idx) => {
            if (item.access.isAccess && item._id !== video_id) {
              return (
                <Link
                  href={{
                    pathname: `${clientIp}/videoPlay/Player`,
                    query: {
                      course_name: course_name,
                      video_id: item._id,
                      course_id: course_id,
                      info: JSON.stringify({ description: item.description, title: item.title, time: item.recordDate }),
                    },
                  }}
                  key={idx}
                  className={style['info']}>
                  <div className={style['left']}>
                    <Image
                      src={item.thumbnail !== '' ? item.thumbnail : noThumbnailImg}
                      width={0}
                      height={0}
                      alt="video image"
                      className={style['image']}></Image>
                    <div className={style['video-length']}>{formatTime(item.length)}</div>
                  </div>
                  <div className={style['right']}>
                    <div className={style['title']}>{item.description}</div>
                    <div className={style['time']}>{timeAgo(item.date)}</div>
                  </div>
                </Link>
              )
            }
          })}
        </div>
      )}
      <Footer></Footer>
    </div>
  )
}
