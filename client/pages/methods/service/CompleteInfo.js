// 組件庫

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

// global組件
import Header from '../../../components/header/Header'
// method
import userService from '../../../method/userService'
export default function ComplateInfo() {
  // env
  const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

  const [tempToken, setTempToken] = useState(null)
  const [realname, setRealname] = useState(null)
  const [phoneNumber, setPhoneNumber] = useState(null)
  const [message, setMessage] = useState('')
  const [hasMessage, setHasMessage] = useState(false)
  const baseUrl = `${clientIp}/`

  const router = useRouter()
  const { token } = router.query

  useEffect(() => {
    if (!router.isReady) return
    if (!token) {
      window.location.href = `${baseUrl}`
    }
  }, [router.isReady, token])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('token')
      setTempToken(token)
    }
  }, [])
  // 丁建中
  const postRequest = async (tempToken, realname, phoneNumber) => {
    if ((tempToken, realname, phoneNumber)) {
      userService.registerUser(tempToken, realname, phoneNumber).then((res) => {
        if (res === '') {
          setMessage('請輸入正確資訊')
          setHasMessage(true)
          setTimeout(() => {
            setHasMessage(false)
            setTimeout(() => {
              setMessage('')
            }, 200)
          }, 2000)
          return
        }
        if (res?.success === false) {
          // 欄位為空的處理
          setMessage(res.msg)
          setHasMessage(true)
          setTimeout(() => {
            setHasMessage(false)
            setTimeout(() => {
              setMessage('')
            }, 200)
          }, 2000)
          return
        }
        if (res?.success === true) {
          localStorage.setItem('token', `JWT ${res.token}`)
          window.location.href = `${clientIp}`
          return
        }
      })
    } else {
      // 欄位為空的處理
      setMessage('欄位不能為空')
      setHasMessage(true)
      setTimeout(() => {
        setHasMessage(false)
        setTimeout(() => {
          setMessage('')
        }, 200)
      }, 2000)
    }
  }

  return (
    <div className="complate-info-main">
      <Header></Header>
      <div className="form">
        <div
          className="alert"
          style={hasMessage ? { opacity: '1', height: '24px' } : { opacity: '0', height: '0' }}>
          {message}
        </div>
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
