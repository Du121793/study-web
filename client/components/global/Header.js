// 組件庫
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
// public
import lineIcon from '../../public/imgs/line.png'
import logo from '../../public/imgs/logo.jpg'
// method
import { useUserToken } from '../../method/useUserToken'
import userService from '../../method/userService'

export default function Header(loginState) {
  // env
  const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP
  const serverIp = process.env.NEXT_PUBLIC_SERVER_IP
  const [userInfo, setUserInfo] = useState(null)
  const token = useUserToken()
  // 路由參數
  const loginURL = `${serverIp}/auth/line`
  const HomePageURL = clientIp
  const ProfilePageURL = `${clientIp}/profiles/Profile`
  // 登出 刪除token
  const signOut = () => {
    localStorage.removeItem('token')
    window.location.replace('/')
  }
  // 回傳用戶資料到 userInfo
  useEffect(() => {
    if (token) {
      userService
        .getUserInfo(token)
        .then((data) => {
          setUserInfo(data)
        })
        .catch((err) => console.error('Error:', err))
    }
  }, [token])

  const test = () => {
    console.log(userInfo)
  }
  // Layout
  return (
    <div className="header-container">
      <div className="header-main">
        {/* header's logo */}
        <Link
          className="logo-container"
          href={HomePageURL}>
          <Image
            className="logo-img"
            alt="logo,s image"
            src={logo}
            width={1400}></Image>
        </Link>
        <div className="header-middle">
          <div
            onClick={test}
            className="header-middle-nav-area"
            id="newest">
            <div className="line"></div>
            <span>最新消息</span>
          </div>
          <div
            className="header-middle-nav-area"
            id="course-info">
            <div className="line"></div>
            <span>課程資訊</span>
          </div>
          <div
            className="header-middle-nav-area"
            id="rank">
            <div className="line"></div>
            <span>高手榜單</span>
          </div>
          <div
            className="header-middle-nav-area"
            id="recommend-link">
            <div className="line"></div>
            <span>推薦連結</span>
          </div>
          <div
            className="header-middle-nav-area"
            id="about">
            <div className="line"></div>
            <span>關於我們</span>
          </div>
          {/* Not logined show line login's Link */}
          {!loginState.loginState && (
            <Link
              target=""
              className="login-area"
              href={loginURL}>
              <span className="login-content">LINE登入</span>
              <div className="line-login-icon-area">
                <Image
                  className="icon"
                  alt="line-login-button"
                  src={lineIcon}
                  width={1200}></Image>
              </div>
            </Link>
          )}
        </div>
        <div className="header-right">
          {/* user shot */}
          {loginState.loginState === true && (
            <Link href={ProfilePageURL}>
              <div className="member-img">
                <Image
                  className="shot"
                  src={userInfo && userInfo.data.userinfo.pictureUrl}
                  alt="user's shot"
                  width={100}
                  height={100}
                />
              </div>
            </Link>
          )}
          {/* Sign out */}
          {loginState.loginState === true && (
            <div
              className="sign-out-area btn-area"
              onClick={signOut}>
              <button className="sign-out-btn">登出</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
