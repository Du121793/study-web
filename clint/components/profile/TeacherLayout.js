import AddCourse from '../../pages/profile/addCourse'
import MyCourse from '../../pages/profile/myCourse'
import RegisterCourse from '../../pages/profile/registerCourse'
import StudentCourse from '../../pages/profile/studentCourse'
import { useEffect, useState } from 'react'
export default function TeacherLayout() {
  const [currentPage, setCurrentPage] = useState('MyCourse')
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
  return (
    <div className="teacherLayout-main">
      <div className="container">
        <nav className="teacherLayout-nav">
          <ul>
            <li onClick={() => setCurrentPage('MyCourse')}>我的課程</li>
            <li onClick={() => setCurrentPage('AddCourse')}>新增課程</li>
            <li onClick={() => setCurrentPage('RegisterCourse')}>註冊課程</li>
            <li onClick={() => setCurrentPage('StudentCourse')}>學生課程</li>
          </ul>
        </nav>
        <div className={className}>{component}</div>
      </div>
    </div>
  )
}
