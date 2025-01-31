import AddCourse from '../../pages/profiles/addCourse'
import MyCourse from '../../pages/profiles/myCourse'
import RegisterCourse from '../../pages/profiles/registerCourse'
import StudentCourse from '../../pages/profiles/studentCourse'
import Image from 'next/image'
import menuIcon from '../../public/imgs/menu.png'
import { useEffect, useState } from 'react'
export default function TeacherLayout() {
  const [currentPage, setCurrentPage] = useState('MyCourse')
  const [menu, setMenu] = useState('')
  useEffect(() => {
    const menu = document.querySelector('.teacherLayout-nav')
    menu.style.marginLeft = '-120px'
    setMenu(menu)
  }, [menu])
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
    StudentCourse: {
      component: <StudentCourse />,
      className: 'student-course-container',
    },
  }
  const { component, className } = routes[currentPage]
  const showMenu = () => {
    if (menu.style.marginLeft === '-120px') {
      menu.style.marginLeft = '0'
    } else {
      menu.style.marginLeft = '-120px'
    }
  }
  return (
    <div className="teacherLayout-main">
      <div className="teacherLayout-container">
        <nav className="teacherLayout-nav">
          <ul className="options">
            <li onClick={() => setCurrentPage('MyCourse')}>我的課程</li>
            <li onClick={() => setCurrentPage('AddCourse')}>新增課程</li>
            <li onClick={() => setCurrentPage('RegisterCourse')}>註冊課程</li>
            <li onClick={() => setCurrentPage('StudentCourse')}>學生課程</li>
          </ul>
          <button
            onClick={showMenu}
            className="left-menu">
            <Image
              src={menuIcon}
              alt="menu button"
              width={30}></Image>
          </button>
        </nav>
        <div className={className}>{component}</div>
      </div>
    </div>
  )
}
