import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

// method
import { useUserToken } from '../../../../method/useUserToken'
import adminService from '../../../../method/adminService'

// style
import style from './style.module.css'

export default function AccessStudentList({ messageControl, editStatus, setEditStatus, choseAccessId, course_id, showAccessStudentList, setShowAccessStudentList }) {
  const token = useUserToken()
  const router = useRouter()
  const [members, setMembers] = useState()
  const [choseAccessInfo, setChoseAccessInfo] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState([])

  const clickStudent = (e, _id) => {
    e.classList.forEach((item) => {
      if (item === style['active']) {
        e.classList.remove(style['active'])
        setSelectedStudent(selectedStudent.filter((item) => item !== _id))
      } else {
        e.classList.add(style['active'])
        setSelectedStudent([...selectedStudent, _id])
      }
    })
  }

  const clickComplate = () => {
    let data = {
      accessName: choseAccessInfo.accessName,
      videoIDs: choseAccessInfo.videoIDs,
      studentIDs: selectedStudent,
      accessDate: choseAccessInfo.accessDate,
      unlimited: choseAccessInfo.accessDate === null,
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
      const data = { courses: course_id }
      adminService.getMembers(token, data).then((res) => {
        setMembers(res.data)
      })

      adminService.getAccessAllInfo(token, course_id, choseAccessId).then((res) => {
        setChoseAccessInfo(res.data)
        setSelectedStudent(res.data.studentIDs.map((item) => item._id))
      })
    }
  }, [token, course_id, choseAccessId])

  return (
    <div className={style['student-selector-main']}>
      <div className={style['student-selector-container']}>
        <div className={style['title']}>選擇要授權的成員</div>
        <div className={style['search-area']}></div>
        <div className={style['info-area']}>
          {members &&
            choseAccessInfo &&
            members.map((item, index) => {
              const isSelected = choseAccessInfo.studentIDs.find((userInfo) => userInfo._id === item._id)
              if (item.role === 'student') {
                return (
                  <div
                    className={`${style['member-info']} ${isSelected ? style['active'] : ''}`}
                    onClick={(e) => {
                      clickStudent(e.target, item._id)
                    }}
                    key={index}>
                    <div className={style['name']}>姓名:{item.userinfo.realname}</div>
                    <div className={style['role']}>{item.role === 'student' && '學生'}</div>
                  </div>
                )
              }
              return null
            })}
        </div>
        <div
          className={style['finish-btn']}
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
