// 引用page/profiles下的組件
import DeleteCourse from '../../pages/profiles/deleteCourse'
import AddCourse from '../../pages/profiles/addCourse'
import MyCourse from '../../pages/profiles/myCourse'
import RegisterCourse from '../../pages/profiles/registerCourse'
import UserProfile from '../../pages/profiles/userProfile'
import PreRegister from '../../pages/profiles/preRegister'
import RemoveFromCourse from '../../pages/profiles/removeFromCourse'
// 引用組件庫
import Image from 'next/image'
import { useEffect, useState } from 'react'
// 引用public
import menuIcon from '../../public/imgs/menu.png'
import closeBtn from '../../public/profile/close.png'
import myCourseIcon from '../../public/profile/navIcons/myCourse.png'
import profileIcon from '../../public/profile/navIcons/profile.png'
import turnRightItem from '../../public/profile/navIcons/turnRightArrow.png'
import rightArrow from '../../public/profile/rightArrow.png'
// 引用token
import { useUserToken } from '../../pages/methods/service/useUserToken'
import userService from '../../pages/methods/service/userService'
import Link from 'next/link'

export default function TeacherLayout() {
  const [navSelecter, setNavSelecter] = useState(['MyCourse', 'index'])
  const [menu, setMenu] = useState('')
  const [rightNav, setRightNav] = useState('')
  const [leftNavBtn, setLeftNavBtn] = useState('')
  const [getCourses, setGetCourses] = useState([])
  // 用於切換nav list的顯示
  const [myCourseNavListSwitcher, setMyCourseNavListSwitcher] = useState('0')
  const [teacherFuntionNavListSwitcher, setTeacherFuntionNavListSwitcher] = useState('0')

  const leftNavWidth = '-242px'
  const token = useUserToken()
  // nav的route
  const curserBaseUrl = 'http://localhost:3000/courses/course'

  let routes = {
    MyCourse: {
      index: {
        component: <MyCourse />,
        className: 'my-course-container',
      },
      className: '',
    },
    TeacherFunction: {
      AddCourse: {
        component: <AddCourse />,
        className: 'add-course-container',
      },
      RegisterCourse: {
        component: <RegisterCourse />,
        className: '',
      },
      DeleteCourse: {
        component: <DeleteCourse />,
        className: 'delete-course-container',
      },
      PreRegister: {
        component: <PreRegister />,
        className: '',
      },
      RemoveFromCourse: {
        component: <RemoveFromCourse />,
        className: '',
      },
      className: '',
    },
    UserProfile: {
      index: {
        component: <UserProfile />,
        className: 'user-profile-main',
      },
      className: '',
    },
  }

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

  useEffect(() => {
    const leftNavDocument = document.querySelector('.teacherLayout-left-nav')
    const leftNavSwitchBtn = document.querySelector('.left-menu')
    leftNavDocument.style.marginLeft = leftNavWidth
    leftNavSwitchBtn.style.opacity = '1'
    leftNavSwitchBtn.style.position = 'sticky'
    setMenu(leftNavDocument)
    setLeftNavBtn(leftNavSwitchBtn)
  }, [])
  const showRightNav = () => {
    if (menu.style.marginLeft === '-162px') {
      menu.style.marginLeft = '0px'
    }
  }
  const hideRightNav = () => {
    if (menu.style.marginLeft === '-162px') {
      menu.style.marginLeft = '0px'
    }
  }
  const showLeftNav = () => {
    if (menu.style.marginLeft === leftNavWidth) {
      menu.style.marginLeft = '0px'
      leftNavBtn.style.opacity = '0'
      leftNavBtn.style.cursor = 'auto'
    }
  }
  const hideLeftNav = () => {
    if (menu.style.marginLeft === '0px') {
      menu.style.marginLeft = leftNavWidth
      leftNavBtn.style.opacity = '1'
      leftNavBtn.style.cursor = 'pointer'
    }
  }
  // 控制左邊選單的list開關
  const switchNavList = (e) => {
    if (e.id === 'my-course-list-btn') {
      if (myCourseNavListSwitcher !== '') {
        setMyCourseNavListSwitcher('')
      } else if (myCourseNavListSwitcher !== '0') {
        setMyCourseNavListSwitcher('0')
      }
    }
    if (e.id === 'teacher-function-list-btn') {
      if (teacherFuntionNavListSwitcher !== '') {
        setTeacherFuntionNavListSwitcher('')
      } else if (teacherFuntionNavListSwitcher !== '0') {
        setTeacherFuntionNavListSwitcher('0')
      }
    }
  }
  const { component, className } = routes[navSelecter[0]][navSelecter[1]]
  return (
    <div className="teacherLayout-main">
      <div className="teacherLayout-container">
        {/* left nav area */}
        <nav
          className="teacherLayout-left-nav"
          style={{ marginLeft: leftNavWidth }}>
          <ul className="options">
            {/* 關閉選單按鈕 */}
            <button
              className="close-nav-left"
              onClick={hideLeftNav}>
              <Image
                className="close-nav-btn"
                src={closeBtn}
                alt="close nav s button image"></Image>
            </button>
            {/* 我的課程 標題*/}
            <li className="nav">
              <div className="nav-container">
                {/* 標題左邊的icon */}
                <div className="icon">
                  <Image
                    alt="nav,s myCourse Icon"
                    src={myCourseIcon}
                    width={24}
                    height={24}></Image>
                </div>
                {/* 標題文字 */}
                <span
                  onClick={() => setNavSelecter(['MyCourse', 'index'])}
                  className="title">
                  我的課程
                </span>
                {/* 開關list的按鈕 */}
                <Image
                  id="my-course-list-btn"
                  onClick={(e) => {
                    switchNavList(e.target)
                  }}
                  src={rightArrow}
                  width={24}
                  height={24}
                  alt="open my courses button icon"></Image>
              </div>
              <div
                style={{ height: myCourseNavListSwitcher }}
                className="nav-options">
                {getCourses.map((course) => {
                  return (
                    <li
                      key={course.id}
                      className="nav-option-li">
                      <Image
                        className="turn-right-icon"
                        src={turnRightItem}
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
            {/* 教師功能 標題*/}
            <li className="nav">
              <div className="nav-container">
                <div className="icon">
                  <Image
                    alt="nav,s myCourse Icon"
                    src={myCourseIcon}
                    width={24}
                    height={24}></Image>
                </div>
                {/* 標題文字 */}
                <span
                  className="title"
                  id="teacher-function-list-btn"
                  onClick={(e) => {
                    switchNavList(e.target)
                  }}>
                  教師功能
                </span>

                <Image
                  id="teacher-function-list-btn"
                  onClick={(e) => {
                    switchNavList(e.target)
                  }}
                  src={rightArrow}
                  width={24}
                  height={24}
                  alt="open my courses button icon"></Image>
              </div>
              <div
                style={{ height: teacherFuntionNavListSwitcher }}
                className="nav-options">
                <div
                  className="option"
                  onClick={() => setNavSelecter(['TeacherFunction', 'AddCourse'])}>
                  <Image
                    className="turn-right-icon"
                    src={turnRightItem}
                    alt="nav option icon"></Image>
                  創建新課程
                </div>
                <div
                  className="option"
                  onClick={() => setNavSelecter(['TeacherFunction', 'RegisterCourse'])}>
                  <Image
                    className="turn-right-icon"
                    src={turnRightItem}
                    alt="nav option icon"></Image>
                  加人至課程
                </div>
                <div
                  className="option"
                  onClick={() => setNavSelecter(['TeacherFunction', 'RemoveFromCourse'])}>
                  <Image
                    className="turn-right-icon"
                    src={turnRightItem}
                    alt="nav option icon"></Image>
                  移除出課程
                </div>
                <div
                  className="option"
                  onClick={() => setNavSelecter(['TeacherFunction', 'DeleteCourse'])}>
                  <Image
                    className="turn-right-icon"
                    src={turnRightItem}
                    alt="nav option icon"></Image>
                  刪除課程
                </div>
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
          </ul>
          {/* 左選單的顯示按鈕 */}
          <button
            onClick={showLeftNav}
            className="left-menu">
            <Image
              src={menuIcon}
              alt="menu button"
              width={30}></Image>
          </button>
        </nav>
        {/* middle cursor info area */}
        <div className={className}>{component}</div>
        <div className="right-nav"></div>
      </div>
    </div>
  )
}
