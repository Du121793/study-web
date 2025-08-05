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
import VideoNav from './component/video_nav/VideoNav'
import QaNav from './component/qa_nav/QaNav'

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
  // useEffect(() => {
  //   if (!localStorage.getItem('user_role') || !localStorage.getItem('user_id')) {
  //     userService.getUserInfo(token).then((res) => {
  //       localStorage.setItem('user_lineID', res.data.lineID)
  //       localStorage.setItem('user_id', res.data._id)
  //       localStorage.setItem('user_line_shot', res.data.userinfo.pictureUrl)
  //       localStorage.setItem('user_role', res.data.role)
  //     })
  //   }
  //   const role = localStorage.getItem('user_role')
  //   if (role) {
  //     setUserRole(role)
  //   }
  // }, [])

  // // 請求使用者資料
  useEffect(() => {
    if (token) {
      userService
        .getUserInfo(token)
        .then((res) => {
          setUserInfo(res.data)
          setLogined(true)
          setUserRole(res.data.role)
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
    <div className={style['course-main']}>
      <div
        className="right-bottom-loading-area"
        style={{ right: loading ? '8px' : '-100%' }}>
        <div className="loading"></div>
      </div>
      <div className={style['course-header']}>
        <Header
          loginState={isLogined}
          inIndex="course"
        />
      </div>
      <div className={style['container']}>
        <div className={style['header-title-area']}>
          <div className={style['left']}>
            <div className={style['course-title']}>{courseName}</div>
            <div className={style['hint']}>{courseId}</div>
          </div>
          <div className={style['right']}>
            <Link
              className={style['back-to-course-btn']}
              href={{ pathname: backToMyCoursePageUrl, query: { fc: 'public', to: 'myCourse' } }}>
              <Image
                src={leftArrow}
                alt="back of course page button icon"
                width={24}
                height={24}
              />
              <div className={style['home-btn']}>回到我的課程</div>
            </Link>
          </div>
        </div>

        {/* 影片組件 */}
        <VideoNav
          user_role={userRole}
          course_id={courseId}
          courseName={courseName}
          setLoading={setLoading}></VideoNav>
        {/* Q&A 組件 */}
        <QaNav
          qaHasUpload={qaHasUpload}
          setQaHasUpload={setQaHasUpload}
          user_role={userRole}
          course_id={courseId}
          courseName={courseName}
          setLoading={setLoading}></QaNav>
      </div>
      <Footer></Footer>
    </div>
  )
}
