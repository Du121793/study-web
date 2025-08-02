// 組件庫
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// global組件
import Header from '../../components/header/Header'
import Footer from '../../components/footer/Footer'

// method
import { useUserToken } from '../../method/useUserToken'
import userService from '../../method/userService'

// public
import leftArrow from '../../public/course/leftArrow.png'

// nav組件
import VideoNav from './VideoNav'
import QaNav from './QaNav'

// style
import style from './style.module.css'

// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

export default function CoursePage() {
  // 獲取資料
  const token = useUserToken()
  const router = useRouter()
  const { courseName, courseId } = router.query
  const course_id = useRef(null)

  // 旋轉讀取，子組件控制
  const [loading, setLoading] = useState(false)

  // 請求參數
  const backToMyCoursePageUrl = `${clientIp}/profile`
  const [isLogined, setLogined] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  // 檢查是否有新增qa，用於更新子組件的qa
  const [qaHasUpload, setQaHasUpload] = useState(true)
  const [userRole, setUserRole] = useState(null)

  // 設定sessionStorage
  useEffect(() => {
    if (!localStorage.getItem('user_role') || !localStorage.getItem('user_id')) {
      userService.getUserInfo(token).then((res) => {
        localStorage.setItem('user_lineID', res.data.lineID)
        localStorage.setItem('user_id', res.data._id)
        localStorage.setItem('user_line_shot', res.data.userinfo.pictureUrl)
        localStorage.setItem('user_role', res.data.role)
      })
    }
    const role = localStorage.getItem('user_role')
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
      <div
        className="right-bottom-loading-area"
        style={{ right: loading ? '8px' : '-100%' }}>
        <div className="loading"></div>
      </div>
      <div className="course-header">
        <Header
          loginState={isLogined}
          inIndex="course"
        />
      </div>
      <div className="container">
        <div className="header-title-area">
          <div className="left">
            <div className="course-title">{courseName}</div>
            <div className="hint">{courseId}</div>
          </div>
          <div className="right">
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
        </div>

        {/* 影片組件 */}
        {courseId !== null && userRole && (
          <VideoNav
            user_role={userRole}
            course_id={courseId}
            courseName={courseName}
            setLoading={setLoading}></VideoNav>
        )}
        {/* Q&A 組件 */}
        {courseId !== null && userRole && (
          <QaNav
            qaHasUpload={qaHasUpload}
            setQaHasUpload={setQaHasUpload}
            user_role={userRole}
            course_id={courseId}
            courseName={courseName}
            setLoading={setLoading}></QaNav>
        )}
      </div>
      <Footer></Footer>
    </div>
  )
}
