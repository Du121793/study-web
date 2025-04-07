// 組件庫
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// global組件
import Header from '../../components/global/Header'
import Footer from '../../components/global/Footer'

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
  const course_id = useRef(null)

  // 請求參數
  const baseUrl = `${clientIp}/`
  const backToMyCoursePageUrl = `${clientIp}/profiles/Profile`
  const [isLogined, setLogined] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const [isShowVideoUpload, setIsShowVideoUpload] = useState(false)
  // 檢查是否有新增qa，用於更新子組件的qa
  const [qaHasUpload, setQaHasUpload] = useState(true)
  const [userRole, setUserRole] = useState(null)

  // 設定sessionStorage
  useEffect(() => {
    if (!sessionStorage.getItem('user_role') || !sessionStorage.getItem('user_id')) {
      userService.getUserInfo(token).then((res) => {
        sessionStorage.setItem('user_lineID', res.data.lineID)
        sessionStorage.setItem('user_id', res.data._id)
        sessionStorage.setItem('user_line_shot', res.data.userinfo.pictureUrl)
        sessionStorage.setItem('user_role', res.data.role)
      })
    }
    const role = sessionStorage.getItem('user_role')
    if (role) {
      setUserRole(role)
    }
  }, [])

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
      course_id.current = courseId
    }
  }, [courseName, courseId])

  return (
    <div className="course-main">
      <Header loginState={isLogined} />
      <div className="container">
        <div className="header-title-area">
          <div className="course-title">
            {courseName}
            <div className="hint">{courseId}</div>
          </div>
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
        {courseId !== null && userRole && (
          <VideoNav
            user_role={userRole}
            course_id={courseId}
            courseName={courseName}></VideoNav>
        )}
        {/* Q&A 組件 */}
        {courseId !== null && userRole && (
          <QaNav
            qaHasUpload={qaHasUpload}
            setQaHasUpload={setQaHasUpload}
            user_role={userRole}
            course_id={courseId}
            courseName={courseName}></QaNav>
        )}
        {/* Ask 組件 */}
        {userRole && (
          <AskNav
            qaHasUpload={qaHasUpload}
            setQaHasUpload={setQaHasUpload}
            user_role={userRole}
            course_id={courseId}
            courseName={courseName}></AskNav>
        )}
      </div>
      <Footer></Footer>
    </div>
  )
}
