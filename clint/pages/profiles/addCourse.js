import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import downArrowImg from '../../public/profile/downArrow.png'
import RegisterCourse from './registerCourse'
import adminService from '../methods/service/adminService'
import { useUserToken } from '../methods/service/useUserToken'
import MenberSelector from './memberSelector'

export default function studentCourse() {
  const [grade, setGrade] = useState('')
  const [subject, setSubject] = useState('')
  const [courseClass, setCourseClass] = useState('')
  const [courseName, setCourseName] = useState('')
  const isRegisterCourse = false
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
    const courseInfo = {
      grade,
      subject,
      courseClass,
      courseName,
    }
    const response = await adminService.createANewCourse(token, courseInfo)
    console.log(response)
  }
  return (
    <div className="register-course-main">
      <div className="register-course-container">
        <div className="form">
          <div className="form-titles">
            <span>年級:</span>
            <span>科目:</span>
            <span>班級:</span>
            <span>課程名稱:</span>
          </div>
          <div className="form-inputs">
            <div className="form-input-area">
              <input
                onChange={initGrade}
                className="form-input"
                id="grade"
                type="text"
                value={grade}
              />
              <Image
                className="down-arrow-img"
                src={downArrowImg}></Image>
            </div>

            <div className="form-input-area">
              <input
                onChange={initCourseClass}
                className="form-input"
                id="subject"
                type="text"
                value={courseClass}
              />
              <Image
                className="down-arrow-img"
                src={downArrowImg}></Image>
            </div>

            <div className="form-input-area">
              <input
                onChange={initSubject}
                className="form-input"
                id="courseClass"
                type="text"
                value={subject}
              />
              <Image
                className="down-arrow-img"
                src={downArrowImg}></Image>
            </div>

            <div className="form-input-area">
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
            送出
          </button>
        </div>
        <MenberSelector></MenberSelector>
      </div>
    </div>
  )
}
