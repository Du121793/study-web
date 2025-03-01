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
  const test = () => {
    console.log(course_id)
    console.log(video_id)
  }
  const baseUrl = `${clientIp}/`
  const token = useUserToken()
  // 路由初始化
  const router = useRouter()
  const { course_name, video_id, course_id, info } = router.query
  // 控制右側列表開關
  const [videoListIsOpen, setVideoListIsOpen] = useState(true)
  const [playerHeight, setPlayerHeight] = useState(600)
  const [videoListWidth, setVideoListWidth] = useState(300)
  const [videoListMarginRight, setVideoListMarginRight] = useState('#fff')
  // 播放器需要的影片url
  const [videoUrl, setVideoUrl] = useState()
  // 影片清單
  const [VideosList, setVideosList] = useState([])
  // 用戶資料
  const [userInfo, setUserInfo] = useState([])
  // 根據是否打開清單決定影片資訊部分是否為置中
  const [isAlignCenter, setIsAlignCenter] = useState('flex-start')
  //   開關右邊列表
  const listSwitch = (e) => {
    if (e === 'close-button') {
      console.log(isAlignCenter)
      setIsAlignCenter('center')
      setVideoListIsOpen(false)
      setVideoListWidth(0)
      setVideoListMarginRight('-300px')
      setPlayerHeight(700)
    } else if (e === 'open-button') {
      console.log(isAlignCenter)
      setIsAlignCenter('flex-start')
      setVideoListIsOpen(true)
      setVideoListWidth(300)
      setVideoListMarginRight('0')
      setPlayerHeight(600)
    }
  }

  // 打開小列表功能
  const openEpisodeBtn = (e) => {
    let episodes = e.target.parentNode.querySelector('.episodes')
    if (episodes.style.maxHeight != '9999px') {
      episodes.style.maxHeight = '9999px'
    } else {
      episodes.style.maxHeight = '0'
    }
  }

  /*
  請求獲得影片路徑
  請求獲得影片資訊
  請求獲得使用者資料
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
  }, [token, course_id, video_id])

  return (
    <div className="video-player-main">
      <div className="header">
        <Link
          className="back-to-course-btn"
          href={`${baseUrl}courses/course?courseName=${course_name}&courseId=${course_id}`}>
          回到課程
        </Link>
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
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />

          {/* 影片資訊 */}
          <div
            className="video-info"
            style={{ alignItems: isAlignCenter }}>
            {info && <div className="title">{info.split(',')[1]}</div>}
            {info && (
              <div className="introduce">
                <div className="time">
                  <div>{info && info.split(',')[2].split(/[-T:.]/)[0]}年</div>
                  <div>{info && info.split(',')[2].split(/[-T:.]/)[1]}月</div>
                  <div>{info && info.split(',')[2].split(/[-T:.]/)[2]}日</div>
                  {info && info.split(',')[2].split(/[-T:.]/)[3] >= 0 && info.split(',')[2].split(/[-T:.]/)[3] <= 11 && <div>上午{info.split(',')[2].split(/[-T:.]/)[3]}點</div>}
                  {info && info.split(',')[2].split(/[-T:.]/)[3] >= 13 && info.split(',')[2].split(/[-T:.]/)[3] <= 23 && <div>下午{info.split(',')[2].split(/[-T:.]/)[3] - 12}點</div>}
                  {info && <div>{info.split(',')[2].split(/[-T:.]/)[4]}分</div>}
                </div>
                {info.split(',')[0]}
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
          <div className="title">
            影片列表
            <div
              id="close-button"
              className="hidden-info-btn"
              onClick={(e) => {
                listSwitch(e.target.id)
              }}>
              x
            </div>
          </div>
          <ul className="selections">
            {VideosList &&
              VideosList.map(
                /* 第二代 */
                (item, index) =>
                  // 判斷是否為目前影片
                  item._id === video_id ? (
                    // 有active
                    <li
                      key={index}
                      className="option-lv1">
                      <div
                        className="active option-header"
                        onClick={(e) => {
                          openEpisodeBtn(e)
                        }}>
                        <div className="video-list-title">{item.title}</div>
                        <Image
                          src={downArrow}
                          className="open-list-arrow"
                          alt="open video's list of arrow button"
                          width={32}
                          height={32}></Image>
                      </div>
                      <ul className="episodes">
                        <li className="option-lv2 episodes-list">
                          <Link
                            className="Link"
                            href={`${baseUrl}videoPlay/player?course_name=${course_name}&video_id=${item._id}&course_id=${course_id}&info=${[item.description, item.title, item.date]}`}>
                            第1集
                          </Link>
                        </li>
                      </ul>
                    </li>
                  ) : (
                    // 非active
                    <li
                      key={index}
                      className="option-lv1">
                      <div
                        className="option-header"
                        onClick={(e) => {
                          openEpisodeBtn(e)
                        }}>
                        <div className="video-list-title">{item.title}</div>
                        <Image
                          src={downArrow}
                          className="open-list-arrow"
                          alt="open video's list of arrow button"
                          width={32}
                          height={32}></Image>
                      </div>
                      <ul className="episodes">
                        <li className="option-lv2 episodes-list">
                          <Link
                            className="Link"
                            href={`${baseUrl}videoPlay/player?course_name=${course_name}&video_id=${item._id}&course_id=${course_id}&info=${[item.description, item.title, item.date]}`}>
                            第1集
                          </Link>
                        </li>
                      </ul>
                    </li>
                  )
              )}
          </ul>
        </div>
      </div>
    </div>
  )
}
