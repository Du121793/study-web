import { useEffect, useState } from 'react'
import adminService from '../methods/service/adminService'
import { useUserToken } from '../methods/service/useUserToken'
export default function stidentCourse() {
  const token = useUserToken()
  const [members, setMembers] = useState([])
  const [searchStudentOption, setSearchStudentOption] = useState({ username: '', phoneNumber: '', role: '' })
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
  const initShowStudent = () => {}
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
  console.log(members)
  console.log(searchStudentOption)
  /* filiter需要是物件
     {username, phoneNumber, _id, role, courses}*/
  return (
    <div className="register-cursor-main">
      <div className="search-input-area">
        <span>課程名稱:</span>
        <input
          onChange={(e) => {
            courseSearchInputChange(e)
          }}
          type="text"
        />
        <span>年級:</span>
        <input
          onChange={(e) => {
            gradeSearchInputChange(e)
          }}
          type="text"
        />
        <span>班級:</span>
        <input
          onChange={(e) => {
            courseClassSearchInputChange(e)
          }}
          type="text"
        />
        <div className="submit">送出</div>
      </div>
      <div className="register-area">
        <div className="classification">
          姓名:
          <input
            onChange={(e) => {
              searchStudentOptionNameChange(e)
            }}
            type="text"
          />
          電話:
          <input
            onChange={(e) => {
              searchStudentOptionPhoneChange(e)
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
          <button>全選</button>
          <button>取消全選</button>
        </div>
        <ul>
          {members.map((item, index) => (
            <li key={index}>
              <input
                className="student-checkbox"
                type="checkbox"
              />
              {!searchStudentOption && item.userinfo.username}
            </li>
          ))}
        </ul>
        <div className="page-switch"></div>
      </div>
    </div>
  )
}
