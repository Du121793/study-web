// method
import { useRouter } from 'next/router'
import { useUserToken } from '../../method/useUserToken'
import userService from '../../method/userService'
// global組件
import Unlogined from '../../components/global/Unlogined'
import Header from '../../components/header/Header'
// component
import List from './list/List'
import MyCourse from './my_course/MyCourse'
import UserProfile from './user_profile/UserProfile'
import PreRegister from './pre_register/PreRegister'
import RemoveUsers from './remove_users/RemoveUsers'
import EditCourse from './edit_course/EditCourse'
import EditMembers from './edit_members/EditMembers'
import EditMembersInfo from './edit_member_info/EditMembersInfo'
import InfoBackUp from './infoBackUp/IinfoBackUp'
// 原生組件庫
import { useEffect, useState } from 'react'
// style
import style from './style.module.css'

export default function Profile() {
  const router = useRouter()
  const { to } = router.query

  const token = useUserToken()
  const [isLogined, setLogined] = useState(false)

  const [userRole, setUserRole] = useState(null)

  const [userShot, setUserShot] = useState(null) // 傳給header用於渲染

  const [switchState, setSwitchState] = useState(to ? to : 'myCourse') // 檢查是否要到哪個位置

  // 用來切換子組件
  const changeRightItemState = () => {
    if (switchState === 'myCourse') return <MyCourse />
    if (switchState === 'profile') return <UserProfile />
    if (switchState === 'editCourse') return <EditCourse />
    if (switchState === 'editCourseMember') return <EditMembers />
    if (switchState === 'editMemberInfo') return <EditMembersInfo />
    if (switchState === 'preRegisterMember') return <PreRegister />
    if (switchState === 'deletMember') return <RemoveUsers />
    if (switchState === 'InfoBackUp') return <InfoBackUp />
  }

  useEffect(() => {
    setSwitchState(router.query.to)
  }, [router.query])

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
    <div className={style['profile-main']}>
      <div className={style['top']}>
        <Header
          user_line_shot={userShot}
          loginState={isLogined}
          inIndex={style['course']}></Header>
        {!isLogined && <Unlogined></Unlogined>}
      </div>
      <div className={style['bottom']}>
        <div className={style['left-item']}>
          <List
            switchState={switchState}
            setSwitchState={setSwitchState}
          />
        </div>
        <div className={style['right-item']}>{changeRightItemState()}</div>
      </div>
    </div>
  )
}
