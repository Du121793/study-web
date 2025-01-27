import Header from '../components/profile/Header'
import StudentLayout from '../components/profile/StudentLayout'
import TeacherLayout from '../components/profile/TeacherLayout'
export default function Home(isLogined) {
  // String
  const role = 'teacher'
  isLogined = true
  return (
    <div>
      {isLogined && <Header></Header>}
      {role === 'student' && <StudentLayout></StudentLayout>}
      {role === 'teacher' && <TeacherLayout></TeacherLayout>}
    </div>
  )
}
