import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import downArrowImg from '../../public/profile/downArrow.png'
import adminService from '../methods/service/adminService'
import { useUserToken } from '../methods/service/useUserToken'
import MenberSelector from './memberSelector'

export default function studentCourse() {
  // 子組件
  const [selectedStudentId, setSelectedStudentId] = useState([])
  // 父組件 (目前)
  const [message, setMessage] = useState('')
  const [grade, setGrade] = useState('')
  const [subject, setSubject] = useState('')
  const [courseClass, setCourseClass] = useState('')
  const [courseName, setCourseName] = useState('')
  const initGrade = (e) => {
    setGrade(e.target.value)
  }
  const initCourseClass = (e) => {
    setCourseClass(e.target.value)
  }
  const initSubject = (e) => {
    setSubject(e.target.value)
  }
  const initCourseName = (e) => {
    const value = e.target.value
    setCourseName(value)
  }
  useEffect(() => {
    setCourseName(grade + courseClass + subject)
  }, [grade, courseClass, subject])

  const token = useUserToken()
  const requireCreateCourse = async () => {
    // 參數
    const courseInfo = {
      grade,
      subject,
      courseClass,
      courseName,
    }
    const alert = document.querySelector('.alert')
    // 第一層try
    try {
      const a = async (token, courseInfo) => {
        // 第二層try
        try {
          const res = await adminService.createANewCourse(token, courseInfo)
          if (Array.isArray(selectedStudentId) && selectedStudentId.length > 0) {
            await adminService.registerMember(token, {
              user_ids: selectedStudentId,
              course_id: res.savedCourse._id,
            })
            setMessage('課程創建成功!')
          }
          if (res.success) {
            setMessage('課程創建成功!')
          } else {
            console.log(res.success)
          }
          // 開關警告
          alert.style.backgroundColor = '#a0db6c'
          alert.style.opacity = '1'
          alert.style.height = '60px'
          setTimeout(() => {
            alert.style.opacity = '0'
            alert.style.height = '0'
          }, 2000)
          // 第二層 catch
        } catch (error) {
          if (error.response.data === '你已經有一樣名稱，科目，年級，班級的課程了') {
            console.log(error.response.data)
            setMessage('你已經有一樣名稱，科目，年級，班級的課程了')
          } else if (error.response.data === '資料提供不完整') {
            console.log(error.response.data)
            setMessage('資料提供不完整')
          } else {
            setMessage('不知名錯誤')
            console.log(error)
          }
          // 開關警告
          alert.style.backgroundColor = 'red'
          alert.style.opacity = '1'
          alert.style.height = '60px'
          setTimeout(() => {
            alert.style.opacity = '0'
            alert.style.height = '0'
          }, 2000)
        }
      }
      a(token, courseInfo)
      // 第一層 catch
    } catch (error) {
      console.log(error)
    }
    // 清空輸入欄位
    setGrade('')
    setCourseClass('')
    setSubject('')
    setCourseName('')
  }
  return (
    <div className="register-course-container">
      <div className="alert">{message}</div>
      <div className="btns">
        <button
          className="clear-form-btn"
          onClick={() => {
            setGrade('')
            setCourseClass('')
            setSubject('')
            setCourseName('')
          }}>
          清除
        </button>
        <button
          className="submit-form-btn"
          onClick={requireCreateCourse}>
          新增
        </button>
      </div>
      <div className="form">
        <div className="form-inputs">
          <div className="form-input-area">
            <span>年級:</span>
            <input
              onChange={initGrade}
              className="form-input"
              id="grade"
              type="text"
              value={grade}
            />
            <Image
              className="down-arrow-img"
              alt="open grade options btn"
              src={downArrowImg}></Image>
          </div>

          <div className="form-input-area">
            <span>科目:</span>
            <input
              onChange={initCourseClass}
              className="form-input"
              id="subject"
              type="text"
              value={courseClass}
            />
            <Image
              className="down-arrow-img"
              alt="open subject options btn"
              src={downArrowImg}></Image>
          </div>

          <div className="form-input-area">
            <span>班級:</span>
            <input
              onChange={initSubject}
              className="form-input"
              id="courseClass"
              type="text"
              value={subject}
            />
            <Image
              className="down-arrow-img"
              alt="open courseClass options btn"
              src={downArrowImg}></Image>
          </div>

          <div className="form-input-area">
            <span>課程名稱:</span>
            <input
              onChange={initCourseName}
              className="form-input"
              id="courseName"
              type="text"
              value={courseName}
            />
          </div>
        </div>
        <div className="hints">
          <div className="hint">例如:學年度</div>
          <div className="hint">例如:化學、物理</div>
          <div className="hint">例如:甲班，A班</div>
          <div className="hint">此處會自動生成最終名稱，也可直接更改為自訂義名稱</div>
        </div>
      </div>
      <div className="child-component">
        <MenberSelector
          selectedStudentId={selectedStudentId}
          setSelectedStudentId={setSelectedStudentId}></MenberSelector>
      </div>
    </div>
  )
}
