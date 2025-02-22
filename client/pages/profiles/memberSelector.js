// 組件庫
import { useEffect, useState } from 'react'
// method組件
import adminService from '../methods/service/adminService'
import { useUserToken } from '../methods/service/useUserToken'
export default function memberSelector({ selectedStudentId, setSelectedStudentId }) {
  const [isSelectAllCheckbox, setIsSelectAllCheckbox] = useState(false)
  const token = useUserToken()
  // 獲取資料
  const [members, setMembers] = useState([])
  const [searchStudentOption, setSearchStudentOption] = useState({
    username: '',
    phoneNumber: '',
    role: '',
    grade: '',
  })
  const searchStudentOptionNameChange = (e) => {
    setSearchStudentOption((prevState) => ({
      ...prevState, // 保留其他屬性不變
      username: e.target.value, // 更新 username
    }))
  }
  const searchStudentOptionPhoneChange = (e) => {
    setSearchStudentOption((prevState) => ({
      ...prevState, // 保留其他屬性不變
      phoneNumber: e.target.value, // 更新 username
    }))
  }
  const searchStudentOptionRoleChange = (e) => {
    setSearchStudentOption((prevState) => ({
      ...prevState, // 保留其他屬性不變
      role: e.target.value, // 更新 username
    }))
  }
  const searchStudentOptionGradeChange = (e) => {
    setSearchStudentOption((prevState) => ({
      ...prevState, // 保留其他屬性不變
      grade: e.target.value, // 更新 username
    }))
  }
  // 全選按鈕
  const selectAllStudent = () => {
    const boxs = document.querySelectorAll('.student-checkbox')
    boxs.forEach((checkbox) => {
      // 判斷是否有單個被選取
      if (checkbox.checked === false) {
        // 全部打勾
        checkbox.click()
      } else if (isSelectAllCheckbox === false && checkbox.checked === false) {
        boxs.forEach((checkbox) => {
          // 全部打勾
          checkbox.click()
        })
        setIsSelectAllCheckbox(true)
      }
    })
  }
  // 取消全選按鈕
  const clearSearch = () => {
    const boxs = document.querySelectorAll('.student-checkbox')
    if (isSelectAllCheckbox) {
      boxs.forEach((checkbox) => {
        // 全部打勾
        checkbox.click()
      })
      setIsSelectAllCheckbox(false)
    } else {
      // 判斷是否有單個被選取
      boxs.forEach((checkbox) => {
        if (checkbox.checked === true) {
          // 全部打勾
          checkbox.click()
        }
      })
    }
  }
  // 搜尋按鈕
  const searchStudentButton = () => {
    const boxs = document.querySelectorAll('.student-checkbox')
    boxs.forEach((checkbox) => {
      if (checkbox.checked === true) {
        // 全部打勾
        checkbox.click()
      }
    })
    setIsSelectAllCheckbox(false)
    try {
      adminService.getMembers(token, searchStudentOption).then((res) => {
        setMembers(res.data)
      })
    } catch (e) {
      alert(e)
    }
  }
  // 按下打勾變色
  const checkboxClickEvent = (e) => {
    if (e.parentNode.style.border === '2px solid rgb(124, 225, 180)') {
      e.parentNode.style.border = '2px solid rgb(0, 0, 0,0.2)'
    } else {
      e.parentNode.style.border = '2px solid rgb(124, 225, 180)'
    }
  }
  // 點擊整片區域都能選取到
  const memberAreaClickEvent = (e) => {
    if (e.firstChild) {
      e.firstChild.click()
    }
    // rgb(124, 225, 141)
  }
  useEffect(() => {
    if (token) {
      try {
        adminService.getMembers(token).then((res) => {
          setMembers(res.data)
        })
      } catch (e) {
        alert(e)
      }
    }
  }, [token])
  return (
    <div className="member-select-area">
      <div className="member-select-header">成員搜尋功能</div>
      <div className="classification">
        <div className="search-inputs">
          {/* 姓名 */}
          <div>
            <span>姓名:</span>
            <input
              className="input-name"
              onChange={(e) => {
                searchStudentOptionNameChange(e)
              }}
              type="text"
            />
          </div>
          {/* 電話 */}
          <div>
            <span>電話:</span>
            <input
              className="input-phone"
              onChange={(e) => {
                searchStudentOptionPhoneChange(e)
              }}
              type="text"
            />
          </div>
          {/* 年級 */}
          <div>
            <span>年級:</span>
            <input
              className="input-grade"
              onChange={(e) => {
                searchStudentOptionGradeChange(e)
              }}
              type="text"
            />
          </div>
          {/* 身分組 */}
          <div className="search-inputs">
            身分組:
            <select
              onChange={(e) => {
                searchStudentOptionRoleChange(e)
              }}
              name=""
              id="">
              <option value="">全部</option>
              <option value="teacher">教師</option>
              <option value="student">學生</option>
            </select>
          </div>
        </div>
        {/* 三個按鈕 */}
        <div className="btns">
          <button
            className="search-option-btn"
            onClick={selectAllStudent}>
            全選
          </button>
          <button
            className="search-option-btn"
            onClick={clearSearch}>
            取消全選
          </button>
          <button
            className="search-option-btn"
            onClick={searchStudentButton}>
            搜尋
          </button>
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
              onClick={(e) => {
                memberAreaClickEvent(e.target)
              }}>
              {/* 勾選框 */}
              <input
                className="student-checkbox"
                type="checkbox"
                onChange={(e) => {
                  checkboxClickEvent(e.target)
                  setSelectedStudentId((prev) => {
                    return e.target.checked ? [...prev, item._id] : prev.filter((id) => id !== item._id)
                  })
                }}
              />
              {!searchStudentOption && (
                <div className="searched-info">
                  <span id="username">{item.userinfo.username}</span>
                  <span id="realname">{item.userinfo.realname}</span>
                  <span id="phone-number">{item.userinfo.phoneNumber}</span>
                  <span id="course-class">{item.userinfo.courseClass}</span>
                  <span id="grade">{item.userinfo.grade}</span>
                </div>
              )}
              {searchStudentOption && (
                <div className="searched-info">
                  <span id="username">{item.userinfo.username}</span>
                  <span id="realname">{item.userinfo.realname}</span>
                  <span id="phone-number">{item.userinfo.phoneNumber}</span>
                  <span id="grade">{item.userinfo.grade}</span>
                  {item.role === 'teacher' ? <span id="role">老師</span> : <span id="role">學生</span>}
                </div>
              )}
            </li>
          ))}
      </ul>
      <div className="page-switch"></div>
    </div>
  )
}
