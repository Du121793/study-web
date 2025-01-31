import { useEffect, useState } from 'react'
import Header from '../components/profile/Header'
import StudentLayout from '../components/profile/StudentLayout'
import TeacherLayout from '../components/profile/TeacherLayout'
import { getData } from './apis/Res'
export default function Home(isLogined) {
  const [userData, setUserData] = useState('')
  const [token, setToken] = useState('')
  const [role, setRole] = useState('')
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('JWT token')
      setToken(storedToken)
    }
  }, [])
  useEffect(() => {
    const fetchData = async () => {
      // 在 useEffect 內部定義 async 函式
      if (token) {
        try {
          const data = await getData(token) // 使用 await 取得資料
          setUserData(data) // 正確設定 state
        } catch (err) {
          console.error('Error fetching user data:', err)
        }
      } else {
        setUserData(null) // Token 不存在時，清除 userData
      }
    }

    fetchData()
  }, [token])
  isLogined = true
  return (
    <div>
      {isLogined && <Header></Header>}
      {userData && userData.role === 'student' && <StudentLayout></StudentLayout>}
      {userData && userData.role === 'teacher' && <TeacherLayout></TeacherLayout>}
      <span></span>
    </div>
  )
}
