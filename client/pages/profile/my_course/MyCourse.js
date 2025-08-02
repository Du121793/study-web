// 導入public
import anonymous from '../../../public/profile/anonymous.png'
import style from './style.module.css'
// 組件庫
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
// 導入methmod
import userService from '../../../method/userService'
import { useUserToken } from '../../../method/useUserToken'
// global
import LoadingAnime from '../../../components/loading_anime/LoadingAnime'
// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP
// components

import BackGround from '../components/back_ground/BackGround'
export default function MyCourse() {
  const [getCourses, setGetCourses] = useState([])
  const [courseLoading, setCourseLoading] = useState()
  const [searchInput, setSearchInput] = useState('')
  // 使用method獲取token
  const token = useUserToken()
  // 請求課程網址
  const curserBaseUrl = `${clientIp}/course`
  // 假圖片，用於課程左邊頭像
  const coursesEle = useRef(null)
  const [coursesEleWidth, setCoursesEleWidth] = useState(0)
  // 旋轉讀取
  const [loading, setLoading] = useState(false)

  const searchCourse = () => {
    setCourseLoading(true)
    let filter = {
      courseName: searchInput,
    }
    userService
      .getUserRegistedCourses(token, filter)
      .then((res) => {
        setCourseLoading(false)
        if (res?.success) {
          setGetCourses(res.data)
        }
      })
      .catch((err) => {
        console.error(err)
      })
  }

  const test = () => {
    console.dir(getCourses)
  }

  useEffect(() => {
    const element = coursesEle.current
    if (!element) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setCoursesEleWidth(entry.contentRect.width)
      }
    })
    resizeObserver.observe(element)

    // 清理 observer
    return () => {
      resizeObserver.unobserve(element)
    }
  }, [])

  // 請求所有用戶已註冊課程資訊
  useEffect(() => {
    setLoading(true)
    if (token) {
      setCourseLoading(true)
      userService
        .getUserRegistedCourses(token)
        .then((res) => {
          if (res.success) {
            setLoading(false)
            setCourseLoading(false)
            setGetCourses(res.data)
          }
        })
        .catch((err) => console.error('Error:', err))
    }
  }, [token])

  return (
    <div className={`${style.myCourse_main}`}>
      <BackGround></BackGround>
      <div
        className="right-bottom-loading-area"
        style={{ right: loading ? '8px' : '-100%' }}>
        <div className="loading"></div>
      </div>
      <div className={`${style.courses_container}`}>
        <div
          className={`${style.course_page_header}`}
          onClick={test}>
          我的課程
        </div>
        <form
          className={`${style.search_area}`}
          onSubmit={(e) => {
            e.preventDefault()
            searchCourse()
          }}>
          <input
            type="text"
            className={style.input}
            placeholder="輸入欲查詢課程的課名"
            onChange={(e) => {
              setSearchInput(e.target.value)
            }}></input>
          <button
            type="submit"
            className="g-blue-btn">
            搜尋
          </button>
        </form>
        <div className={`${style.flex_wrapper}`}>
          <ul
            className={style.courses}
            ref={coursesEle}>
            {courseLoading && <LoadingAnime />}
            {getCourses.length === 0 && (
              <div className={style.course}>
                <div
                  className="loading-area"
                  style={{ width: '100%', height: '100%' }}></div>
              </div>
            )}
            {getCourses &&
              getCourses.length > 0 &&
              getCourses.map((item, index) => (
                <li
                  className={style.course}
                  key={index}>
                  <div href={curserBaseUrl + `?courseName=${item.courseName}&courseId=${item._id}`}>
                    <div className={`${style.course_header} flex align-center`}>
                      <div className={`${style.course_fake_shot}`}>
                        <Image
                          className={style.shot}
                          src={item?.teacher?.userinfo?.displayPictureUrl ? item.teacher.userinfo.displayPictureUrl : anonymous}
                          alt="course's teacher avatar"
                          width={100}
                          height={100}></Image>
                      </div>
                      <div className={`${style.course_name}`}>{item.courseName}</div>
                    </div>
                  </div>

                  <div className={`${style.course_info}`}>
                    <div className={`${style.info_area}`}>
                      <span>教師: </span>
                      {item?.teacher?.userinfo?.username}
                    </div>
                    <div className={`${style.info_area}`}>
                      <span>科目: </span>
                      {item.subject}
                    </div>
                    <div className={`${style.info_area}`}>
                      <span>班級: </span>
                      {item.courseClass}
                    </div>
                    <div className={`${style.info_area}`}>
                      <span>年級: </span>
                      {item.grade}
                    </div>
                    <div className={`${style.info_area} ${style.last_line}`}>
                      <div className={style.container}>
                        <span>學生人數: </span>
                        {item.members}
                      </div>
                      <Link
                        className="g-blue-btn"
                        href={{
                          pathname: curserBaseUrl,
                          query: {
                            courseName: item.courseName,
                            courseId: item._id,
                          },
                        }}>
                        前往課程
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
