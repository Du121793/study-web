// 組件庫
import Image from 'next/image'
import Link from 'next/link'
// public
import lineIcon from '../../public/imgs/line.png'
import logo from '../../public/imgs/logo.jpg'
import { useEffect, useState, useRef } from 'react'

export default function Header({ callBoardMoveToBoardFunction, loginState, user_line_shot }) {
  // env
  const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP
  const serverIp = process.env.NEXT_PUBLIC_SERVER_IP
  const officialLine = 'https://line.me/R/ti/p/@910fvcei'
  const GoogleLocation = 'https://maps.app.goo.gl/KzkExpAGoPxBggUL6'
  // 路由參數
  const loginURL = `${serverIp}/auth/line`
  const HomePageURL = clientIp
  const ProfilePageURL = `${clientIp}/profiles/Profile`

  const [loginStatus, setLoginStatus] = useState(false)
  const [userShot, setUserShot] = useState(null)

  const profileLinkRef = useRef(null)
  const LoginLinkRef = useRef(null)
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
    if (user_line_shot_temp) {
      setUserShot(user_line_shot_temp)
    }
    if (sessionStorage.getItem('user_role')) {
      setLoginStatus(true)
    }
  }, [])

  const test = () => {}

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
            id="newest"
            onClick={() => {
              callBoardMoveToBoardFunction()
            }}>
            <div className="line"></div>
            <span>最新消息</span>
          </div>
          <Link
            ref={profileLinkRef}
            style={{ display: 'none' }}
            href={ProfilePageURL}></Link>
          <Link
            ref={LoginLinkRef}
            style={{ display: 'none' }}
            href={loginURL}></Link>
          <div
            className="header-middle-nav-area"
            id="course-info"
            onClick={() => {
              const isLogin = localStorage.getItem('token')
              if (isLogin) {
                profileLinkRef.current.click()
              } else {
                LoginLinkRef.current.click()
              }
            }}>
            <div className="line"></div>
            <span>我的課程</span>
          </div>
          <Link
            href={GoogleLocation}
            className="header-middle-nav-area"
            id="recommend-link">
            <div className="line"></div>
            <span>地圖位置</span>
          </Link>
          <Link
            className="header-middle-nav-area"
            id="about"
            href={officialLine}>
            <div className="line"></div>
            <span>聯絡我們</span>
          </Link>
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
                {(user_line_shot || userShot) && (
                  <Image
                    loading="lazy"
                    className="shot"
                    // 由於userShot在index頁面會來不及加載，因此會改為使用index傳過來的user_line_shot
                    src={user_line_shot ? user_line_shot : userShot}
                    alt="user's shot"
                    width={100}
                    height={100}
                  />
                )}
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
