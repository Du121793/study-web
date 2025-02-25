// 組件庫
import { useState, useEffect } from 'react'
import { useUserToken } from '../methods/service/useUserToken'
import Image from 'next/image'
// 導入方法
import adminService from '../methods/service/adminService'
import userService from '../methods/service/userService'
// profiles組件
import MemberSelector from './memberSelector'

export default function RemoveFromCourse() {
  const alert = document.querySelector('.alert')
  const token = useUserToken()
  const [message, setMessage] = useState('')
  const [courses, setCourses] = useState('')
  // 選擇的學生
  const [selectedMember, setSelectedMember] = useState([])
  // 選擇的課程
  const [selectCourse, setSelectCourse] = useState('')
  // 用來請求該課程的所有學生
  const [selectedCourseMembers, setSelectedCourseMembers] = useState([])
  // 用於當有成員被移除後再發一次請求用於刷新畫面
  const [UnRegisterMemberedStatus, setsUnRegisterMemberStatus] = useState(true)
  // 刪除二次確認
  let doubleCheckDelete = false

  useEffect(() => {
    initCourses(token)
  }, [token])

  // 當有成員被移除後再發一次請求用於刷新畫面
  useEffect(() => {
    if (token) SelectedCourseMembers(selectCourse)
  }, [token, UnRegisterMemberedStatus])

  // 請求課程資料
  const initCourses = (token) => {
    if (token) {
      try {
        adminService.getCourses(token, { page: 1 }).then((res) => {
          setCourses(res.data)
        })
      } catch (error) {
        console.log(error)
      }
    }
  }

  // 點擊選擇學生，存到selectedMember
  const clickSelectedStudent = (e, student_id) => {
    if (e.style.border === '2px solid rgba(185, 229, 154, 0.992)') {
      e.style.border = '2px solid rgba(0, 0, 0, 0)'
    } else {
      e.style.border = '2px solid rgba(185, 229, 154, 0.991)'
    }

    if (
      selectedMember.find((item) => {
        return item === student_id
      })
    ) {
      setSelectedMember(
        selectedMember.filter((item) => {
          return item !== student_id
        })
      )
    } else {
      setSelectedMember([...selectedMember, student_id])
    }
  }
  // 將成員移除出指定課程
  // unRegisterInfo 內存放 學生id陣列與課程id { user_ids, course_id }
  const removeMembersFromCourse = () => {
    if (selectCourse.length) {
      adminService
        .unRegisterMember(token, {
          user_ids: selectedMember,
          course_id: selectCourse,
        })
        .then((res) => {
          console.log(res)
          setsUnRegisterMemberStatus(!UnRegisterMemberedStatus)
          setMessage('移除成功')
          alert.style.backgroundColor = 'rgb(172, 220, 159)'
          // if (res === '') {
          //   setMessage('請選擇欲移除的成員')
          //   alert.style.backgroundColor = 'rgb(233, 102, 102)'
          // }
        })
    } else {
      setMessage('請選擇課程')
      console.log(message)
      alert.style.backgroundColor = 'rgb(233, 102, 102)'
    }
    alert.style.zIndex = '1'
    alert.style.height = '80px'
    setTimeout(() => {
      alert.style.zIndex = '-1'
      alert.style.height = '0'
    }, 1500)
  }

  // 請求獲得所選擇的課程的所有成員
  const SelectedCourseMembers = (course_id) => {
    adminService.getMembers(token, { courses: course_id }).then((res) => {
      setSelectedCourseMembers(res.data)
    })
  }

  // 二次確認刪除
  const confirmDelete = (e) => {}
  // 元件掛載後以及 token 改變時請求課程資料

  const test = () => {
    console.log(courses.courses)
  }
  return (
    <div className="remove-from-course-main">
      <div className="alert">{message}</div>
      <div className="remove-from-course-header">課程移除成員系統</div>
      <div className="system-body">
        <div className="selects-area">
          <div className="chose-course-area">
            <div className="title">請選擇課程</div>
            {/* 改變則調用SelectedCourseMembers */}
            <select
              onChange={(e) => {
                SelectedCourseMembers(e.target.value)
                setSelectCourse(e.target.value)
              }}>
              <option value="123">請選擇</option>
              {courses && courses.courses.map((item) => <option value={item._id}>{item.courseName}</option>)}
            </select>
          </div>
          <button
            className="submit-btn"
            onClick={removeMembersFromCourse}>
            送出
          </button>
        </div>
        <div className="members-area">
          <div className="members-area-title">請選擇欲移除的成員</div>
          <div className="show-members">
            <div
              id="title"
              className="member">
              <span className="username">暱稱</span>
              <span className="realname">真實性名</span>
              <span className="phoneNumber">電話</span>
              <span className="grade">年級</span>
              <span className="role">身分組</span>
            </div>
          </div>
          <div className="show-members">
            {selectedCourseMembers.map((item) => (
              <div
                className="member"
                onClick={(e) => {
                  clickSelectedStudent(e.target, item._id)
                }}>
                <span className="username">{item.userinfo.username}</span>
                <span className="realname">{item.userinfo.realname}</span>
                <span className="phoneNumber">{item.userinfo.phoneNumber}</span>
                <span className="grade">{item.userinfo.grade}</span>
                <span className="role">{item.role === 'teacher' ? '老師' : '學生'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
