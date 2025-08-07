import { useEffect, useState, useRef } from 'react'
import { useUserToken } from '../../../method/useUserToken'
import Image from 'next/image'
import style from './style.module.css'
// methods
import adminService from '../../../method/adminService'
//public
import dbArrowLeft from '../../../public/profile/doubleArrowLeft.png'
import dbArrowRight from '../../../public/profile/doubleArrowRight.png'
import ArrowLeft from '../../../public/profile/leftArrow.png'
import ArrowRight from '../../../public/profile/rightArrow.png'
import editIcon from '../../../public/global/edit.png'
import deleteIcon from '../../../public/global/delete.png'
import complateIcon from '../../../public/global/complate.png'
// components
import BackGround from '../components/back_ground/BackGround'
import MemberSelector from '../member_selector/MemberSelector'
import DropDown from '../../../components/dropDown/DropDown'
// global
import LoadingAnime from '../../../components/loading_anime/LoadingAnime'
import MessageAnime from '../../../components/message_anime/MessageAnime'
import userService from '../../../method/userService'
// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

export default function EditCourse() {
  // session
  const [user_id, setUser_id] = useState('')
  const [user_name, setUser_name] = useState('')
  const [courseLoading, setCourseLoading] = useState(false)
  const token = useUserToken()
  const [editStatusIndex, setEditStatusIndex] = useState(null)
  const [doubleCheck, setDoubleCheck] = useState(false)
  const [doubleCheckCourseName, setDoubleCheckCourseName] = useState('無')
  const [loading, setLoading] = useState(false)
  // 子組件參數
  const [selectedStudentId, setSelectedStudentId] = useState([])
  // post course payload
  const [gradeInput, setGradeInput] = useState('')
  const [subjectInput, setSubjectInput] = useState('')
  const [classInput, setClassInput] = useState('')
  const [courseNameInput, setCourseNameInput] = useState('')
  const [seletedTeacher, setSeletedTeacher] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPage, setTotalPage] = useState(0)
  // 更新課程參數
  const [editCourseName, setEditCourseName] = useState(null)
  const [editGrade, setEditGrade] = useState(null)
  const [editClass, setEditClass] = useState(null)
  const [editSubject, setEditSubject] = useState(null)
  let courseInfo = {}
  const [needToDeleteCourseId, setNeedToDeleteCourseId] = useState('')
  // get req
  const [coursesInfo, setCoursesInfo] = useState(null)
  const [teachers, setTeachers] = useState([])
  // register member to new course payload
  const [courses, setCourses] = useState([])
  // 是否要在新增課程時也將選擇的成員加入課程
  const [addThenRegister, setAddThenRegister] = useState(false)
  // search info
  const [searchInput, setSearchInput] = useState('')
  // 控制訊息
  const [message, setMessage] = useState(null)
  // 取得grade list
  // input的下拉式選單
  const [gradeList, setGradeList] = useState([])
  const [gradeListFlag, setGradeListFlag] = useState(false)
  const [returnValue, setReturnValue] = useState('')

  // 初始化Msg與loading
  const initMessage = () => {
    setTimeout(() => {
      setMessage('')
    }, 2000)
    setLoading(false)
  }

  // 初始化新增課程用的欄位
  const initAddInfo = () => {
    setGradeInput('')
    setSubjectInput('')
    setClassInput('')
  }
  const handleBlur = () => {
    setTimeout(() => {
      setGradeListFlag(false)
    }, 20)
  }

  // 參數:總頁數，中間頁數，從中間往左右總共要幾頁
  function getPage(total, thisPage, pageSize = 5) {
    if (total <= 0 || thisPage <= 0 || thisPage > total) {
      return []
    }

    let page = []
    if (total <= pageSize) {
      for (let i = 0; i < total; i++) {
        page.push(i + 1)
      }
      return page
    }

    const leftSize = Math.floor((pageSize - 1) / 2)
    const rightSize = pageSize - 1 - leftSize

    let start = Math.max(1, thisPage - leftSize)
    let end = Math.min(total, thisPage + rightSize)

    if (start === 1) {
      end = Math.min(total, pageSize)
      start = 1
    } else if (end === total) {
      start = Math.max(1, total - pageSize + 1)
      end = total
    }

    for (let i = start; i <= end; i++) {
      page.push(i)
    }

    return page
  }

  // 搜尋課程功能
  const searchCourse = () => {
    const data = { courseName: searchInput, page: page, pageSize: pageSize }
    setLoading(true)
    adminService.getCourses(token, data).then((res) => {
      setCoursesInfo(res.data)
      setLoading(false)
    })
  }

  // 1. 新增課程
  // 2. 當addThenRegister為true，將學生註冊到新增的課程
  const addNewCourse = () => {
    if (courseNameInput === '') {
      setMessage('資料提供不完整')
      initMessage()
      return
    }

    courseInfo = {
      grade: gradeInput.trim(),
      subject: subjectInput.trim(),
      courseClass: classInput.trim(),
      courseName: courseNameInput.trim(),
      teacherId: teachers !== '' ? seletedTeacher : undefined,
    }
    let data = {
      page: page,
      pageSize: pageSize,
    }
    setLoading(true)
    adminService
      .createANewCourse(token, courseInfo)
      .then((res) => {
        // 檢查請求成功
        if (res.success) {
          // 沒有選擇新增成員到課程
          if (!addThenRegister) {
            setMessage('新增成功')
            return
          }
          // 有選擇新增成員到課程但是沒有選擇成員
          if (selectedStudentId.length === 0 && addThenRegister) {
            setMessage('新增成功')
            return
          }
        }
        if (res?.success === false) {
          if (res?.msg === '資料提供不完整') {
            setMessage('資料提供不完整')
            console.error(res)
            initMessage()
            return
          } else if (res?.msg === '你已經有一樣名稱，科目，年級，班級的課程了') {
            setMessage(`你已經有一樣名稱，科目，年級，班級的課程了`)
            console.error(res)
            return
          } else {
            setMessage(`發生錯誤`)
            console.error(res)
            return
          }
        }
        // 檢查是否有選擇學生
        // 檢查是否勾選是否要在新增課程時也將選擇的成員加入課程
        if (selectedStudentId.length && addThenRegister) {
          setLoading(true)
          data = {
            user_ids: selectedStudentId,
            // 將已選取的舊課程，以及新課程的都放在同一個陣列內
            course_ids: [...courses, res.data._id],
          }
          adminService
            .registerMember(token, data)
            .then((res) => {
              if (res?.success) {
                setMessage('新增成功')
                return
              }
              if (res?.success === false && res?.msg === '你已經有一樣名稱，科目，年級，班級的課程了') {
                setMessage(`你已經有一樣名稱，科目，年級，班級的課程了`)
                console.error(res)
                return
              } else {
                setMessage(`發生錯誤`)
                console.error(res)
                return
              }
            })
            .catch((err) => {
              setMessage(`發生錯誤`)
              console.error(err)
            })
            .finally(() => {
              initMessage()
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
      .catch((err) => {
        console.error(err)
        setMessage('發生錯誤')
      })
      .finally(() => {
        initMessage()
        initAddInfo()
      })
  }

  // 點擊垃圾桶icon ， 刪除課程
  const deleteCourse = () => {
    if (needToDeleteCourseId !== '') {
      let data = {
        page: page,
        pageSize: pageSize,
      }
      setLoading(true)
      adminService.deleteCourse(token, needToDeleteCourseId).then((res) => {
        if (res.success) {
          setMessage('移除成功')
        } else {
          setMessage('移除失敗')
        }
        setNeedToDeleteCourseId('')
        adminService.getCourses(token, data).then((res) => {
          setLoading(false)
          setCoursesInfo(res.data)
        })
      })
    }
  }

  // 點擊小鉛筆icon，編輯課程
  const editCourse = (_id, courseName, grade, subject, courseClass) => {
    // 先編輯，在取得課程，兩次請求
    const data = {
      courseId: _id,
      courseName: editCourseName ? editCourseName : courseName,
      subject: editSubject ? editSubject : subject,
      grade: editGrade ? editGrade : grade,
      courseClass: editClass ? editClass : courseClass,
    }
    setLoading(true)
    adminService.editCourse(token, data).then((res) => {
      const secData = {
        page: page,
        pageSize: pageSize,
        grade: gradeInput,
        subject: subjectInput,
        courseClass: classInput,
      }
      if (res?.success && !addThenRegister) {
        adminService.getCourses(token, secData).then((res) => {
          setCoursesInfo(res.data)
          setLoading(false)
          setMessage('編輯完成')
        })
      } else {
        setMessage('編輯失敗')
      }
    })
  }

  useEffect(() => {
    setGradeInput(returnValue)
  }, [returnValue])

  // 當年級、科目、班級更改時也會更改課名
  useEffect(() => {
    setCourseNameInput(gradeInput + subjectInput + classInput)
  }, [gradeInput, subjectInput, classInput])

  // 獲取課程資料，老師資訊
  useEffect(() => {
    if (token) {
      let data = {
        page: page,
        pageSize: pageSize,
      }
      setLoading(true)
      new Promise((resolve, reject) => {
        adminService.getCourses(token, data).then((res) => {
          if (res.success) {
            setTotalPage(res.data.totalPage)
            setCoursesInfo(res.data)
            resolve()
          } else {
            reject()
            setMessage('發生錯誤，即將跳轉回首頁', false)
            setTimeout(() => {
              window.location(clientIp)
            }, 3000)
          }
        })
      }).then(() => {
        adminService.getMembers(token).then((res) => {
          if (res?.success) {
            let idTemp = []
            res.data.forEach((item) => {
              if (item.role === 'teacher') {
                idTemp.push(item)
              }
            })
            setTeachers(idTemp)

            setLoading(false)
          }
        })
      })
    }
    if (token) {
      userService.getGradeList(token).then((res) => {
        setGradeList(res.data.grades)
      })
    }
  }, [token, page])

  // session取得使用者資料
  useEffect(() => {
    const name = sessionStorage.getItem('user_name')
    const id = sessionStorage.getItem('user_id')
    if (name) {
      setUser_name(name)
    }
    if (id) {
      setUser_id(id)
    }
  })

  const test = () => {}

  return (
    <div className={`${style.edit_course_main}`}>
      <BackGround></BackGround>
      {loading && <LoadingAnime top={'20%'}></LoadingAnime>}
      {message && (
        <MessageAnime
          message={message}
          top="200px"
          duration={2000}
        />
      )}
      <div className={`${style.edit_course_function_area}`}>
        {doubleCheck && (
          <div className={`${style.double_check_area}`}>
            <div className={`${style.double_check_background}`}>
              <div className={style.content}>確定要刪除該課程嗎? </div>
              <div className={`${style.double_check_course_name}`}>{doubleCheckCourseName}</div>
              <div className={`${style.btns_area}`}>
                <div
                  className={style.confirm}
                  onClick={() => {
                    setDoubleCheck(false)
                    deleteCourse()
                  }}>
                  確定
                </div>
                <div
                  className={style.cancle}
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
        <div
          className={`${style['right-bottom-loading-area']}`}
          style={{ right: loading ? '8px' : '-100%' }}>
          <div className={`${style['loading']}`}></div>
        </div>
        {/* 標題 編輯課程 */}
        <div
          className={style.title}
          onClick={test}>
          編輯課程
        </div>
        <div className={style['input-area-container']}>
          <div className={`${style.input_area}`}>
            <div className={style['grade-input']}>
              <div>年級:</div>
              <div className={style['input-area']}>
                <input
                  type="text"
                  onFocus={() => {
                    setGradeListFlag(true)
                  }}
                  onBlur={() => {
                    handleBlur()
                  }}
                  onChange={(e) => {
                    setGradeListFlag(false)
                    setGradeInput(e.target.value)
                  }}
                  value={gradeInput}
                />
                {gradeListFlag && (
                  <DropDown
                    setReturnValue={setReturnValue}
                    dataList={gradeList}></DropDown>
                )}
              </div>
            </div>
            <div>科目:</div>
            <input
              type="text"
              className={`${style.subject_input}`}
              onChange={(e) => {
                setSubjectInput(e.target.value)
              }}
              value={subjectInput}
            />
            <div>班級:</div>
            <input
              type="text"
              className={`${style.class_input}`}
              onChange={(e) => {
                setClassInput(e.target.value)
              }}
              value={classInput}
            />
            <div className={style.content}>選擇老師</div>
            <select
              onChange={(e) => {
                setSeletedTeacher(e.target.value)
              }}>
              <option value={user_id}>{user_name}</option>
              {teachers &&
                teachers.length > 0 &&
                teachers.map((item, idx) => (
                  <option
                    key={idx}
                    value={item._id}>
                    {item?.userinfo?.realname}
                  </option>
                ))}
            </select>
          </div>

          <div className={`${style.input_area} ${style.course_name}`}>
            <div>課名:</div>
            <input
              type="text"
              className={`${style.course_name_input}`}
              value={courseNameInput}
              onChange={(e) => {
                setCourseNameInput(e.target.value)
              }}
            />
            <div className={`${style.btn_area}`}>
              <div
                className={`g-green-btn`}
                onClick={addNewCourse}>
                新增
              </div>
              <div
                className={`g-red-btn`}
                onClick={() => {
                  initAddInfo()
                }}>
                清空
              </div>
            </div>
          </div>

          {/* 是否要在新增課程時也將選擇的成員加入課程 */}
          <div className={`${style.checkbox_area}`}>
            <div className={style.hint}>
              是否要在新增課程時也將勾選的成員加入課程
              <input
                onChange={(e) => {
                  setAddThenRegister(e.target.checked)
                }}
                type="checkbox"
              />
            </div>
          </div>
        </div>

        {addThenRegister && (
          <MemberSelector
            gradeList={gradeList}
            selectedStudentId={selectedStudentId}
            setSelectedStudentId={setSelectedStudentId}></MemberSelector>
        )}

        <div className={`${style.courses_info_list}`}>
          <form
            className={`${style.search_area}`}
            onSubmit={(e) => {
              e.preventDefault()
              searchCourse()
            }}>
            <div className={style.content}>搜尋</div>
            <input
              className={style.input}
              type="text"
              placeholder="輸入課名"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
              }}
            />
            <button
              className={`g-blue-btn`}
              type="submit"
              onClick={() => {
                searchCourse()
              }}>
              搜尋
            </button>
            <button
              className={`g-red-btn`}
              type="button"
              onClick={() => {
                setSearchInput('')
              }}>
              清空
            </button>
          </form>
          {/* list title */}
          <div className={`${style.courses_info_area} ${style.title_area}`}>
            <div className={`${style.info_line}`}>
              <div className={style.count}></div>
              <div className={`${style.course_name} ${style.title_area}`}>課程名稱</div>
              <div className={`${style.course_grade} ${style.title_area}`}>年級</div>
              <div className={`${style.course_subject} ${style.title_area}`}>科目</div>
              <div className={`${style.course_class}`}>班級</div>
            </div>
          </div>
          {/* loading anime */}
          {courseLoading && (
            <div className={`${style.courses_info_area}`}>
              <LoadingAnime />
            </div>
          )}
          {/* list info */}
          {coursesInfo &&
            coursesInfo.courses.map((item, index) => (
              <div
                className={`${style.courses_info_area} ${style.info_area}`}
                key={index}>
                {/* 若true，則將內部元素改為input，用於編輯 */}
                {index === editStatusIndex ? (
                  <>
                    <div className={`${style.info_line}`}>
                      <input
                        className={`${style.course_name_input}`}
                        defaultValue={item.courseName}
                        onChange={(e) => {
                          setEditCourseName(e.target.value)
                        }}
                      />
                      <input
                        className={`${style.course_grade_input}`}
                        defaultValue={item.grade}
                        onChange={(e) => {
                          setEditGrade(e.target.value)
                        }}
                      />
                      <input
                        className={`${style.course_subject_input}`}
                        defaultValue={item.subject}
                        onChange={(e) => {
                          setEditSubject(e.target.value)
                        }}
                      />
                      <input
                        className={`${style.course_class_input}`}
                        defaultValue={item.courseClass}
                        onChange={(e) => {
                          setEditClass(e.target.value)
                        }}
                      />
                    </div>
                    <div className={`${style.image_area}`}>
                      <Image
                        src={complateIcon}
                        className={`${style.complate_course_button}`}
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
                        className={`${style.delete_course_button}`}
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
                        checked={courses.find((value) => value === item._id)}
                        onChange={() => {
                          if (courses.find((value) => value === item._id)) {
                            setCourses(
                              courses.filter((value) => {
                                return value === item._id
                              })
                            )
                          } else {
                            setCourses([...courses, item._id])
                          }
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`${style.info_line}`}>
                      <div className={style.count}>{index + 1}</div>
                      <div className={`${style.course_name}`}>{item.courseName}</div>
                      <div className={`${style.course_grade}`}>{item.grade}</div>
                      <div className={`${style.course_subject}`}>{item.subject}</div>
                      <div className={`${style.course_class}`}>{item.courseClass}</div>
                    </div>
                    <div className={`${style.image_area}`}>
                      <Image
                        src={editIcon}
                        className={`${style.edit_course_button}`}
                        alt="edit course button"
                        width={24}
                        height={24}
                        onClick={() => {
                          setEditStatusIndex(index)
                        }}
                      />
                      <Image
                        src={deleteIcon}
                        className={`${style.delete_course_button}`}
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
                        checked={courses.find((value) => value === item._id)}
                        onChange={() => {
                          if (courses.find((value) => value === item._id)) {
                            setCourses(
                              courses.filter((value) => {
                                return value !== item._id
                              })
                            )
                          } else {
                            setCourses([...courses, item._id])
                          }
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
          <div className={'page-switch'}>
            <Image
              alt="switch back to first page icon"
              src={dbArrowLeft}
              className={'page-switcher'}
              width={24}
              height={24}
              onClick={() => {
                setPage(1)
              }}></Image>
            <Image
              alt="switch back one page icon"
              src={ArrowLeft}
              className={'page-switcher'}
              width={24}
              height={24}
              onClick={() => {
                if (page === 1) {
                  return
                } else {
                  setPage((prop) => prop - 1)
                }
              }}></Image>
            {getPage(totalPage, page).map((item, index) => {
              if (page === item) {
                return (
                  <div
                    key={index}
                    className={'now-page active'}>
                    {item}
                  </div>
                )
              }
              return (
                <div
                  onClick={() => {
                    setPage(item)
                  }}
                  key={index}
                  className={'now-page'}>
                  {item}
                </div>
              )
            })}
            <Image
              alt="switch next to left page icon"
              src={ArrowRight}
              className={'page-switcher'}
              width={24}
              height={24}
              onClick={() => {
                if (page === totalPage) {
                  return
                } else {
                  setPage((prop) => prop + 1)
                }
              }}></Image>
            <Image
              alt="switch next one page icon"
              src={dbArrowRight}
              className={'page-switcher'}
              width={24}
              height={24}
              onClick={() => {
                setPage(totalPage)
              }}></Image>
          </div>
        </div>
      </div>
    </div>
  )
}
