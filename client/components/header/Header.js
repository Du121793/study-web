// 組件庫
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
// public
import lineIcon from '../../public/imgs/line.png'
import logoC from '../../public/imgs/logo3.png'
import menu from '../../public/imgs/menu/menu_black.png'
import closeIcon from '../../public/close/close_white.png'
// style
import style from './style.module.css'
export default function Header({ callBoardMoveToBoardFunction, loginState, user_line_shot, inIndex = '' }) {
  const router = useRouter()
  // env
  const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP
  const serverIp = process.env.NEXT_PUBLIC_SERVER_IP
  const officialLine = 'https://line.me/R/ti/p/@910fvcei'
  const GoogleLocation = 'https://maps.app.goo.gl/KzkExpAGoPxBggUL6'
  // 路由參數
  const loginURL = `${serverIp}/auth/line`
  const HomePageURL = clientIp
  const profilePage = `${clientIp}/profile`
  // 使用者頭像
  const [userShot, setUserShot] = useState(null)
  // 用於點擊link
  const profileLinkRef = useRef(null)
  const LoginLinkRef = useRef(null)
  // list切換
  const openMenuBtnRef = useRef(null)
  const [listWidth, setListWidht] = useState(0)
  const closeArea = useRef(null)

  // RWD:開關左邊選項清單，手機畫面
  const openList = () => {
    openMenuBtnRef.current.style.opacity = '0'
    setListWidht('100%')
  }
  const closeList = () => {
    openMenuBtnRef.current.style.opacity = '1'
    setListWidht(0)
  }

  // 變換顏色
  const clickSwitchColor = (element) => {
    const preColor = element.style.backgroundColor
    element.style.backgroundColor = '#c9c9c9da'
    setTimeout(() => {
      element.style.backgroundColor = preColor
    }, 160)
  }

  // session
  useEffect(() => {
    const user_line_shot_temp = localStorage.getItem('user_line_shot')
    if (user_line_shot_temp) {
      setUserShot(user_line_shot_temp)
    }
  }, [])

  // Layout
  return (
    <div className={style['header-container']}>
      <div className={style['header-main']}>
        {/* 菜單清單 */}
        <div
          className={style['option-list']}
          style={{ width: listWidth }}>
          <div
            className={style['close-menu-btn-area']}
            ref={closeArea}
            onClick={(e) => {
              clickSwitchColor(e.target)
              closeList()
            }}>
            <Image
              src={closeIcon}
              className={style['menu-icon']}
              alt="menu button"
              onClick={(e) => {
                e.stopPropagation()
                closeArea.current.click()
              }}
              width={0}
              height={0}></Image>
          </div>
          {loginState ? (
            <Link
              href={{
                pathname: profilePage,
                query: {
                  fc: 'public',
                  to: 'profile',
                },
              }}>
              {(user_line_shot || userShot) && (
                <Image
                  loading="lazy"
                  className={style.avatar}
                  alt="user avatar"
                  // 由於userShot在index頁面會來不及加載，因此會改為使用index傳過來的user_line_shot
                  src={user_line_shot ? user_line_shot : userShot}
                  width={1}
                  height={1}
                />
              )}
            </Link>
          ) : (
            <Link
              className={`${style.content} ${style['login-btn']}`}
              href={loginURL}>
              LINE登陸
            </Link>
          )}
          <div
            className={style.content}
            onClick={() => {
              if (router.pathname === '/') {
                callBoardMoveToBoardFunction()
                closeList()
              } else {
                localStorage.setItem('homePageScrollToNews', 1)
                router.push('/')
                closeList()
              }
            }}>
            最新消息
          </div>
          <Link
            href={{
              pathname: profilePage,
              query: {
                fc: 'public',
                to: 'myCourse',
              },
            }}>
            <div
              className={style.content}
              onClick={() => {
                const isLogin = localStorage.getItem('token')
                if (isLogin) {
                  profileLinkRef.current.click()
                } else {
                  LoginLinkRef.current.click()
                }
              }}>
              我的課程
            </div>
          </Link>

          <Link
            className={style.content}
            href={GoogleLocation}
            target="_blank">
            地圖位置
          </Link>
          <Link
            className={style.content}
            href={officialLine}
            target="_blank">
            聯絡我們
          </Link>
        </div>
        {/* 廠商Logo */}
        <div className={style['logo-container']}>
          <Link href={HomePageURL}>
            <Image
              className={style['logo-img']}
              alt="logo,s image"
              src={logoC}
              width={0}
              height={0}></Image>
          </Link>
        </div>
        <div className={style['header-middle']}>
          <div
            className={style['header-middle-nav-area']}
            id="newest"
            onClick={() => {
              if (router.pathname === '/') {
                callBoardMoveToBoardFunction()
              } else {
                localStorage.setItem('homePageScrollToNews', 1)
                router.push('/')
              }
            }}>
            <div className={style.line}></div>
            <span>最新消息</span>
          </div>
          <Link
            ref={profileLinkRef}
            style={{ display: 'none' }}
            href={{ pathname: profilePage, query: { fc: 'public', to: 'myCourse' } }}></Link>
          <Link
            ref={LoginLinkRef}
            style={{ display: 'none' }}
            href={loginURL}></Link>
          <Link
            href={GoogleLocation}
            className={style['header-middle-nav-area']}
            id="recommend-link"
            target="_blank">
            <div className={style.line}></div>
            <span>地圖位置</span>
          </Link>
          <Link
            className={style['header-middle-nav-area']}
            id="about"
            href={officialLine}
            target="_blank">
            <div className={style.line}></div>
            <span>聯絡我們</span>
          </Link>
          <Link
            href={{
              pathname: profilePage,
              query: {
                fc: 'public',
                to: 'myCourse',
              },
            }}
            className={style['header-middle-nav-area']}
            id="course-info"
            onClick={() => {
              const isLogin = localStorage.getItem('token')
              if (isLogin) {
                profileLinkRef.current.click()
              } else {
                LoginLinkRef.current.click()
              }
            }}>
            <div className={style.line}></div>
            <span>我的課程</span>
          </Link>
          {/* Not logined show line login's Link */}
        </div>

        <div className={style['header-right']}>
          {/* 用戶頭像 */}
          {loginState === true && (
            <div className={style['member-img']}>
              {(user_line_shot || userShot) && (
                <Link
                  href={{
                    pathname: profilePage,
                    query: {
                      fc: 'public',
                      to: 'profile',
                    },
                  }}>
                  <Image
                    loading="lazy"
                    className={style.shot}
                    // 由於userShot在index頁面會來不及加載，因此會改為使用index傳過來的user_line_shot
                    src={user_line_shot ? user_line_shot : userShot}
                    alt="user's shot"
                    style={{ cursor: 'pointer' }}
                    width={100}
                    height={100}
                  />
                </Link>
              )}
            </div>
          )}
          {/* 登陸按鈕 */}
          {!loginState && (
            <Link
              className={style['login-area']}
              href={loginURL}>
              <div className={style['line-login-icon-area']}>
                <Image
                  className={style.icon}
                  alt="line-login-button"
                  src={lineIcon}
                  width={100}></Image>
              </div>
              <span className={style['login-content']}>LINE登入</span>
            </Link>
          )}
        </div>

        {/* 菜單按鈕 */}
        {(inIndex === 'public' || inIndex === 'course') && (
          <div
            className={style['setting-btn']}
            ref={openMenuBtnRef}
            style={{ pointerEvents: listWidth === 0 ? 'all' : 'none' }}
            onClick={() => {
              openList()
            }}>
            <Image
              src={menu}
              className={style['menu-icon']}
              alt="menu button"
              width={0}
              height={0}></Image>
          </div>
        )}
        {/* 用戶頭像 */}
        {inIndex === 'course' && user_line_shot && (
          <div className={style['user-avatar']}>
            <Link
              href={{
                pathname: profilePage,
                query: {
                  fc: 'public',
                  to: 'myCourse',
                },
              }}>
              <Image
                className={style['course-image']}
                src={user_line_shot ? user_line_shot : userShot}
                alt="user avatar"
                width={1}
                height={1}></Image>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
