// 導入public
import shotA from '../../public/profile/shot1.jpg'
import shotB from '../../public/profile/shot2.jpg'
import shotC from '../../public/profile/shot3.jpg'
import anonymous from '../../public/profile/anonymous.png'
// 組件庫
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
// 導入methmod
import userService from '../../method/userService'
import { useUserToken } from '../../method/useUserToken'
// global
import LoadingAnime from '../../components/global/LoadingAnime'
// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

export default function MyCourse() {
  const [getCourses, setGetCourses] = useState([])
  const [courseLoading, setCourseLoading] = useState()
  const [searchInput, setSearchInput] = useState('')
  // 使用method獲取token
  const token = useUserToken()
  // 請求課程網址
  const curserBaseUrl = `${clientIp}/courses/Course`
  // 假圖片，用於課程左邊頭像
  const shots = [shotA, shotB, shotC, shotA, shotB, shotC, shotA, shotB, shotC, shotA]
  const coursesEle = useRef(null)
  const [coursesEleWidth, setCoursesEleWidth] = useState(0)
  const [innenrEleWidth, setInnerEleWidht] = useState(0)

  const randomShot = () => {
    let randomNumber = Math.random()
    randomNumber = randomNumber * 10
    return shots[parseInt(randomNumber)]
  }

  const formSubmit = (e) => {
    console.log(searchInput)
  }

  const test = () => {
    console.dir(coursesEle.current.clientWidth)
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

  useEffect(() => {
    console.log('Width has changed:', coursesEleWidth)
  }, [coursesEleWidth])

  // 請求所有用戶已註冊課程資訊，若為admin則為全部
  useEffect(() => {
    if (token) {
      setCourseLoading(true)
      userService
        .getUserRegistedCourses(token)
        .then((res) => {
          if (res.success) {
            setCourseLoading(false)
            setGetCourses(res.data)
          }
        })
        .catch((err) => console.error('Error:', err))
    }
  }, [token])

  return (
    <div className="myCourse-main">
      <div className="courses-container">
        <div
          className="course-page-header"
          onClick={test}>
          我的課程
        </div>
        <form
          className="search-area"
          onSubmit={(e) => {
            e.preventDefault()
            formSubmit()
          }}>
          <input
            type="text"
            className="input"
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
        <div className="flex-wrapper">
          <ul
            className="courses"
            ref={coursesEle}>
            {courseLoading && <LoadingAnime />}
            {getCourses.map((item, index) => (
              <li
                className="course"
                key={index}
                style={{ height: '80px' }}>
                <div href={curserBaseUrl + `?courseName=${item.courseName}&courseId=${item._id}`}>
                  <div className="course-header flex align-center">
                    <div className="course-fake-shot">
                      <Image
                        className="shot"
                        src={anonymous}
                        alt="cursor shot"
                        width={30}
                        height={30}></Image>
                    </div>
                    <div className="course-name">{item.courseName}</div>
                  </div>
                </div>

                <div className="course-info">
                  <div className="info-area">
                    <span>科目: </span>
                    {item.subject}
                  </div>
                  <div className="info-area">
                    <span>班級: </span>
                    {item.courseClass}
                  </div>
                  <div className="info-area">
                    <span>年級: </span>
                    {item.grade}
                  </div>
                  <div className="info-area">
                    <span>學生人數: </span>
                    {item.members}
                  </div>
                </div>
                <Link
                  className="g-blue-btn btn"
                  href={curserBaseUrl + `?courseName=${item.courseName}&courseId=${item._id}`}>
                  前往課程
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
