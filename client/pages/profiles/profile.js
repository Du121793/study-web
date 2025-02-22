import { useEffect, useState } from 'react'
import Header from '../../components/global/Header'
import Unlogined from '../../components/global/Unlogined'
import StudentLayout from '../../components/profile/StudentLayout'
import TeacherLayout from '../../components/profile/TeacherLayout'
import Head from '../../components/global/Globla'
import { useUserToken } from '../methods/service/useUserToken'
import userService from '../methods/service/userService'
export default function Profile() {
  const [role, setRole] = useState('')
  const token = useUserToken()
  const [userInfo, setUserInfo] = useState(null)
  const [isLogined, setLogined] = useState(false)
  useEffect(() => {
    if (token) {
      userService
        .getUserInfo(token)
        .then((data) => {
          setUserInfo(data)
          setLogined(true)
        })
        .catch((err) => console.error('Error:', err))
    }
  }, [token])

  const test = () => {
    console.log(userInfo)
  }
  return (
    <div className="profile-main">
      {/* <button onClick={test}>測試按鈕</button> */}
      <Head></Head>
      <Header loginState={isLogined}></Header>
      {userInfo && userInfo.data.role === 'student' && <StudentLayout></StudentLayout>}
      {userInfo && userInfo.data.role === 'teacher' && <TeacherLayout></TeacherLayout>}
      {!isLogined && <Unlogined></Unlogined>}
      <span></span>
    </div>
  )
}
