import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import downArrowImg from '../../public/profile/downArrow.png'
import adminService from '../../method/adminService'
import { useUserToken } from '../../method/useUserToken'
import MenberSelector from './MemberSelector'

export default function addCourse() {
  const token = useUserToken();
  // 子組件
  const [selectedStudentId, setSelectedStudentId] = useState([])
  const [createdCourseId, setCreatedCourseId] = useState('')
  // 訊息框
  const [message, setMessage] = useState('')
  // 更新使用者輸入的資料
  const [grade, setGrade] = useState('')
  const [subject, setSubject] = useState('')
  const [courseClass, setCourseClass] = useState('')
  const [courseName, setCourseName] = useState('')
  // alert
  const [alertBGC, setAlertBGC] = useState('rgb(186, 179, 179)')
  const [alertZindex, setAlertZindex] = useState(-1)
  const [alertHeight, setAlertHeight] = useState('0px')

  // 請求參數
  let courseInfo = {}

  // 初始化
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

  // 將學生加進課程的請求，在createdCourseId改變時會執行
  const addStudentIntoNewCourse = useCallback(() => {
    const alert = document.querySelector('.alert')
    // 如果有選擇學生
    if (selectedStudentId.length && createdCourseId) {
      // 批量成員加進指定課程
      adminService
        .registerMember(token, {
          user_ids: selectedStudentId,
          course_id: createdCourseId,
        })
        .then((res) => {
          console.log(res)
          // 除錯
          console.error(res.data)
          alert.style.backgroundColor = '#a0db6c'
        })
    }
  }, [selectedStudentId, createdCourseId, token])
  // 新增按鈕
  const requireCreateCourse = () => {
    // 參數
    courseInfo = {
      grade: grade.trim(),
      subject: subject.trim(),
      courseClass: courseClass.trim(),
      courseName: courseName.trim(),
    }
    const alert = document.querySelector('.alert')
    // 請求
    // 創建新課程
    adminService
      .createANewCourse(token, courseInfo)
      .then((res) => {
        // 檢查是否回傳res.success
        if (res.data.success === false) {
          setAlertBGC('red')
          setMessage(`課程創建失敗!${res.data.msg}`)
        } else if (res.data.courseName) {
          setAlertBGC('#a0db6c')
          setMessage(`課程創建成功!`)
          console.log(res._id)
          setCreatedCourseId(res._id)
        }
      })
      .catch((err) => {
        console.err(err)
        // 紅色警告
        setAlertBGC('red')
        setMessage(`發生不明錯誤!${err}`)
      })
      .then(() => {
        // 開啟2秒後關閉警告
        setAlertZindex(1)
        setAlertHeight('60px')
        setTimeout(() => {
          setAlertZindex(-1)
          setAlertHeight('0')
        }, 2000)
      })

    // 清空輸入欄位
    setGrade('')
    setCourseClass('')
    setSubject('')
    setCourseName('')
  }

  // 初始化總課程名稱
  useEffect(() => {
    setCourseName(grade + courseClass + subject)
  }, [grade, courseClass, subject])

  // createdCourseId改變時執行加入課程的請求，用於同步
  useEffect(() => {
    addStudentIntoNewCourse()
  }, [createdCourseId, addStudentIntoNewCourse])

  return (
    <div className="register-course-container">
      <div className="register-page-header">創建課程系統</div>
      <div
        className="alert"
        style={{ backgroundColor: alertBGC, zIndex: alertZindex, height: alertHeight }}>
        {message}
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
          清除欄位
        </button>
        <button
          className="submit-form-btn"
          onClick={requireCreateCourse}>
          創建課程
        </button>
      </div>
      <div className="form">
        <div className="form-inputs">
          <div className="form-input-area">
            <div className="form-input-title">年級:</div>
            <input
              onChange={initGrade}
              className="form-input"
              id="grade"
              type="text"
              value={grade}
            />
            <div className="hint">例如:學年度</div>
          </div>

          <div className="form-input-area">
            <div className="form-input-title">科目:</div>
            <input
              onChange={initCourseClass}
              className="form-input"
              id="subject"
              type="text"
              value={courseClass}
            />
            <div className="hint">例如:化學、物理</div>
          </div>

          <div className="form-input-area">
            <div className="form-input-title">班級:</div>
            <input
              onChange={initSubject}
              className="form-input"
              id="courseClass"
              type="text"
              value={subject}
            />
            <div className="hint">例如:甲班，A班</div>
          </div>

          <div className="form-input-area">
            <div className="form-input-title">課程名稱:</div>
            <input
              onChange={initCourseName}
              className="form-input"
              id="courseName"
              type="text"
              value={courseName}
            />
            <div className="hint">此處會自動生成最終名稱</div>
          </div>
        </div>
      </div>
      <div className="gray-hint">可從底部選擇學生直接加入創建的新課程</div>
      <div className="child-component">
        <MenberSelector
          selectedStudentId={selectedStudentId}
          setSelectedStudentId={setSelectedStudentId}></MenberSelector>
      </div>
    </div>
  )
}
