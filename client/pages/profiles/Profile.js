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
// 原生組件庫
import { useEffect, useState } from 'react'

export default function Profile() {
  const [role, setRole] = useState('')
  const token = useUserToken()
  const [isLogined, setLogined] = useState(false)

  const [userRole, setUserRole] = useState(null)
  // 傳給header用於渲染
  const [userShot, setUserShot] = useState(null)

  useEffect(() => {
    if (!sessionStorage.getItem('user_role') || !sessionStorage.getItem('user_id')) {
      userService.getUserInfo(token).then((res) => {
        sessionStorage.setItem('user_lineID', res.data.lineID)
        sessionStorage.setItem('user_id', res.data._id)
        sessionStorage.setItem('user_line_shot', res.data.userinfo.pictureUrl)
        sessionStorage.setItem('user_role', res.data.role)
      })
    }
    if (sessionStorage.getItem('user_id')) {
      setLogined(true)
    }
    if (sessionStorage.getItem('user_role')) {
      setUserRole(sessionStorage.getItem('user_role'))
    }
    if (sessionStorage.getItem('user_shot')) {
      setUserShot(sessionStorage.getItem('user_shot'))
    }
  }, [])

  return (
    <div className="profile-main">
      <Head></Head>
      <Header
        user_line_shot={userShot}
        loginState={isLogined}></Header>
      {userRole && userRole === 'student' && <StudentLayout user_role={userRole}></StudentLayout>}
      {userRole && userRole === 'teacher' && <TeacherLayout user_role={userRole}></TeacherLayout>}
      {userRole && userRole === 'admin' && <AdminLayout user_role={userRole}></AdminLayout>}
      {!isLogined && <Unlogined></Unlogined>}
      <span></span>
    </div>
  )
}
