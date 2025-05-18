import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

// method
import { useUserToken } from '../../../method/useUserToken'
import adminService from '../../../method/adminService'

// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

export default function StudentSelector({ course_id, selectedStudent, setSelectedStudent, showStudentSelector, setShowStudentSelector }) {
  const token = useUserToken()
  const [members, setMembers] = useState()

  const clickStudent = (e, _id) => {
    e.classList.forEach((item) => {
      if (item === 'active') {
        e.classList.remove('active')
        setSelectedStudent(
          selectedStudent.filter((item) => {
            return item !== _id
          })
        )
      } else {
        e.classList.add('active')
        setSelectedStudent([...selectedStudent, _id])
      }
    })
  }

  const test = () => {
  }

  useEffect(() => {
    if (token && course_id) {
      let data = {
        course_id: course_id,
      }
      adminService.getMembers(token, data).then((res) => {
        setMembers(res.data)
      })
    }
  }, [token, course_id])

  return (
    <div className="student-selector-main">
      <div className="student-selector-container">
        <div
          className="title"
          onClick={test}>
          選擇要授權的成員
        </div>
        <div className="search-area"></div>
        <div className="info-area">
          {members &&
            members.map((item, index) => {
              if (item.role === 'student') {
                return (
                  <div
                    className={`member-info ${
                      selectedStudent.find((id) => {
                        return id === item._id
                      }) && 'active'
                    }`}
                    onClick={(e) => {
                      clickStudent(e.target, item._id)
                    }}
                    key={index}>
                    <div className="name">姓名:{item.userinfo.realname}</div>
                    <div className="role">{item.role === 'student' && '學生'}</div>
                  </div>
                )
              }
            })}
        </div>
        <div
          className="finish-btn"
          onClick={() => {
            setShowStudentSelector(false)
          }}>
          完成並儲存
        </div>
      </div>
    </div>
  )
}
