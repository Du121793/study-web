import AddCourse from '../../pages/profiles/addCourse'
import MyCourse from '../../pages/profiles/myCourse'
import RegisterCourse from '../../pages/profiles/registerCourse'
import UserProfile from '../../pages/profiles/userProfile'
import Image from 'next/image'
import menuIcon from '../../public/imgs/menu.png'
import closeBtn from '../../public/profile/close.png'
import { useEffect, useState } from 'react'
export default function TeacherLayout() {
  const [currentPage, setCurrentPage] = useState('MyCourse')
  const [menu, setMenu] = useState('')
  const [rightNav, setRightNav] = useState('')
  const [leftNavBtn, setLeftNavBtn] = useState('')
  const leftNavWidth = '-242px'
  const routes = {
    MyCourse: {
      component: <MyCourse />,
      className: 'my-course-container',
    },
    AddCourse: {
      component: <AddCourse />,
      className: 'add-course-container',
    },
    RegisterCourse: {
      component: <RegisterCourse />,
      className: 'register-course-container',
    },
    UserProfile: {
      component: <UserProfile />,
      className: 'user-profile-main',
    },
  }
  useEffect(() => {
    const leftNavDocument = document.querySelector('.teacherLayout-left-nav')
    const rightNavDocument = document.querySelector('.right-nav')
    const leftNavSwitchBtn = document.querySelector('.left-menu')
    leftNavDocument.style.marginLeft = leftNavWidth
    leftNavSwitchBtn.style.opacity = '1'
    setMenu(leftNavDocument)
    setRightNav(rightNavDocument)
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
  const { component, className } = routes[currentPage]
  return (
    <div className="teacherLayout-main">
      <div className="teacherLayout-container">
        {/* left nav area */}
        <nav
          className="teacherLayout-left-nav"
          style={{ marginLeft: leftNavWidth }}>
          <ul className="options">
            <button
              className="close-nav-left"
              onClick={hideLeftNav}>
              <Image
                className="close-nav-btn"
                src={closeBtn}></Image>
            </button>
            <li>
              <span
                onClick={() => setCurrentPage('MyCourse')}
                className="title">
                我的課程
              </span>
            </li>
            <li>
              <span
                onClick={() => setCurrentPage('AddCourse')}
                className="title">
                新增課程
              </span>
            </li>
            <li>
              <span
                onClick={() => setCurrentPage('RegisterCourse')}
                className="title">
                註冊課程
              </span>
            </li>
            <li>
              <span
                onClick={() => setCurrentPage('UserProfile')}
                className="title">
                個人資訊
              </span>
            </li>
          </ul>
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
