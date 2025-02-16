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
  const [message, setMessage] = useState('')
  const [hasMessage, setHasMessage] = useState(false)
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
    if ((tempToken, realname, phoneNumber)) {
      userService.registerUser(tempToken, realname, phoneNumber).then((res) => {
        console.log(res)
        if (res.success === false && res.msg === '缺少 tempToken') {
          // 欄位為空的處理
          setMessage('請從正常管道進入該網頁')
          setHasMessage(true)
          setTimeout(() => {
            setHasMessage(false)
            setTimeout(() => {
              setMessage('')
            }, 200)
          }, 2000)
          return
        }
        if (res.token) {
          localStorage.setItem('token', `JWT ${res.token}`)
          setTimeout(() => {
            window.location.href = `${baseUrl}profiles/profile`
          }, 3000)
        } else {
          console.log('沒有token')
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
