import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'

// method
import { useUserToken } from '../../method/useUserToken'
import userService from '../../method/userService'
import adminService from '../../method/adminService'

// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

export default function AccessStudentList({ messageControl, editStatus, setEditStatus, choseAccessId, course_id, showAccessStudentList, setShowAccessStudentList }) {
  const token = useUserToken()
  const router = useRouter()
  const [userInfo, setUserInfo] = useState({})
  const [members, setMembers] = useState()
  const [choseAccessInfo, setChoseAccessInfo] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState([])

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

  // 此處需要修改的api
  const clickComplate = () => {
    // data = { accessName, videoIDs, studentIDs, accessDate, unlimited }
    let data = {
      accessName: choseAccessInfo.accessName,
      videoIDs: choseAccessInfo.videoIDs,
      studentIDs: selectedStudent,
      accessDate: choseAccessInfo.accessDate,
      unlimited: choseAccessInfo.accessDate === null ? true : false,
    }
    adminService.editAccessInfo(token, course_id, choseAccessId, data).then((res) => {
      if (res.success === true) {
        setEditStatus(!editStatus)
        messageControl('編輯成功', true)
      }
    })
  }
  useEffect(() => {
    if (token && course_id) {
      let data = {
        course_id: course_id,
      }
      adminService.getMembers(token, data).then((res) => {
        setMembers(res.data)
      })

      adminService.getAccessAllInfo(token, course_id, choseAccessId).then((res) => {
        setChoseAccessInfo(res.data)
        let tempArray = []
        res.data.studentIDs.forEach((item) => {
          tempArray.push(item._id)
        })
        setSelectedStudent(tempArray)
      })
    }
  }, [token, course_id, choseAccessId])

  const test = () => {
    console.log(choseAccessInfo)
  }
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
            choseAccessInfo &&
            members.map((item, index) => {
              if (
                choseAccessInfo.studentIDs.find((userInfo) => {
                  return userInfo._id === item._id
                }) &&
                item.role === 'student'
              ) {
                return (
                  <div
                    className="member-info active"
                    onClick={(e) => {
                      clickStudent(e.target, item._id)
                    }}
                    key={index}>
                    <div className="name">姓名:{item.userinfo.realname}</div>
                    <div className="role">{item.role === 'student' && '學生'}</div>
                  </div>
                )
              } else if (item.role === 'student') {
                return (
                  <div
                    className="member-info"
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
            setShowAccessStudentList(false)
            clickComplate()
          }}>
          完成並儲存
        </div>
      </div>
    </div>
  )
}
