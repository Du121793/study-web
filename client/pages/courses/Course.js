// 組件庫
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// global組件
import Header from '../../components/global/Header'

// method
import { useUserToken } from '../../method/useUserToken'
import userService from '../../method/userService'

// public
import downArrow from '../../public/course/downArrow.png'
import leftArrow from '../../public/course/leftArrow.png'

// nav組件
import VideoNav from './VideoNav'
import QaNav from './QaNav'
import AskNav from './AskNav'

// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

export default function Course() {
  // 獲取資料
  const token = useUserToken()
  const router = useRouter()
  const { courseName, courseId } = router.query

  // 參數
  let course_id = ''
  const baseUrl = `${clientIp}/`
  const backToMyCoursePageUrl = `${clientIp}/profiles/Profile`
  const [isLogined, setLogined] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const [isShowVideoUpload, setIsShowVideoUpload] = useState(false)

  const test = () => {
    console.log(course_id)
    console.log(courseName)
  }

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
      course_id = courseId
    }
  }, [courseName])

  return (
    <div className="course-main">
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
        {courseId !== null && (
          <VideoNav
            course_id={courseId}
            courseName={courseName}></VideoNav>
        )}
        {/* Q&A 組件 */}
        {courseId !== null && (
          <QaNav
            course_id={courseId}
            courseName={courseName}></QaNav>
        )}
        {/* Ask 組件 */}
        <AskNav
          course_id={courseId}
          courseName={courseName}></AskNav>
      </div>
    </div>
  )
}
