// 原生組件庫
import { useEffect, useState } from 'react'
// method
import adminService from '../../method/adminService'
import { useUserToken } from '../../method/useUserToken'
export default function EditMembers() {
  const token = useUserToken()
  const [selectedStudentId, setSelectedStudentId] = useState([])
  // 請求參數
  const [getedCourse, setGetedCourse] = useState({ courses: [] })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(9999)
  const [nameInput, setNameInput] = useState(null)
  const [phoneInput, setPhoneInput] = useState(null)
  const [gradeInput, setGradeInput] = useState(null)
  const [roleInput, setRoleInput] = useState(null)
  const [courseId, setCourseId] = useState(null)

  // 獲取資料
  const [members, setMembers] = useState([])

  // 初始化選擇狀態
  const initSelector = () => {
    let allActive = document.querySelectorAll('.select-active')
    let allCheckBox = document.querySelectorAll('.student-checkbox')
    if (allActive) {
      Array.from(allActive).forEach((item) => {
        item.classList.remove('select-active')
      })
    }
    if (allCheckBox) {
      Array.from(allCheckBox).forEach((item) => {
        item.checked = false
      })
    }
    setSelectedStudentId([])
  }

  // 全選功能
  const selectAll = () => {
    let allSelect = document.querySelectorAll('.select-area')
    if (allSelect) {
      Array.from(allSelect).forEach((item) => {
        item.click()
      })
    }
  }

  // 按下"加入到課程"的函式，將選擇的人加入到指定課程
  const registerMemberToCourse = async () => {
    adminService
      .registerMember(token, {
        user_ids: selectedStudentId, // 可以是陣列
        course_id: courseId,
      })
      .then(() => {
        showAllCourseMemebers()
        initSelector()
      })
  }

  //  按下"移除出課程"的函式，將選擇的人加入到指定課程
  const removeRegisterCourse = () => {
    adminService
      .unRegisterMember(token, {
        user_ids: selectedStudentId, // 可以是陣列
        course_id: courseId,
      })
      .then(() => {
        showAllCourseMemebers()
        initSelector()
      })
  }

  // 點擊整片區域都能選取到
  const memberAreaClickEvent = (e) => {
    if (e.firstChild) {
      e.firstChild.click()
    }
  }

  // 按下打勾變色
  const checkboxClickEvent = (e) => {
    e.classList.toggle('select-active')
  }

  // 顯示所有成員
  const showAllCourseMemebers = () => {
    let data = {
      page: page,
      pageSize: pageSize,
    }
    adminService.getMembers(token, data).then((res) => {
      setMembers(res.data)
      initSelector()
    })
  }

  // 顯示課程成員
  const showCourseMembers = () => {
    let data = {
      page: page,
      pageSize: pageSize,
      courses: courseId,
    }
    adminService.getMembers(token, data).then((res) => {
      setMembers(res.data)
      initSelector()
    })
  }

  // 獲取所有課程
  useEffect(() => {
    if (token) {
      let data = {
        page: page,
        pageSize: pageSize,
      }
      adminService.getCourses(token).then((res) => {
        setGetedCourse(res.data)
      })
      adminService.getMembers(token, data).then((res) => {
        setMembers(res.data)
      })
    }
    if ((token, courseId)) {
      let data = {
        page: page,
        pageSize: pageSize,
        courses: courseId,
      }
      adminService.getMembers(token, data).then((res) => {
        setMembers(res.data)
      })
    }
  }, [token, courseId, page, pageSize])

  const test = () => {
    console.log(members)
  }

  return (
    <div className="edit-members-main">
      <div
        className="title"
        onClick={test}>
        編輯成員
      </div>
      <div className="input-area">
        <span>課程名稱:</span>
        <select
          className="select"
          onChange={(e) => {
            setCourseId(e.target.value)
          }}
          name=""
          id="">
          <option value="">請選擇</option>
          {getedCourse.courses &&
            getedCourse.courses.map((item, index) => (
              <option
                key={index}
                value={item._id}>
                {item.courseName}
              </option>
            ))}
        </select>
      </div>
      <div className="member-selector-area">
        <div className="option-area">
          <div
            className="button show-all-members-btn"
            onClick={showAllCourseMemebers}>
            顯示所有成員
          </div>
          <div
            className="button show-course-members-btn"
            onClick={showCourseMembers}>
            顯示該課程成員
          </div>
          <div
            className="button add-member-to-course-btn"
            onClick={registerMemberToCourse}>
            加入到課程
          </div>
          <div
            className="button remove-member-to-course-btn"
            onClick={removeRegisterCourse}>
            移除出課程
          </div>
          <div
            className="button select-all-btn"
            onClick={selectAll}>
            全選
          </div>
          <div
            className="button unselect-all-btn"
            onClick={initSelector}>
            反選
          </div>
        </div>
        <ul className="member-area">
          <div className="title-area">
            <span id="username">暱稱</span>
            <span id="realname">姓名</span>
            <span id="phone-number">電話號碼</span>
            <span id="grade">年級</span>
            <span id="role">身分組</span>
          </div>
          {members &&
            members.map((item, index) => (
              <li
                key={index}
                className="select-area"
                onClick={(e) => {
                  memberAreaClickEvent(e.target)
                  checkboxClickEvent(e.target)
                }}>
                {/* 勾選框 */}
                <input
                  className="student-checkbox"
                  type="checkbox"
                  onChange={(e) => {
                    setSelectedStudentId((prev) => {
                      return e.target.checked ? [...prev, item._id] : prev.filter((id) => id !== item._id)
                    })
                  }}
                />
                <div className="searched-info">
                  {item.userinfo.username === undefined && <span id="username">無</span>}
                  {item.userinfo.username !== undefined && <span id="username">{item.userinfo.username}</span>}
                  <span id="realname">{item.userinfo.realname}</span>
                  <span id="phone-number">{item.userinfo.phoneNumber}</span>
                  <span id="course-class">{item.userinfo.courseClass}</span>
                  <span id="grade">{item.userinfo.grade}</span>
                  {item.role === 'teacher' && <span id="role">教師</span>}
                  {item.role === 'student' && <span id="role">學生</span>}
                  {item.role === 'admin' && <span id="role">管理員</span>}
                </div>
              </li>
            ))}
        </ul>
      </div>
    </div>
  )
}
