// method
import { useUserToken } from '../../method/useUserToken'
import userService from '../../method/userService'
// profile的組件
import StudentLayout from '../../components/profile/StudentLayout'
import TeacherLayout from '../../components/profile/TeacherLayout'
import AdminLayout from '../../components/profile/AdminLayout'
// global組件
import Unlogined from '../../components/global/Unlogined'
import Header from '../../components/global/Header'
import Head from '../../components/global/Globla'
// list
import List from './List'

// component
import MyCourse from '../../pages/profiles/MyCourse'
import UserProfile from '../../pages/profiles/UserProfile'
import PreRegister from '../../pages/profiles/PreRegister'
import RemoveUsers from '../../pages/profiles/RemoveUsers'
import EditCourse from '../../pages/profiles/EditCourse'
import EditMembers from '../../pages/profiles/EditMembers'
import EditMembersInfo from '../../pages/profiles/EditMembersInfo'
// 原生組件庫
import { useEffect, useState } from 'react'

export default function Profile({ from }) {
  const [role, setRole] = useState('')
  const token = useUserToken()
  const [isLogined, setLogined] = useState(false)

  const [userRole, setUserRole] = useState(null)
  // 傳給header用於渲染
  const [userShot, setUserShot] = useState(null)

  const [switchState, setSwitchState] = useState('myCourse')

  // 用來切換子組件
  const changeRightItemState = () => {
    if (switchState === 'myCourse') return <MyCourse />
    if (switchState === 'profile') return <UserProfile />
    if (switchState === 'editCourse') return <EditCourse />
    if (switchState === 'editCourseMember') return <EditMembers />
    if (switchState === 'editMemberInfo') return <EditMembersInfo />
    if (switchState === 'preRegisterMember') return <PreRegister />
    if (switchState === 'deletMember') return <RemoveUsers />
  }

  useEffect(() => {
    if (!localStorage.getItem('user_role') || !localStorage.getItem('user_id')) {
      userService.getUserInfo(token).then((res) => {
        localStorage.setItem('user_lineID', res.data.lineID)
        localStorage.setItem('user_id', res.data._id)
        localStorage.setItem('user_line_shot', res.data.userinfo.pictureUrl)
        localStorage.setItem('user_role', res.data.role)
      })
    }
    if (localStorage.getItem('user_id')) {
      setLogined(true)
    }
    if (localStorage.getItem('user_role')) {
      setUserRole(localStorage.getItem('user_role'))
    }
    if (localStorage.getItem('user_shot')) {
      setUserShot(localStorage.getItem('user_shot'))
    }
  }, [])

  return (
    <div className="profile-main">
      <div className="top">
        <Header
          user_line_shot={userShot}
          loginState={isLogined}
          inIndex="course"></Header>
        {!isLogined && <Unlogined></Unlogined>}
      </div>
      <div className="bottom">
        <div className="left-item">
          <List
            switchState={switchState}
            setSwitchState={setSwitchState}
          />
        </div>
        <div className="right-item">{changeRightItemState()}</div>
      </div>
    </div>
  )
}
