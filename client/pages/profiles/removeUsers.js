// 組件庫
import { useState, useEffect } from 'react'
import { useUserToken } from '../methods/service/useUserToken'
import Image from 'next/image'
// 導入method
import adminService from '../methods/service/adminService'
export default function removeUsers() {
  const token = useUserToken()
  const [getUsers, setGetUsers] = useState([])
  useEffect(() => {
    if (token) {
      getUsersFunction()
    }
  }, [token])
  const getUsersFunction = () => {
    adminService.getMembers(token).then((res) => {
      setGetUsers(res.data)
      console.log(res)
    })
  }
  return <div className="remove-users-page"></div>
}
