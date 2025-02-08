import { useEffect, useState } from 'react'
import adminService from '../methods/service/adminService'
import { useUserToken } from '../methods/service/useUserToken'
import MenberSelector from './memberSelector'
export default function registerCourse() {
  // 子組件
  const [selectedStudentId, setSelectedStudentId] = useState([])
  // 父組件
  let courseSelectOption = ''
  const [searchStudentOption, setSearchStudentOption] = useState({ username: '', phoneNumber: '', role: '', grade: '' })
  const token = useUserToken()
  // 請求參數
  const [getedCourse, setGetedCourse] = useState([])
  const [subject, setSubject] = useState('')
  const [courseName, setCourseName] = useState('')
  const [grade, setGrade] = useState('')
  const [courseClass, setCourseClass] = useState('')
  // 函式
  const registerCourse = () => {
    // 測試子組件用
    console.log(selectedStudentId)
    if (courseSelectOption) {
      console.log('成功新增')
      adminService.registerMember(token, { user_ids: selectedStudentId, course_id: courseSelectOption })
    } else {
      console.log('新增失敗')
      // adminService.getCourses(token, { subject, grade, courseClass }).then((res) => {})
    }
  }
  // useEffect
  useEffect(() => {
    if (token) {
      try {
        adminService.getCourses(token).then((res) => {
          setGetedCourse(res)
        })
      } catch (e) {
        alert(e)
      }
    }
  }, [token])
  return (
    <div className="register-cursor-main">
      <div className="search-input-area">
        <span>課程名稱:</span>
        <select
          className="select"
          onChange={(e) => {
            courseSelectOption = e.target.value
          }}
          name=""
          id="">
          <option value=""></option>
          {getedCourse && getedCourse.map((item) => <option value={item._id}>{item.courseName}</option>)}
        </select>
        <span>年級:</span>
        <input
          onChange={(e) => {
            setGrade(e.target.value)
          }}
          id="grade"
          type="text"
        />
        <span>科目:</span>
        <input
          onChange={(e) => {
            setSubject(e.target.value)
          }}
          id="grade"
          type="text"
        />
        <span>班級:</span>
        <input
          onChange={(e) => {
            setCourseClass(e.target.value)
          }}
          id="courseClass"
          type="text"
        />
        <div
          className="submit"
          onClick={registerCourse}>
          送出
        </div>
      </div>
      <MenberSelector
        selectedStudentId={selectedStudentId}
        setSelectedStudentId={setSelectedStudentId}></MenberSelector>
    </div>
  )
}
