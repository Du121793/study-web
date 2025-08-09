// 原生組件
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
// public
import anonymous from '../../../public/profile/anonymous.png'
import style from './style.module.css'
// 導入methmod
import userService from '../../../method/userService'
import { useUserToken } from '../../../method/useUserToken'
// components
import LoadingAnime from '../../../components/loading_anime/LoadingAnime'
import MessageAnime from '../../../components/message_anime/MessageAnime'
// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP
// components

import BackGround from '../components/back_ground/BackGround'
export default function MyCourse() {
  const [courseInfo, setCourseInfo] = useState([])
  const [searchInput, setSearchInput] = useState('')
  // 使用method獲取token
  const token = useUserToken()
  // 請求課程網址
  const curserBaseUrl = `${clientIp}/course`
  // UX
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const initUX = () => {
    const timer = setTimeout(() => {
      setMessage('')
    }, 2000)
    setLoading(false)
    return () => {
      clearTimeout(timer)
    }
  }

  const searchCourse = () => {
    setLoading(true)
    let filter = {
      courseName: searchInput,
    }
    userService
      .getUserRegistedCourses(token, filter)
      .then((res) => {
        if (res?.success) {
          setCourseInfo(res.data)
        } else {
          setMessage('發生錯誤')
        }
      })
      .catch((err) => {
        setMessage('發生錯誤')
        console.error(err)
      })
      .finally(() => {
        initUX()
      })
  }

  const test = () => {
    console.log(courseInfo)
  }

  // 請求所有用戶已註冊課程資訊
  useEffect(() => {
    setLoading(true)
    if (token) {
      userService
        .getUserRegistedCourses(token)
        .then((res) => {
          if (res.success) {
            setCourseInfo(res.data)
          } else {
            setMessage('發生錯誤')
          }
        })
        .catch((err) => {
          setMessage('發生錯誤')
          console.error('Error:', err)
        })
        .finally(() => {
          initUX()
        })
    }
  }, [token])

  return (
    <div className={`${style.myCourse_main}`}>
      <BackGround></BackGround>
      <div className={`${style.courses_container}`}>
        {loading && <LoadingAnime top={'100px'} />}
        {message && (
          <MessageAnime
            message={message}
            top="100px"
            duration={2000}
          />
        )}
        <div className={style['header']}>
          <div className={`${style.course_page_header}`}>我的課程</div>
        </div>
        <div className={style['course-info-area']}>
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
            <ul className={style.courses}>
              {courseInfo.length === 0 && (
                <div className={style.course}>
                  <div
                    className="loading-area"
                    style={{ width: '100%', height: '100%' }}></div>
                </div>
              )}
              {courseInfo &&
                courseInfo.length > 0 &&
                courseInfo.map((item, index) => (
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
                          <span>成員人數: </span>
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
    </div>
  )
}
