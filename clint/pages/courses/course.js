// 組件庫
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
// global組件
import Header from '../../components/global/Header'
// method組件
import { useUserToken } from '../methods/service/useUserToken'
import userService from '../methods/service/userService'
export default function userProfile() {
  // url
  const backToMyCoursePageUrl = 'http://localhost:3000/profiles/profile'
  // 假資料
  const question = [
    { id: 1, message: '請問第一集的....', date: '四小時前', studentName: '黃永都', studentId: '11011121' },
    { id: 2, message: '請問第一集的....', date: '四小時前', studentName: '黃永都', studentId: '11011121' },
  ]
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
  const videos = [
    { title: '影片標題', date: '2024年1月1號', time: '下午4點' },
    { title: '影片標題', date: '2024年1月1號', time: '下午4點' },
    { title: '影片標題', date: '2024年1月1號', time: '下午4點' },
    { title: '影片標題', date: '2024年1月1號', time: '下午4點' },
    { title: '影片標題', date: '2024年1月1號', time: '下午4點' },
    { title: '影片標題', date: '2024年1月1號', time: '下午4點' },
    { title: '影片標題', date: '2024年1月1號', time: '下午4點' },
    { title: '影片標題', date: '2024年1月1號', time: '下午4點' },
    { title: '影片標題', date: '2024年1月1號', time: '下午4點' },
    { title: '影片標題', date: '2024年1月1號', time: '下午4點' },
    { title: '影片標題', date: '2024年1月1號', time: '下午4點' },
    { title: '影片標題', date: '2024年1月1號', time: '下午4點' },
    { title: '影片標題', date: '2024年1月1號', time: '下午4點' },
  ]
  const types = [...new Set(QAs.map((item) => item.type))]
  const answer = [{ id: 1, message: '那集的問題......' }]

  const [isLogined, setLogined] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const token = useUserToken()
  const router = useRouter()
  // locks
  let videoNavOpen = false
  let QaNavOpen = false
  // 取出路由，後續新增useEffect獲取資料
  const { courseName } = router.query

  const showVideos = (e) => {
    const background = e.target.parentNode
    if (!videoNavOpen) {
      // 先移除 height 限制讓內容自然展開，再取得高度
      background.style.height = 'auto'
      const targetHeight = background.clientHeight + 'px'
      // 設置為初始高度以便開始 transition
      background.style.height = '80px'
      // 強制重繪（reflow），然後設置目標高度
      void background.offsetHeight
      background.style.height = targetHeight
      videoNavOpen = true
    } else {
      background.style.height = '80px'
      videoNavOpen = false
    }
  }
  const showQA = (e) => {
    const background = e.target.parentNode
    if (!QaNavOpen) {
      // 先移除 height 限制讓內容自然展開，再取得高度
      background.style.height = 'auto'
      const targetHeight = background.clientHeight + 'px'
      // 設置為初始高度以便開始 transition
      background.style.height = '80px'
      // 強制重繪（reflow），然後設置目標高度
      void background.offsetHeight
      background.style.height = targetHeight
      QaNavOpen = true
    } else {
      background.style.height = '80px'
      QaNavOpen = false
    }
  }
  useEffect(() => {
    if (token) {
      userService
        .getUserInfo(token)
        .then((data) => {
          setUserInfo(data)
          setLogined(true)
        })
        .catch((err) => console.error('Error:', err))
    }
  }, [token])
  return (
    <div className="course-main">
      <Header loginState={isLogined}></Header>
      <div className="container">
        <div className="header-title-area">
          <div className="course-title">課程名稱:{courseName}</div>
          <Link href={backToMyCoursePageUrl}>
            <div className="home-btn">回到我的課程</div>
          </Link>
        </div>
        {/* 影片專區 */}
        <ul className="nav">
          <div
            className="header"
            onClick={(e) => {
              showVideos(e)
            }}>
            <div>影片專區</div>
          </div>
          <div className="video-area">
            {videos.map((item) => (
              <div className="video">
                <div className="info">
                  <div className='title'>{item.title}</div>
                  <div className="time">
                    <div>{item.date}</div>
                    <div>{item.time}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ul>
        {/* Q&A */}
        <ul>
          <div className="nav">
            <div
              className="header"
              onClick={(e) => {
                showQA(e)
              }}>
              <div>Q & A</div>
            </div>
            <div className="QA-area">
              {/* 2. 迭代每個類型 */}
              {types.map((type) => {
                // 過濾出此 type 對應的所有 QA
                const filteredQAs = QAs.filter((qa) => qa.type === type)

                return (
                  <div
                    className="type-section"
                    key={type}>
                    {/* 類別標題 */}
                    <h2>{type}</h2>

                    {/* 3. 逐筆渲染 QA 項目 */}
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
        </ul>
      </div>
    </div>
  )
}
