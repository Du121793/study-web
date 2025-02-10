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
  // 假資料
  const question = [
    { id: 1, message: '請問第一集的....', date: '四小時前', studentName: '黃永都', studentId: '11011121' },
    { id: 2, message: '請問第一集的....', date: '四小時前', studentName: '黃永都', studentId: '11011121' },
  ]
  const answer = [{ id: 1, message: '那集的問題......' }]
  const videos = ['第一集', '第二集', '第三集', '第四集', '第五集', '第六集']

  const [isLogined, setLogined] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const token = useUserToken()
  const router = useRouter()
  // locks
  let videoNavOpen = false
  // 取出路由，後續新增useEffect獲取資料
  const { courseName } = router.query

  const QuestionHasAnswer = (questId) => {
    const findAnswer = answer.find((e) => e.id === questId)
    if (findAnswer) {
      return true
    } else {
      return false
    }
  }
  const teacherAnswer = (questId) => {
    const findAnswer = answer.find((e) => e.id === questId)
    if (findAnswer) {
      return findAnswer.message
    }
  }
  const showVideos = () => {
    const background = document.querySelector('.videos-area')

    if (!videoNavOpen) {
      console.log(videoNavOpen)
      background.style.height = '800px'
      videoNavOpen = true
    } else if (videoNavOpen) {
      console.log(videoNavOpen)
      background.style.height = '0'
      videoNavOpen = false
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
        <div className="course-title">課程名稱:{courseName}</div>
        <ul className="videos-nav">
          <div
            className="header"
            onClick={showVideos}>
            影片專區
          </div>
          <div className="videos-area"></div>
          {/* {videos.map((item, index) => (
            <li
              key={index}
              className="video">
              <div className="video-shot"></div>
              <div className="video-info">
                <div className="watch-count">觀看次數:4230次</div>
                <div className="date">4個月前</div>
              </div>
            </li>
          ))} */}
        </ul>
        <div className="message-board-area">
          <div className="board-area">
            <div className="board-area-title">提問區</div>
            <ul>
              {question.map((item, index) => (
                <li className="question">
                  <div className="student-info">
                    <div className="question-title">學生提問</div>
                    <div className="student-name">{item.studentName}</div>
                    <div className="student-id">學號:{item.studentId}</div>
                    <div className="question-data">{item.date}</div>
                  </div>
                  <div className="message-area">
                    <div className="message">{item.message}</div>
                  </div>

                  <div className="teacher-answer-area">
                    <div className="question-title">教師回答</div>
                    {QuestionHasAnswer(item.id) ? <div className="message-area">{teacherAnswer(item.id)}</div> : <div className="message-area">還沒有回答</div>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
