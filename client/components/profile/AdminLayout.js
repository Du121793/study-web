// 引用 page/profiles 下的組件
import MyCourse from '../../pages/profiles/MyCourse'
import UserProfile from '../../pages/profiles/UserProfile'
import PreRegister from '../../pages/profiles/PreRegister'
import RemoveUsers from '../../pages/profiles/RemoveUsers'
import EditCourse from '../../pages/profiles/EditCourse'
import EditMembers from '../../pages/profiles/EditMembers'

// 引用組件庫
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

// 引用 public
import menuIcon from '../../public/imgs/menu.png'
import closeBtn from '../../public/profile/close.png'
import myCourseIcon from '../../public/profile/navIcons/myCourse.png'
import profileIcon from '../../public/profile/navIcons/profile.png'
import rightArrow from '../../public/profile/rightArrow.png'
import dotIcon from '../../public/profile/navIcons/dotIcon.png'

// 引用 method
import { useUserToken } from '../../method/useUserToken'
import userService from '../../method/userService'

// 匯入 CSS/SCSS Modules (如果有)
// import styles from '../../styles/course/methods/qaMsgUpload.module.css'

export default function AdminLayout({ user_role }) {
  // env
  const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP
  // nav 的 route (課程前綴網址)
  const curserBaseUrl = `${clientIp}/courses/Course`
  // token
  const token = useUserToken()

  // 取得使用者已註冊的課程
  const [getCourses, setGetCourses] = useState([])
  
  // -----------------------------------------------------------------
  // 1. 將 navSelecter 改為 [功能分類, 頁面名稱]
  //    預設帶出 MyCourse 頁面 => ["publicFunction", "MyCourse"]
  // -----------------------------------------------------------------
  const [navSelecter, setNavSelecter] = useState(['publicFunction', 'MyCourse'])

  // 給子組件刷新其他子組件用
  const [refresh, setRefresh] = useState(0)
  const onRefresh = () => {
    setRefresh((prev) => prev + 1)
  }

  // 2. 重構 routes
  const routes = {
    publicFunction: {
      MyCourse: {
        component: (
          <MyCourse
            refresh={refresh}
            user_role={user_role}
          />
        ),
        className: 'right-item',
      },
      UserProfile: {
        component: <UserProfile />,
        className: 'right-item',
      },
    },
    teacherFunction: {
      EditCourse: {
        component: (
          <EditCourse
            onRefresh={onRefresh}
            user_role={user_role}
          />
        ),
        className: 'right-item',
      },
      EditMembers: {
        component: <EditMembers user_role={user_role} />,
        className: 'right-item',
      },
    },
    adminFunction: {
      PreRegister: {
        component: <PreRegister user_role={user_role} />,
        className: 'right-item',
      },
      RemoveUsers: {
        component: <RemoveUsers user_role={user_role} />,
        className: 'right-item',
      },
    },
  }

  // 用於切換nav list的下拉顯示
  const [myCourseNavListSwitcher, setMyCourseNavListSwitcher] = useState('')
  const [teacherFuntionNavListSwitcher, setTeacherFuntionNavListSwitcher] = useState('')
  const [adminFuntionNavListSwitcher, setAdminFuntionNavListSwitcher] = useState('')

  // 選單的 leftMargin
  const [listLeftMargin, setListLeftMargin] = useState('0')
  const [listSwitchBtnWidth, setListSwitchBtnWidth] = useState('0')
  const [listSwitchBtnBorder, setListSwitchBtnBorder] = useState('none')
  const [listHeight, setListHeight] = useState('0')
  const rightItemtRef = useRef(null)

  // 左邊選單顯示/隱藏
  const showLeftNav = () => {
    if (listLeftMargin === '-242px') {
      setListLeftMargin('0')
      setListSwitchBtnWidth('0')
      setListSwitchBtnBorder('none')
    }
  }
  const hideLeftNav = () => {
    if (listLeftMargin === '0') {
      setListLeftMargin('-242px')
      setListSwitchBtnWidth('60px')
      setListSwitchBtnBorder('1px solid #ccc')
    }
  }

  // 控制 nav list 下拉/收合
  const switchNavList = (target) => {
    // 我的課程
    if (target.id === 'my-course-list-btn') {
      target.style.transform = target.style.transform === 'rotate(90deg)' ? 'rotate(0)' : 'rotate(90deg)'
      setMyCourseNavListSwitcher((prev) => (prev === '' ? '0' : ''))
    }
    // 教師功能
    if (target.id === 'teacher-function-list-btn') {
      target.style.transform = target.style.transform === 'rotate(90deg)' ? 'rotate(0)' : 'rotate(90deg)'
      setTeacherFuntionNavListSwitcher((prev) => (prev === '' ? '0' : ''))
    }
    // 管理員功能
    if (target.id === 'admin-function-list-btn') {
      target.style.transform = target.style.transform === 'rotate(90deg)' ? 'rotate(0)' : 'rotate(90deg)'
      setAdminFuntionNavListSwitcher((prev) => (prev === '' ? '0' : ''))
    }
  }

  // nav 高亮
  const switchNavActive = (target) => {
    // 如果點到「開關箭頭」就不切換 active
    if (target.id === 'my-course-list-btn') return
    if (target.id === 'teacher-function-list-btn') return
    if (target.id === 'admin-function-list-btn') return

    initNavActive()
    target.classList.add('active')
  }
  
  const initNavActive = () => {
    const findActive = document.querySelector('.active')
    if (findActive) {
      findActive.classList.remove('active')
    }
  }

  // 請求已註冊課程
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
  }, [token, refresh])

  // 從 routes 中拿到當前要顯示的 component 與 className
  const { component, className } = routes[navSelecter[0]][navSelecter[1]]

  // 動態計算右側內容高度，以改變左側 nav 的 height
  useEffect(() => {
    setTimeout(() => {
      setListHeight(rightItemtRef.current.scrollHeight)
    }, 100)
  }, [component])

  return (
    <div className="Layout-main">
      <div className="Layout-container">
        {/* 左側 nav */}
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
                  alt="close nav s button image"
                />
              </button>

              {/* 我的課程（publicFunction -> MyCourse） */}
              <li className="nav">
                <div className="nav-container">
                  <div
                    className="nav-option-header active"
                    onClick={(e) => {
                      switchNavActive(e.target)
                      // 切換到 publicFunction -> MyCourse
                      setNavSelecter(['publicFunction', 'MyCourse'])
                    }}>
                    {/* 標題左邊的 icon */}
                    <div
                      className="title-icon"
                      style={{ pointerEvents: 'none' }}>
                      <Image
                        alt="nav,s myCourse Icon"
                        src={myCourseIcon}
                        width={24}
                        height={24}
                      />
                    </div>
                    {/* 標題文字 */}
                    <span
                      className="title"
                      style={{ pointerEvents: 'none' }}>
                      我的課程
                    </span>
                  </div>

                  {/* 開關 list 的按鈕 */}
                  <Image
                    className="list-switch-btn"
                    id="my-course-list-btn"
                    style={{ transform: 'rotate(90deg)' }}
                    onClick={(e) => switchNavList(e.target)}
                    src={rightArrow}
                    width={24}
                    height={24}
                    alt="open my courses button icon"
                  />
                </div>
                {/* 下拉的課程列表 */}
                <div
                  style={{ height: myCourseNavListSwitcher }}
                  className="nav-options">
                  {getCourses.map((course) => (
                    <li
                      key={course._id}
                      className="option">
                      <Image
                        className="turn-right-icon"
                        src={dotIcon}
                        alt="nav option icon"
                      />
                      <Link
                        className="link"
                        href={`${curserBaseUrl}?courseName=${course.name}&courseId=${course._id}`}>
                        {course.name}
                      </Link>
                    </li>
                  ))}
                </div>
              </li>

              {/* 教師功能（teacherFunction） */}
              <li className="nav">
                <div className="nav-container">
                  <div className="nav-option-header">
                    <div className="title-icon">
                      <Image
                        alt="nav,s myCourse Icon"
                        src={myCourseIcon}
                        width={24}
                        height={24}
                      />
                    </div>
                    {/* 點擊標題文字時也能展開/收起 */}
                    <span
                      className="title"
                      onClick={() => {
                        document.getElementById('teacher-function-list-btn').click()
                      }}>
                      教師功能
                    </span>
                  </div>
                  <Image
                    style={{ transform: 'rotate(90deg)' }}
                    className="list-switch-btn"
                    id="teacher-function-list-btn"
                    onClick={(e) => switchNavList(e.target)}
                    src={rightArrow}
                    width={24}
                    height={24}
                    alt="open teacher function button icon"
                  />
                </div>

                {/* 教師功能下拉選單 */}
                <div
                  style={{ height: teacherFuntionNavListSwitcher }}
                  className="nav-options">
                  {/* EditCourse */}
                  <div
                    className="option"
                    onClick={(e) => {
                      setNavSelecter(['teacherFunction', 'EditCourse'])
                      switchNavActive(e.target)
                    }}>
                    <Image
                      className="turn-right-icon"
                      src={dotIcon}
                      alt="icon"
                    />
                    編輯課程
                  </div>

                  {/* EditMembers */}
                  <div
                    className="option"
                    onClick={(e) => {
                      setNavSelecter(['teacherFunction', 'EditMembers'])
                      switchNavActive(e.target)
                    }}>
                    <Image
                      className="turn-right-icon"
                      src={dotIcon}
                      alt="icon"
                    />
                    成員編輯
                  </div>
                </div>
              </li>

              {/* 管理員功能（adminFunction） */}
              <li className="nav">
                <div className="nav-container">
                  <div className="title-icon">
                    <Image
                      alt="nav,s myCourse Icon"
                      src={myCourseIcon}
                      width={24}
                      height={24}
                    />
                  </div>
                  <span
                    className="title"
                    onClick={() => {
                      document.getElementById('admin-function-list-btn').click()
                    }}>
                    管理員功能
                  </span>
                  <Image
                    id="admin-function-list-btn"
                    className="list-switch-btn"
                    style={{ transform: 'rotate(90deg)' }}
                    onClick={(e) => switchNavList(e.target)}
                    src={rightArrow}
                    width={24}
                    height={24}
                    alt="open admin function button icon"
                  />
                </div>
                <div
                  style={{ height: adminFuntionNavListSwitcher }}
                  className="nav-options">
                  {/* PreRegister */}
                  <div
                    className="option"
                    onClick={(e) => {
                      setNavSelecter(['adminFunction', 'PreRegister'])
                      switchNavActive(e.target)
                    }}>
                    <Image
                      className="turn-right-icon"
                      src={dotIcon}
                      alt="icon"
                    />
                    預註冊使用者
                  </div>
                  {/* RemoveUsers */}
                  <div
                    className="option"
                    onClick={(e) => {
                      setNavSelecter(['adminFunction', 'RemoveUsers'])
                      switchNavActive(e.target)
                    }}>
                    <Image
                      className="turn-right-icon"
                      src={dotIcon}
                      alt="icon"
                    />
                    移除成員
                  </div>
                </div>
              </li>

              {/* 個人資訊 (publicFunction -> UserProfile) */}
              <li className="nav">
                <div className="nav-container">
                  <div className="icon">
                    <Image
                      alt="nav,s profile Icon"
                      src={profileIcon}
                      width={24}
                      height={24}
                    />
                  </div>
                  <span
                    onClick={(e) => {
                      switchNavActive(e.target)
                      setNavSelecter(['publicFunction', 'UserProfile'])
                    }}
                    className="title">
                    個人資訊
                  </span>
                </div>
              </li>
            </div>
          </ul>

          {/* 左側選單縮起後，顯示的「開啟選單」按鈕 */}
          <button
            onClick={showLeftNav}
            className="left-menu"
            style={{ opacity: '1', width: listSwitchBtnWidth, border: listSwitchBtnBorder }}>
            <Image
              src={menuIcon}
              alt="menu button"
              width={30}
            />
          </button>
        </nav>

        {/* 右側內容區 */}
        <div
          ref={rightItemtRef}
          className={className}>
          {component}
        </div>
      </div>
    </div>
  )
}
