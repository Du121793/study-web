import { useEffect, useState } from 'react'
import adminService from '../methods/service/adminService'
import { useUserToken } from '../methods/service/useUserToken'
export default function memberSelector({selectedStudentId, setSelectedStudentId}) {
  let studentCheckboxArray = []
  const token = useUserToken()
  const [members, setMembers] = useState([])
  const [searchStudentOption, setSearchStudentOption] = useState({ username: '', phoneNumber: '', role: '', grade: '' })
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
  const selectAllStudent = () => {
    document.querySelectorAll('.student-checkbox').forEach((checkbox) => {
      checkbox.checked = true
    })
  }
  const clearSearch = () => {
    document.querySelectorAll('.student-checkbox').forEach((checkbox) => {
      checkbox.checked = false
    })
  }
  const searchStudentButton = () => {
    try {
      adminService.getMembers(token, searchStudentOption).then((res) => {
        setMembers(res)
      })
    } catch (e) {
      alert(e)
    }
  }
  useEffect(() => {
    if (token) {
      try {
        adminService.getMembers(token).then((res) => {
          setMembers(res)
        })
      } catch (e) {
        alert(e)
      }
    }
  }, [token])
  return (
    <div className="register-area">
      <div className="classification">
        <div className="search-inputs">
          <span>姓名:</span>
          <input
            onChange={(e) => {
              searchStudentOptionNameChange(e)
            }}
            type="text"
          />
          <span>電話:</span>
          <input
            onChange={(e) => {
              searchStudentOptionPhoneChange(e)
            }}
            type="text"
          />
          <span>年級:</span>
          <input
            onChange={(e) => {
              searchStudentOptionGradeChange(e)
            }}
            type="text"
          />
          身分組:
          <select
            onChange={(e) => {
              searchStudentOptionRoleChange(e)
            }}
            name=""
            id="">
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
        </div>
        <div className="btns">
          <button onClick={selectAllStudent}>全選</button>
          <button onClick={clearSearch}>取消全選</button>
          <button onClick={searchStudentButton}>搜尋</button>
        </div>
      </div>
      <ul>
        {members.map((item, index) => (
          <li key={index}>
            <input
              className="student-checkbox"
              type="checkbox"
              onChange={(e) => {
                if (e.target.checked) {
                  studentCheckboxArray.push(item._id)
                } else {
                  studentCheckboxArray = studentCheckboxArray.filter((e) => {
                    return e != item._id
                  })
                }
                setSelectedStudentId(studentCheckboxArray)
              }}
            />
            <div>
              {!searchStudentOption && (
                <div className="searched-info">
                  <span className="username">{item.userinfo.username}</span>
                  <span className="phone-number">{item.phoneNumber}</span>
                  <span className="grade">{item.grade}</span>
                </div>
              )}
              {searchStudentOption && (
                <div className="searched-info">
                  <span className="username">{item.userinfo.username}</span>
                  <span className="phone-number">{item.phoneNumber}</span>
                  <span className="grade">{item.grade}</span>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      <div className="page-switch"></div>
    </div>
  )
}
