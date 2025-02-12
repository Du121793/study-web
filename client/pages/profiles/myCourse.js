// 導入public
import Image from 'next/image'
import Link from 'next/link'
import shotA from '../../public/profile/shot1.jpg'
import shotB from '../../public/profile/shot2.jpg'
import shotC from '../../public/profile/shot3.jpg'
// 組件庫
import { useState, useEffect } from 'react'
import { useUserToken } from '../methods/service/useUserToken'
// 導入methmod
import userService from '../methods//service/userService'

export default function myCourse() {
  const [getCourses, setGetCourses] = useState([])
  // 使用method獲取token
  const token = useUserToken()
  // 請求課程網址
  const curserBaseUrl = 'http://localhost:3000/courses/course'
  // 假圖片，用於課程左邊頭像
  const shots = [shotA, shotB, shotC, shotA, shotB, shotC, shotA, shotB, shotC, shotA]
  const randomShot = () => {
    let randomNumber = Math.random()
    randomNumber = randomNumber * 10
    return shots[parseInt(randomNumber)]
  }
  // 渲染執行請求用戶資料，存到getCourse
  useEffect(() => {
    if (token) {
      userService
        .getUserRegistedCourses(token)
        .then((data) => {
          setGetCourses(data)
        })
        .catch((err) => console.error('Error:', err))
    }
  }, [token])

  return (
    <div className="myCourse-main">
      <div className="courses-container flex-col align-center">
        <ul className="courses flex-col align-center">
          {getCourses.map((item) => (
            <li
              className="course"
              key={item.id}
              style={{ height: '80px' }}>
              <Link
                className="link"
                href={curserBaseUrl + `?courseName=${item.courseName}&courseId=${item._id}`}>
                <div className="course-header flex align-center">
                  <div className="course-fake-shot">
                    <Image
                      className="shot"
                      src={randomShot()}
                      alt="cursor shot"
                      width={100}
                      height={100}></Image>
                  </div>
                  <div className="course-name">{item.courseName}</div>
                  <div className="class-number">成員人數:xxx</div>
                </div>
              </Link>

              <div className="course-info">
                <div className="introduce">
                  <span>課程介紹: </span>
                  {item.introduce}
                </div>
                <div className="max-member">
                  <span>學生人數: </span>
                  {item.Member}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
