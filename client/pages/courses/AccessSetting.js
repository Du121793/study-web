import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'

// method
import { useUserToken } from '../../method/useUserToken'
import userService from '../../method/userService'
import adminService from '../../method/adminService'

// 子組件
import StudentSelector from './StudentSelector'
import VideoSelector from './VideoSelector'

// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

export default function AccessSetting() {
  const token = useUserToken()
  const router = useRouter()
  const { course_name, course_id } = router.query
  const [userInfo, setUserInfo] = useState({})
  // 控制新增權杖狀態
  const [isClickAdd, setIsClickAdd] = useState(false)
  // 控制學生選擇器狀態
  const [showStudentSelector, setShowStudentSelector] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState([])
  // 控制影片選擇器狀態
  const [showVideoSelector, setShowVideoSelector] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState([])
  // 是否選擇無期限
  const [isInfiniite, setIsInfiniite] = useState(false)
  // 時間狀態
  const [overDate, setOverDate] = useState(null)
  // 名稱狀態
  const [accessName, setAccessName] = useState('')

  // 使用者資料
  useEffect(() => {
    if (token) {
      userService.getUserInfo(token).then((res) => {
        setUserInfo(res.data)
      })
    }
  }, [token])

  const test = () => {
    console.log(userInfo)
  }

  const submitNewAccess = () => {
    if (selectedVideo && selectedStudent && (overDate || isInfiniite)) {
      let data = {
        accessName,
        videoIDs: selectedVideo,
        studentIDs: selectedStudent,
        accessDate: overDate ? overDate : null,
        unlimited: isInfiniite ? isInfiniite : null,
      }
      adminService.addNewVideoAccess(token, course_id, data).then((res) => {
        console.log(res)
      })
    } else {
      console.log('少了東西')
    }
  }
  return (
    <div className="access-setting-main">
      <div className="components">
        {showStudentSelector && (
          <StudentSelector
            course_id={course_id}
            showStudentSelector={showStudentSelector}
            setShowStudentSelector={setShowStudentSelector}
            selectedStudent={selectedStudent}
            setSelectedStudent={setSelectedStudent}></StudentSelector>
        )}
        {showVideoSelector && (
          <VideoSelector
            course_id={course_id}
            showVideoSelector={showVideoSelector}
            setShowVideoSelector={setShowVideoSelector}
            selectedVideo={selectedVideo}
            setSelectedVideo={setSelectedVideo}></VideoSelector>
        )}
      </div>
      <div className="main-container">
        <div className="header">
          <Link
            href={{ pathname: `${clientIp}/courses/Course`, query: { courseName: course_name, courseId: course_id } }}
            className="back-btn">
            返回課程
          </Link>
          <div
            className="title"
            onClick={test}>
            變更影片權限功能
          </div>
          <div
            className="btn"
            onClick={() => {
              setIsClickAdd(!isClickAdd)
            }}>
            新增權杖
          </div>
        </div>
        {/* 新增UI */}
        {isClickAdd && (
          <div className="add-area">
            <div className="name-area">
              <div
                className="content"
                onChange={(e) => {
                  setAccessName(e.target.value)
                }}>
                名稱:
              </div>
              <input
                type="text"
                placeholder="請輸入名稱"
              />
            </div>
            <div className="studen-area">
              <div className="content">學生:</div>
              <div className="content">{selectedStudent.length}，</div>
              <div
                className="button"
                onClick={() => {
                  setShowStudentSelector(true)
                }}>
                選擇學生
              </div>
              ，
            </div>
            <div className="video-area">
              <div className="content">影片:</div>
              <div className="content">{selectedVideo.length}，</div>
              <div
                className="button"
                onClick={() => {
                  setShowVideoSelector(true)
                }}>
                選擇影片
              </div>
              ，
            </div>
            <div className="dateSetting-area">
              <div className="content">結束日期:</div>
              無期限
              <input
                type="checkbox"
                onChange={(e) => {
                  setIsInfiniite(e.target.checked)
                  setOverDate(null)
                }}
              />
              {!isInfiniite && (
                <input
                  type="datetime-local"
                  onChange={(e) => {
                    setOverDate(e.target.value)
                  }}
                  className="video-record-date"
                />
              )}
            </div>
            <div
              className="submit-btn"
              onClick={submitNewAccess}>
              送出
            </div>
          </div>
        )}
        {/* 顯示權杖UI */}
      </div>
    </div>
  )
}
