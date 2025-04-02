// 引用page/profiles下的組件
import MyCourse from '../../pages/profiles/MyCourse'
import UserProfile from '../../pages/profiles/UserProfile'
// 引用組件庫
import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'
// 引用public
import menuIcon from '../../public/imgs/menu.png'
import closeBtn from '../../public/profile/close.png'
import myCourseIcon from '../../public/profile/navIcons/myCourse.png'
import profileIcon from '../../public/profile/navIcons/profile.png'
import rightArrow from '../../public/profile/rightArrow.png'
import dotIcon from '../../public/profile/navIcons/dotIcon.png'
// 引用method
import { useUserToken } from '../../method/useUserToken'
import userService from '../../method/userService'
import Link from 'next/link'

export default function AdminLayout({ user_role }) {
  // env
  const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP
  // nav的route
  const curserBaseUrl = `${clientIp}/courses/Course`
  // token
  const token = useUserToken()
  // 右方組件
  const [navSelecter, setNavSelecter] = useState(['MyCourse', 'index'])
  // 存取獲得到的使用者以註冊課程
  const [getCourses, setGetCourses] = useState([])
  // 用於切換nav list的下拉顯示
  const [myCourseNavListSwitcher, setMyCourseNavListSwitcher] = useState('')
  // 選單transition參數
  // 選單的leftMargin
  const [listLeftMargin, setListLeftMargin] = useState('0')
  const [listHeight, setListHeight] = useState('0')
  const rightItemtRef = useRef(null)
  // 選單按鈕的transition參數
  const [listSwitchBtnWidth, setListSwitchBtnWidth] = useState('0')
  const [listSwitchBtnBorder, setListSwitchBtnBorder] = useState('none')

  // 給子組件刷新其他子組件用
  const [hasUpdate, setHasUpdate] = useState(false)
  const [refresh, setRefresh] = useState(0)

  // 用於切換組件
  let routes = {
    // 我的課程
    MyCourse: {
      index: {
        component: (
          <MyCourse
            refresh={refresh}
            user_role={user_role}
          />
        ),
        className: 'right-item',
      },
      className: '',
    },
    // 個人資料
    UserProfile: {
      index: {
        component: <UserProfile user_role={user_role} />,
        className: 'right-item',
      },
      className: '',
    },
  }

  // 開啟左邊選單
  const showLeftNav = () => {
    if (listLeftMargin === '-242px') {
      setListLeftMargin('0')
      setListSwitchBtnWidth('0')
      setListSwitchBtnBorder('none')
    }
  }

  // 關閉左邊選單
  const hideLeftNav = () => {
    if (listLeftMargin === '0') {
      setListLeftMargin('-242px')
      setListSwitchBtnWidth('60px')
      setListSwitchBtnBorder('1px solid #ccc')
    }
  }

  // 控制左邊選單的list開關
  const switchNavList = (e) => {
    // 我的課程
    if (e.id === 'my-course-list-btn') {
      if (e.style.transform === 'rotate(90deg)') {
        e.style.transform = 'rotate(0)'
      } else {
        e.style.transform = 'rotate(90deg)'
      }
      if (myCourseNavListSwitcher !== '') {
        setMyCourseNavListSwitcher('')
      } else if (myCourseNavListSwitcher !== '0') {
        setMyCourseNavListSwitcher('0')
      }
    }
  }

  // 切換nav的高亮
  const switchNavActive = (e) => {
    // 標題右邊的箭頭開關
    if (e.id === 'my-course-list-btn') return
    initNavActive()
    e.classList.add('active')
  }

  // 初始化nav的高亮
  const initNavActive = () => {
    let findActive = document.querySelector('.active')
    if (findActive) {
      findActive.classList.remove('active')
    }
  }

  // 獲得使用者已註冊的課程
  useEffect(() => {
    if (token) {
      ;(async function () {
        const res = await userService.getUserRegistedCourses(token)
        setGetCourses(
          res.data.map((item) => {
            return { name: item.courseName, _id: item._id }
          })
        )
      })()
    }
  }, [token])

  const { component, className } = routes[navSelecter[0]][navSelecter[1]]

  useEffect(() => {
    setTimeout(() => {
      console.log(rightItemtRef.current.scrollHeight)
      setListHeight(rightItemtRef.current.scrollHeight)
    }, 100)
  }, [component, className])

  return (
    <div className="Layout-main">
      <div className="Layout-container">
        {/* left nav area */}
        <nav
          className="Layout-left-nav"
          style={{ marginLeft: listLeftMargin, height: listHeight }}>
          <ul className="options">
            <div className="innerElement">
              {/* 關閉選單按鈕 */}
              <button
                className="close-nav-left"
                onClick={hideLeftNav}>
                <Image
                  className="close-nav-btn"
                  src={closeBtn}
                  alt="close nav s button image"></Image>
              </button>
              {/* 我的課程*/}
              <li className="nav">
                <div className="nav-container">
                  <div
                    className="nav-option-header active"
                    onClick={(e) => {
                      switchNavActive(e.target)
                      setNavSelecter(['MyCourse', 'index'])
                    }}>
                    {/* 標題左邊的icon */}
                    <div
                      className="title-icon"
                      style={{ pointerEvents: 'none' }}>
                      <Image
                        alt="nav,s myCourse Icon"
                        src={myCourseIcon}
                        width={24}
                        height={24}></Image>
                    </div>
                    {/* 標題文字 */}
                    <span
                      className="title"
                      style={{ pointerEvents: 'none' }}>
                      我的課程
                    </span>
                  </div>

                  {/* 開關list的按鈕 */}
                  <Image
                    className="list-switch-btn"
                    id="my-course-list-btn"
                    style={{ transform: 'rotate(90deg)' }}
                    onClick={(e) => {
                      switchNavList(e.target)
                    }}
                    src={rightArrow}
                    width={24}
                    height={24}
                    alt="open my courses button icon"></Image>
                </div>
                {/* list */}
                <div
                  style={{ height: myCourseNavListSwitcher }}
                  className="nav-options">
                  {getCourses.map((course) => {
                    return (
                      <li
                        key={course.id}
                        className="option">
                        <Image
                          className="turn-right-icon"
                          src={dotIcon}
                          alt="nav option icon"></Image>
                        <Link
                          className="link"
                          href={curserBaseUrl + `?courseName=${course.name}&courseId=${course._id}`}>
                          {course.name}
                        </Link>
                      </li>
                    )
                  })}
                </div>
              </li>

              {/* 個人資訊 標題*/}
              <li className="nav">
                <div className="nav-container">
                  <div className="icon">
                    <Image
                      alt="nav,s profile Icon"
                      src={profileIcon}
                      width={24}
                      height={24}></Image>
                  </div>
                  <span
                    onClick={() => setNavSelecter(['UserProfile', 'index'])}
                    className="title">
                    個人資訊
                  </span>
                </div>
              </li>
            </div>
          </ul>
          {/* 開啟選單的按鈕 */}
          <button
            onClick={showLeftNav}
            className="left-menu"
            style={{ opacity: '1', width: listSwitchBtnWidth, border: listSwitchBtnBorder }}>
            <Image
              src={menuIcon}
              alt="menu button"
              width={30}></Image>
          </button>
        </nav>
        {/* middle cursor info area */}
        <div
          ref={rightItemtRef}
          className={className}>
          {component}
        </div>
      </div>
    </div>
  )
}
