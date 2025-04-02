import { useEffect, useState, useRef } from 'react'
import { useUserToken } from '../../method/useUserToken'
import Image from 'next/image'
// methods
import userService from '../../method/userService'
import adminService from '../../method/adminService'
// public
import searchIcon from '../../public/global/search.png'
import addIcon from '../../public/global/add.png'
import editIcon from '../../public/global/edit.png'
import deleteIcon from '../../public/global/delete.png'
import complateIcon from '../../public/global/complate.png'
// 子組件
import MemberSelector from './MemberSelector'

export default function EditCourse({ onRefresh }) {
  const token = useUserToken()
  const [editStatusIndex, setEditStatusIndex] = useState(null)
  const [doubleCheck, setDoubleCheck] = useState(false)
  const [doubleCheckCourseName, setDoubleCheckCourseName] = useState('無')
  const [loading, setLoading] = useState(false)
  // 子組件參數
  const [selectedStudentId, setSelectedStudentId] = useState([])
  // 搜尋請求參數
  const [gradeInput, setGradeInput] = useState('')
  const [subjectInput, setSubjectInput] = useState('')
  const [classInput, setClassInput] = useState('')
  const [courseNameInput, setCourseNameInput] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(9999)
  // 更新課程參數
  const [editCourseName, setEditCourseName] = useState(null)
  const [editGrade, setEditGrade] = useState(null)
  const [editClass, setEditClass] = useState(null)
  const [editSubject, setEditSubject] = useState(null)
  let courseInfo = {}
  let registerInfo = {}
  const [needToDeleteCourseId, setNeedToDeleteCourseId] = useState('')
  // 獲得參數
  const [coursesInfo, setCoursesInfo] = useState(null)
  // 將成員新增到新課程，參數
  const [courses, setCourses] = useState([])
  // 是否要在新增課程時也將選擇的成員加入課程
  const [addThenRegister, setAddThenRegister] = useState(false)
  // 控制訊息
  // 控制訊息
  const [message, setMessage] = useState('無訊息')
  const [messageStatus, setMessageStatus] = useState(false)
  const [messageColor, setMessageColor] = useState('')
  // 綁定timeout，用於重計
  const messageTimer = useRef(null)
  const resetTimer = useRef(null)

  // 控制訊息
  const messageControl = (info, isSuccess) => {
    setMessage(info)
    setMessageStatus(true)
    if (isSuccess) {
      setMessageColor('rgba(195, 240, 178, 0.8)')
    } else {
      setMessageColor('rgba(240, 178, 178, 0.8)')
    }

    // 清除之前的 timer
    if (messageTimer.current) clearTimeout(messageTimer.current)
    if (resetTimer.current) clearTimeout(resetTimer.current)

    messageTimer.current = setTimeout(() => {
      setMessageStatus(false)
      resetTimer.current = setTimeout(() => {
        setMessage('無訊息')
        setMessageColor('')
      }, 200)
    }, 2000)
  }

  // 搜尋課程功能
  const searchCourse = () => {
    const data = {
      grade: gradeInput,
      subject: subjectInput,
      courseClass: classInput,
      page: page,
      pageSize: pageSize,
    }
    adminService.getCourses(token, data).then((res) => setCoursesInfo(res.data))
  }

  // 1. 新增課程
  // 2. 當addThenRegister為true，將學生註冊到新增的課程
  const addNewCourse = () => {
    if (courseNameInput !== '') {
      courseInfo = {
        grade: gradeInput.trim(),
        subject: subjectInput.trim(),
        courseClass: classInput.trim(),
        courseName: courseNameInput.trim(),
      }
      adminService.createANewCourse(token, courseInfo).then((res) => {
        let data = {
          page: page,
          pageSize: pageSize,
        }
        if (res.success && !addThenRegister) {
          onRefresh()
          messageControl(res.msg, true)
        } else {
          messageControl(res.data.msg, false)
        }
        // 如果有選擇學生，並且addThenRegister為true，
        // (有勾選是否要在新增課程時也將選擇的成員加入課程)
        if (selectedStudentId.length && addThenRegister) {
          data = {
            user_ids: selectedStudentId,
            // 將已選取的舊課程，以及新課程的都放在同一個陣列內
            course_ids: [...courses, res.data._id],
          }
          adminService.registerMember(token, data).then((res) => {
            if (res.success) {
              messageControl(`${res.msg}`, true)
              return
            } else {
              messageControl(`發生錯誤`, false)
            }
          })
        }
        // 初始化: 課程list，input欄位
        adminService.getCourses(token, data).then((res) => {
          setCoursesInfo(res.data)
          setGradeInput('')
          setSubjectInput('')
          setClassInput('')
          setCourseNameInput('')
        })
      })
    }
  }

  // 垃圾桶icon ， 刪除課程
  const deleteCourse = () => {
    if (needToDeleteCourseId !== '') {
      let data = {
        page: page,
        pageSize: pageSize,
      }
      setLoading(true)
      adminService.deleteCourse(token, needToDeleteCourseId).then((res) => {
        if (res.success) {
          onRefresh()
          messageControl('移除成功', true)
        } else {
          messageControl('移除失敗', false)
        }
        setNeedToDeleteCourseId('')
        adminService.getCourses(token, data).then((res) => {
          setLoading(false)

          setCoursesInfo(res.data)
        })
      })
    }
  }

  // 小鉛筆icon ， 編輯課程
  const editCourse = (_id, courseName, grade, subject, courseClass) => {
    const data = {
      courseId: _id,
      courseName: editCourseName ? editCourseName : courseName,
      subject: editSubject ? editSubject : subject,
      grade: editGrade ? editGrade : grade,
      courseClass: editClass ? editClass : courseClass,
    }
    adminService.editCourse(token, data).then((res) => {
      const secData = {
        page: page,
        pageSize: pageSize,
        grade: gradeInput,
        subject: subjectInput,
        courseClass: classInput,
      }
      if (res.success && !addThenRegister) {
        adminService.getCourses(token, secData).then((res) => setCoursesInfo(res.data))
        messageControl('編輯完成', true)
        onRefresh()
      } else {
        messageControl(res.data.msg, false)
      }
    })
  }

  const test = () => {
    console.log([...courses])
  }

  // 獲取課程資料，page:1, pageSize:10
  useEffect(() => {
    if (token) {
      let data = {
        page: page,
        pageSize: pageSize,
      }
      adminService.getCourses(token, data).then((res) => {
        setCoursesInfo(res.data)
      })
    }
  }, [token])

  // 當年級、科目、班級更改時也會更改課名
  useEffect(() => {
    setCourseNameInput(gradeInput + subjectInput + classInput)
  }, [gradeInput, subjectInput, classInput])

  return (
    <div className="edit-course-main">
      <div className="edit-course-function-area">
        <div
          style={{ height: messageStatus ? '20px' : '0', padding: messageStatus ? '24px' : '0', backgroundColor: messageColor }}
          className="message">
          {message}
        </div>
        {doubleCheck && (
          <div className="double-check-area">
            <div className="double-check-background">
              <div className="content">確定要刪除該課程嗎? </div>
              <div className="double-check-course-name">{doubleCheckCourseName}</div>
              <div className="btns-area">
                <div
                  className="confirm"
                  onClick={() => {
                    setDoubleCheck(false)
                    deleteCourse()
                  }}>
                  確定
                </div>
                <div
                  className="cancle"
                  onClick={() => {
                    setDoubleCheck(false)
                    setNeedToDeleteCourseId('')
                  }}>
                  取消
                </div>
              </div>
            </div>
          </div>
        )}
        {loading && (
          <div className="loading-area">
            <div className="loading"></div>
          </div>
        )}
        {/* 標題 編輯課程 */}
        <div
          className="title"
          onClick={test}>
          編輯課程
        </div>
        <div className="input-area">
          <div className="grade-title">年級:</div>
          <input
            type="text"
            className="grade-input"
            onChange={(e) => {
              setGradeInput(e.target.value)
            }}
            value={gradeInput}
          />
          <div className="subject-title">科目:</div>
          <input
            type="text"
            className="subject-input"
            onChange={(e) => {
              setSubjectInput(e.target.value)
            }}
            value={subjectInput}
          />
          <div className="class-title">班級:</div>
          <input
            type="text"
            className="class-input"
            onChange={(e) => {
              setClassInput(e.target.value)
            }}
            value={classInput}
          />
          <div className="course-name-title">課名:</div>
          <input
            style={{ pointerEvents: 'none' }}
            type="text"
            className="course-name-input"
            readOnly
            value={courseNameInput}
          />
          <Image
            onClick={searchCourse}
            className="button"
            src={searchIcon}
            alt="search button"
            width={20}
            height={20}></Image>
          <Image
            className="button"
            src={addIcon}
            onClick={() => {
              addNewCourse()
            }}
            alt="search button"
            width={20}
            height={20}></Image>
        </div>
        {/* 是否要在新增課程時也將選擇的成員加入課程 */}
        <div className="checkbox-area">
          <div>
            是否要在新增課程時也將選擇的成員加入課程
            <input
              onChange={(e) => {
                setAddThenRegister(e.target.checked)
              }}
              type="checkbox"
            />
          </div>
        </div>
        <div className="courses-info-list">
          {/* list title */}
          <div
            className="courses-info-area"
            id="title-area">
            <div className="count"></div>
            <div className="course-name">課程名稱</div>
            <div className="course-grade">年級</div>
            <div className="course-subject">科目</div>
            <div className="course-class">班級</div>
            <div className="image-area">
              <Image
                src={editIcon}
                className="image"
                alt=""
                width={24}
                height={24}></Image>
              <Image
                src={deleteIcon}
                className="image"
                alt=""
                width={24}
                height={24}></Image>
            </div>
          </div>
          {/* list info */}
          {coursesInfo &&
            coursesInfo.courses.map((item, index) => (
              <div
                className="courses-info-area"
                key={index}>
                {/* 若true，則將內部元素改為input，用於編輯 */}
                {index === editStatusIndex ? (
                  <>
                    <input
                      className="course-name-input"
                      defaultValue={item.courseName}
                      onChange={(e) => {
                        setEditCourseName(e.target.value)
                      }}
                    />
                    <input
                      className="course-grade-input"
                      defaultValue={item.grade}
                      onChange={(e) => {
                        setEditGrade(e.target.value)
                      }}
                    />
                    <input
                      className="course-subject-input"
                      defaultValue={item.subject}
                      onChange={(e) => {
                        setEditSubject(e.target.value)
                      }}
                    />
                    <input
                      className="course-class-input"
                      defaultValue={item.courseClass}
                      onChange={(e) => {
                        setEditClass(e.target.value)
                      }}
                    />
                    <div className="image-area">
                      <Image
                        src={complateIcon}
                        className="complate-course-button"
                        alt="complete course button"
                        width={24}
                        height={24}
                        onClick={() => {
                          setEditStatusIndex(null)
                          editCourse(item._id, item.courseName, item.grade, item.subject, item.courseClass)
                        }}
                      />
                      <Image
                        src={deleteIcon}
                        className="delete-course-button"
                        alt="delete course button"
                        width={24}
                        height={24}
                        onClick={() => {
                          setDoubleCheck(true)
                          setNeedToDeleteCourseId(item._id)
                        }}
                      />
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked === true) {
                            setCourses([...courses, item._id])
                          } else {
                            setCourses(
                              courses.filter((value) => {
                                return value === item._id
                              })
                            )
                          }
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="count">{index + 1}</div>
                    <div className="course-name">{item.courseName}</div>
                    <div className="course-grade">{item.grade}</div>
                    <div className="course-subject">{item.subject}</div>
                    <div className="course-class">{item.courseClass}</div>
                    <div className="image-area">
                      <Image
                        src={editIcon}
                        className="edit-course-button"
                        alt="edit course button"
                        width={24}
                        height={24}
                        onClick={() => {
                          setEditStatusIndex(index)
                        }}
                      />
                      <Image
                        src={deleteIcon}
                        className="delete-course-button"
                        alt="delete course button"
                        width={24}
                        height={24}
                        onClick={() => {
                          setDoubleCheck(true)
                          setNeedToDeleteCourseId(item._id)
                          setDoubleCheckCourseName(item.courseName)
                        }}
                      />

                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked === true) {
                            setCourses([...courses, item._id])
                          } else {
                            setCourses(
                              courses.filter((value) => {
                                return value === item._id
                              })
                            )
                          }
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
        </div>
        <MemberSelector
          selectedStudentId={selectedStudentId}
          setSelectedStudentId={setSelectedStudentId}></MemberSelector>
      </div>
    </div>
  )
}
