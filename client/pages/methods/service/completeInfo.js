// 組件庫
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
// global組件
import Header from '../../../components/global/Header'
import userService from './userService'
export default function myCourse() {
  const [tempToken, setTempToken] = useState(null)
  const [realname, setRealname] = useState(null)
  const [phoneNumber, setPhoneNumber] = useState(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('token')
      setTempToken(token)
    }
  }, [])

  const postRequest = async (tempToken, realname, phoneNumber) => {
    const response = await userService.registerUser(tempToken, realname, phoneNumber)
    console.log(response)
  }

  return (
    <div className="complate-info-main">
      <Header></Header>
      <form className="form">
        <div className="title">輸入個人資料</div>
        <div className="inputs">
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
        <div
          className="submit-btn"
          type=""
          onClick={() => {
            postRequest(tempToken, realname, phoneNumber)
          }}>
          送出
        </div>
      </form>
    </div>
  )
}
