import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import downArrowImg from '../../public/profile/downArrow.png'
export default function stidentCourse() {
  const profilePageUrl = 'http://localhost:3000/profiles/profile'
  const homePage = 'http://localhost:3000'
  const [grade, setGrade] = useState('')
  const [subject, setSubject] = useState('')
  const [studentClass, setStudentClass] = useState('')
  const [cursorName, setCursorName] = useState('')
  const initGrade = (e) => {
    setGrade(e.target.value)
  }
  const initStudentClass = (e) => {
    setStudentClass(e.target.value)
  }
  const initSubject = (e) => {
    setSubject(e.target.value)
  }
  const initCursorName = (e) => {
    const value = e.target.value
    setCursorName(value)
  }
  useEffect(() => {
    setCursorName(grade + studentClass + subject)
  }, [grade, studentClass, subject])
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
                onChange={initStudentClass}
                className="form-input"
                id="subject"
                type="text"
                value={studentClass}
              />
              <Image
                className="down-arrow-img"
                src={downArrowImg}></Image>
            </div>

            <div className="form-input-area">
              <input
                onChange={initSubject}
                className="form-input"
                id="studentClass"
                type="text"
                value={subject}
              />
              <Image
                className="down-arrow-img"
                src={downArrowImg}></Image>
            </div>

            <div className="form-input-area">
              <input
                onChange={initCursorName}
                className="form-input"
                id="cursorName"
                type="text"
                value={cursorName}
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
              setStudentClass('')
              setSubject('')
              setCursorName('')
            }}>
            清除
          </button>
          <button className="submit-form-btn">送出</button>
        </div>
      </div>
    </div>
  )
}
