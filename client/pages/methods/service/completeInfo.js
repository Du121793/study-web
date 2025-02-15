// 組件庫
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
// global組件
import Header from '../../../components/global/Header'
import userService from './userService'
export default function myCourse() {
  const [tempToken, setTempToken] = useState(null)
  const [realname, setRealname] = useState(null)
  const [phoneNumber, setPhoneNumber] = useState(null)
  const baseUrl = 'http://localhost:3000/'
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('token')
      setTempToken(token)
    }
  }, [])
  // 丁建中
  const postRequest = async (tempToken, realname, phoneNumber) => {
    try {
      if ((tempToken, realname, phoneNumber)) {
        userService
          .registerUser(tempToken, realname, phoneNumber)
          .then((res) => {
            console.log(res)
            if (res.token) {
              localStorage.setItem('token', `JWT ${res.token}`)
            } else {
              console.log('沒有token')
            }
          })
          .then(() => {
            window.location.href = `${baseUrl}profiles/profile`
          })
      }
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <div className="complate-info-main">
      <Header></Header>
      <div className="form">
        <div className="title">輸入個人資料</div>
        <div className="inputs">
          <div className="user-input">
            <div>
              <span>真實性名:</span>
              <input
                type="text"
                onChange={(e) => setRealname(e.target.value)}
              />
            </div>
            <div>
              <span>電話號碼:</span>
              <input
                type="text"
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>
          <div className="submit-btn">
            <button
              onClick={() => {
                postRequest(tempToken, realname, phoneNumber)
              }}>
              送出
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
