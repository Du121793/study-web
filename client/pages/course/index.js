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
import video from '../../public/video/video.png'
import qa from '../../public/qa/qa.png'
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
  // 控制container zindex
  const [containerIndex, setContainerIndex] = useState('1')

  const [videoRefHeight, setVideoRefHeight] = useState('')
  const [qaRefHeight, setQaRefHeight] = useState('')
  const videoRef = useRef()
  const qaRef = useRef()

  const scrollToRef = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

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

  // 用於重記高度
  useEffect(() => {
    if (videoRefHeight) setVideoRefHeight(videoRef.current.offsetHeight)
    if (qaRefHeight) setQaRefHeight(qaRef.current.offsetHeight)
  }, [videoRefHeight, qaRefHeight])

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
      <div
        className={style['container']}
        style={{ zIndex: containerIndex }}>
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
        <div
          className={style['nav']}
          ref={videoRef}>
          <VideoNav
            setContainerIndex={setContainerIndex}
            user_role={userRole}
            course_id={courseId}
            courseName={courseName}
            setLoading={setLoading}></VideoNav>
        </div>
        {/* Q&A 組件 */}
        <div
          className={style['nav']}
          ref={qaRef}>
          <QaNav
            setContainerIndex={setContainerIndex}
            qaHasUpload={qaHasUpload}
            setQaHasUpload={setQaHasUpload}
            user_role={userRole}
            course_id={courseId}
            courseName={courseName}
            setLoading={setLoading}></QaNav>
        </div>
      </div>
      <div className={style['scroll-to-nav-container']}>
        <div className={style['btn']}>
          <Image
            src={video}
            className={style['image']}
            alt="scroll to video btn"
            width={0}
            height={0}
            onClick={() => {
              scrollToRef(videoRef)
            }}></Image>
        </div>
        <div className={style['btn']}>
          <Image
            src={qa}
            className={style['image']}
            alt="scroll to QA btn"
            width={0}
            height={0}
            onClick={() => {
              scrollToRef(qaRef)
            }}></Image>
        </div>
      </div>
      <Footer></Footer>
    </div>
  )
}
