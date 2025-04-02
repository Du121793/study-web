// 組件庫
import Image from 'next/image'
import Link from 'next/link'
// public
import lineIcon from '../../public/imgs/line.png'
import logo from '../../public/imgs/logo.jpg'
import { useEffect, useState } from 'react'

export default function Header({ loginState, user_line_shot }) {
  // env
  const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP
  const serverIp = process.env.NEXT_PUBLIC_SERVER_IP
  // 路由參數
  const loginURL = `${serverIp}/auth/line`
  const HomePageURL = clientIp
  const ProfilePageURL = `${clientIp}/profiles/Profile`

  const [userShot, setUserShot] = useState(null)

  // 登出 刪除token
  const signOut = () => {
    if (sessionStorage.getItem('user_lineID')) {
      sessionStorage.removeItem('user_lineID')
    }
    if (sessionStorage.getItem('user_role')) {
      sessionStorage.removeItem('user_role')
    }
    if (sessionStorage.getItem('user_id')) {
      sessionStorage.removeItem('user_id')
    }
    if (sessionStorage.getItem('user_line_shot')) {
      sessionStorage.removeItem('user_line_shot')
    }
    localStorage.removeItem('token')
    window.location.replace('/')
  }

  useEffect(() => {
    const user_line_shot_temp = sessionStorage.getItem('user_line_shot')
    setUserShot(user_line_shot_temp)
  }, [])

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
          {!loginState && (
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
          {loginState === true && (
            <Link href={ProfilePageURL}>
              <div className="member-img">
                <Image
                  loading="lazy"
                  className="shot"
                  // 由於userShot在index頁面會來不及加載，因此會改為使用index傳過來的user_line_shot
                  src={userShot !== null ? userShot : user_line_shot}
                  alt="user's shot"
                  width={100}
                  height={100}
                />
              </div>
            </Link>
          )}
          {/* Sign out */}
          {loginState === true && (
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
