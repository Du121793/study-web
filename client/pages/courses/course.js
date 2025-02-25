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

// nav組件
import VideoNav from './videoNav'
import QaNav from './qaNav'
import AskNav from './askNav'

// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

export default function Course() {
  const test = () => {
    console.log('路徑為', clientIp)
  }
  // 獲取資料
  const token = useUserToken()
  const router = useRouter()
  const { courseName, courseId } = router.query

  // rerander
  const [rerander, setRerander] = useState(true)

  // 參數
  const baseUrl = `${clientIp}/`
  const backToMyCoursePageUrl = `${clientIp}/profiles/profile`
  const [course_id, setCourse_id] = useState('')
  const [isLogined, setLogined] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const [isShowVideoUpload, setIsShowVideoUpload] = useState(false)

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

  return (
    <div className="course-main">
      <button onClick={test}>測試按鈕</button>
      <Link href={`${baseUrl}courses/qaPage?course_id=${course_id}`}>提問URL</Link>
      <Header loginState={isLogined} />
      <div className="container">
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

        {/* 影片組件 */}
        {course_id && (
          <VideoNav
            course_id={course_id}
            courseName={courseName}></VideoNav>
        )}
        {/* Q&A 組件 */}
        <QaNav
          courseId={course_id}
          courseName={courseName}></QaNav>
        {/* Ask 組件 */}
        <AskNav
          courseId={course_id}
          courseName={courseName}></AskNav>
      </div>
    </div>
  )
}
