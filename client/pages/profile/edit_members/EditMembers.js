// 原生組件庫
import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import style from './style.module.css'
// method
import adminService from '../../../method/adminService'
import userService from '../../../method/userService'
import { useUserToken } from '../../../method/useUserToken'
//public
import dbArrowLeft from '../../../public/profile/doubleArrowLeft.png'
import dbArrowRight from '../../../public/profile/doubleArrowRight.png'
import ArrowLeft from '../../../public/profile/leftArrow.png'
import ArrowRight from '../../../public/profile/rightArrow.png'

// global
import LoadingAnime from '../../../components/loading_anime/LoadingAnime'
import MessageAnime from '../../../components/message_anime/MessageAnime'

// components
import BackGround from '../components/back_ground/BackGround'
export default function EditMembers() {
  // const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP
  const token = useUserToken()
  const [selectedStudentId, setSelectedStudentId] = useState([])
  // 控制訊息
  const [message, setMessage] = useState(null)
  // 請求參數
  const [getedCourse, setGetedCourse] = useState({ courses: [] })
  const [page, setPage] = useState(1)
  // allMemberPage
  // courseMemberPage
  // ousideMemberPage
  // search
  const [method, setMethod] = useState({
    name: 'allMemberPage',
    page: 1,
  })
  const [methodTemp, setMethodTemp] = useState('allMemberPage')
  const [pageSize, setPageSize] = useState(10)
  const [totalPage, setTotalPage] = useState(1)
  const [courseId, setCourseId] = useState('')
  // 限制多次下載用
  const [exportRequested, setExportRequested] = useState(false)
  const isExporting = useRef(false)
  // 目前成員的顯示狀態
  const [showMembersState, setShowMembersState] = useState('all')
  // 獲取資料
  const [members, setMembers] = useState([])
  const [userRole, setUserRole] = useState('')
  // 旋轉讀取
  const [loading, setLoading] = useState(false)
  // rander lock
  const [randerLock, setRanderLock] = useState(0)
  // 搜尋用 payload
  const [usernameInput, setUsernameInput] = useState('')
  const [realnameInput, setRealnameInput] = useState('')
  const [phoneNumberInput, setPhoneNumberInput] = useState('')
  const [gradeInput, setGradeInput] = useState('')
  const [role, setRole] = useState('')

  // 初始化選擇狀態
  const initSelector = () => {
    let allActive = document.querySelectorAll('.select-active')
    let allCheckBox = document.querySelectorAll('.student-checkbox')
    if (allActive) {
      Array.from(allActive).forEach((item) => {
        item.classList.remove('select-active')
      })
    }
    if (allCheckBox) {
      Array.from(allCheckBox).forEach((item) => {
        item.checked = false
      })
    }
    setSelectedStudentId([])
  }

  // 反選功能
  const unSelectAll = () => {
    const member_ids = members.map((item) => {
      return item._id
    })
    const thisPageMember = selectedStudentId.filter((item) => member_ids.includes(item))
    const different = selectedStudentId.filter((item) => !thisPageMember.includes(item))
    setSelectedStudentId(different)
  }

  // 全選功能
  const selectAll = () => {
    const member_ids = members.map((item) => {
      return item._id
    })
    let arrayTemp = Array.from(new Set([...member_ids, ...selectedStudentId]))
    setSelectedStudentId(arrayTemp)
  }

  // 按下"加入到課程"的函式，將選擇的人加入到指定課程
  const registerMemberToCourse = async () => {
    if (courseId !== '') {
      setLoading(true)
      adminService
        .registerMember(token, {
          user_ids: selectedStudentId, // 可以是陣列
          course_ids: [courseId],
        })
        .then((res) => {
          if (res.success) {
            setLoading(false)
            initSelector()
            getMembers()('加入到課程', true)
          } else {
            setLoading(false)
            setMessage('發生錯誤', false)
          }
        })
    } else {
      setLoading(false)
      setMessage('請先選擇課程', false)
    }
  }

  //  按下"移除出課程"的函式，將選擇的人加入到指定課程
  const removeRegisterCourse = () => {
    setLoading(true)
    adminService
      .unRegisterMember(token, {
        user_ids: selectedStudentId, // 可以是陣列
        course_ids: [courseId],
      })
      .then((res) => {
        if (res.success) {
          setLoading(false)
          setMessage('移除成功', true)
          getMembers()
          initSelector()
        } else {
          setLoading(false)
          setMessage('移除失敗', false)
        }
      })
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

  /* 搜尋功能 */
  const searchMembers = () => {
    let data = {
      username: usernameInput,
      realname: realnameInput,
      phoneNumber: phoneNumberInput,
      gradeInput: gradeInput,
      role: role,
    }
    setLoading(true)
    adminService.getMembers(token, data).then((res) => {
      if (res?.success) {
        const memberIds = new Set(members.map((m) => m._id))
        const common = res.data.filter((item) => memberIds.has(item._id))
        setMembers(common)
      }
      setLoading(false)
    })
  }

  // 導出成csv
  const exportCSV = (by) => {
    if (by === 'search') {
      switch (method.name) {
        case 'allMemberPage':
          if (method.name === 'allMemberPage') {
            let data = {
              page: 1,
              pageSize: Infinity,
            }
            adminService.getMembers(token, data).then((res) => {
              let exportData = {
                selected_members: [
                  res.data.map((item) => {
                    return item._id
                  }),
                ],
              }
              adminService.exportMembers(token, exportData)
            })
          }
        case 'courseMemberPage':
          if (method.name === 'courseMemberPage') {
            let data = {
              page: 1,
              pageSize: Infinity,
              courses: courseId,
            }
            adminService.getMembers(token, data).then((res) => {
              let exportData = {
                selected_members: [
                  res.data.map((item) => {
                    return item._id
                  }),
                ],
              }
              adminService.exportMembers(token, exportData)
            })
          }
        case 'ousideMemberPage':
          if (method.name === 'ousideMemberPage') {
            let data = {
              page: 1,
              pageSize: Infinity,
              withoutCourses: courseId,
            }
            adminService.getMembers(token, data).then((res) => {
              let exportData = {
                selected_members: [
                  res.data.map((item) => {
                    return item._id
                  }),
                ],
              }
              adminService.exportMembers(token, exportData)
            })
          }
        case 'search':
          if (method.name === 'search') {
            let data = {
              username: usernameInput,
              realname: realnameInput,
              phoneNumber: phoneNumberInput,
              gradeInput: gradeInput,
              role: role,
              page: 1,
              pageSize: Infinity,
            }
            adminService.getMembers(token, data).then((res) => {
              if (res?.success) {
                let exportData = {
                  selected_members: [
                    res.data.map((item) => {
                      return item._id
                    }),
                  ],
                }
                adminService.exportMembers(token, exportData)
              }
            })
          }
      }
    }
    if (by === 'selected' && selectedStudentId.length) {
      let data = {
        page: page,
        pageSize: pageSize,
        selected_members: [selectedStudentId],
      }
      adminService.exportMembers(token, data)
    }
  }

  const getMembers = () => {
    switch (method.name) {
      case 'allMemberPage':
        setLoading(true)
        let data = {
          page: method.page,
          pageSize: pageSize,
        }
        if (method.name !== methodTemp) {
          initSelector()
          setMethodTemp(method.name)
        }
        adminService.getMembers(token, data).then((res) => {
          if (res.success) {
            setLoading(false)
            setTotalPage(res.totalPage)
            setShowMembersState('all')
            setMembers(res.data)
          } else {
            setLoading(false)
            setMessage('發生錯誤', false)
          }
        })
        break
      case 'courseMemberPage':
        if (courseId !== '') {
          setLoading(true)
          let data = {
            page: method.page,
            pageSize: pageSize,
            courses: courseId,
          }

          if (method.name !== methodTemp) {
            initSelector()
            setMethodTemp(method.name)
          }
          adminService.getMembers(token, data).then((res) => {
            if (res.success) {
              setLoading(false)
              setTotalPage(res.totalPage)
              setShowMembersState('course members')
              setMembers(res.data)
            } else {
              setLoading(false)
              setMessage('發生錯誤', false)
            }
          })
        } else {
          setMessage('請選擇課程', false)
          setMembers([])
        }
        break
      case 'ousideMemberPage':
        if (courseId !== '') {
          setLoading(true)
          let data = {
            page: method.page,
            pageSize: pageSize,
            withoutCourses: courseId,
          }

          if (method.name !== methodTemp) {
            initSelector()
            setMethodTemp(method.name)
          }
          adminService.getMembers(token, data).then((res) => {
            if (res.success) {
              setLoading(false)
              setTotalPage(res.totalPage)
              setShowMembersState('all')
              setMembers(res.data)
            } else {
              setLoading(false)
              setMessage('發生錯誤', false)
            }
          })
        } else {
          setMessage('請選擇課程', false)
          setMembers([])
        }
        break
      default:
        break
    }
  }

  useEffect(() => {
    if (token) {
      getMembers()
    }
  }, [method, token])

  useEffect(() => {
    if (courseId !== '') setMethod({ name: 'courseMemberPage', page: 1 })
  }, [courseId])

  // 獲得所有課程，用於select
  useEffect(() => {
    /* data ={ courseName, subject, grade, courseClass, members, _id, page, pageSize}*/
    let data = {
      pageSize: Infinity,
    }
    if (token) {
      adminService.getCourses(token, data).then((res) => {
        if (res.success) {
          setGetedCourse(res.data)
        } else {
          setLoading(false)
          initSelector()
          setMessage('發生錯誤', false)
        }
      })
    }
  }, [token])

  // session
  useEffect(() => {
    const user_role = sessionStorage.getItem('user_role')
    setUserRole(user_role)
  }, [])

  const test = () => {}

  return (
    <div className={`${style.edit_members_main}`}>
      <BackGround></BackGround>
      {loading && <LoadingAnime></LoadingAnime>}
      {message && (
        <MessageAnime
          message={message}
          top="30%"
          duration={2000}
        />
      )}
      <div
        className={style.title}
        onClick={test}>
        編輯成員
      </div>
      <div className={style['option-container']}>
        <div className={`${style.input_area}`}>
          <span>課程名稱:</span>
          <select
            className={style.select}
            onChange={(e) => {
              setCourseId(e.target.value)
              if (e.target.value === '') {
                setShowMembersState('all')
              } else {
                setShowMembersState('course members')
              }
            }}
            name=""
            id="">
            <option value="">請選擇</option>
            {getedCourse.courses &&
              getedCourse.courses.map((item, index) => (
                <option
                  key={index}
                  value={item._id}>
                  {item.courseName}
                </option>
              ))}
          </select>
        </div>
        <div className={`${style.member_selector_area}`}>
          <div className={`${style.option_area}`}>
            {/* 顯示所有成員 */}
            <div
              className={`${style.button} ${method.name === 'allMemberPage' ? 'active' : null}`}
              onClick={() => {
                setMethod({
                  name: 'allMemberPage',
                  page: 1,
                })
              }}>
              顯示所有成員
            </div>
            {/* 顯示課程以外成員 */}
            <div
              className={`${style.button} ${method.name === 'ousideMemberPage' ? 'active' : null}`}
              onClick={() => {
                setMethod({
                  name: 'ousideMemberPage',
                  page: 1,
                })
              }}>
              顯示課程以外成員
            </div>
            {/* 顯示該課程成員 */}
            <div
              className={`${style.button} ${method.name === 'courseMemberPage' ? 'active' : null}`}
              onClick={() => {
                setMethod({
                  name: 'courseMemberPage',
                  page: 1,
                })
              }}>
              顯示該課程成員
            </div>
          </div>
          <div className={`${style.option_area}`}>
            <div
              className="g-blue-btn"
              onClick={registerMemberToCourse}>
              加入到課程
            </div>
            <div
              className="g-red-btn"
              onClick={removeRegisterCourse}>
              移除出課程
            </div>

            <div
              className="g-black-btn"
              onClick={selectAll}>
              全選此頁
            </div>
            <div
              className="g-black-btn"
              onClick={unSelectAll}>
              反選此頁
            </div>
          </div>
          {userRole && userRole === 'admin' && (
            <div className={`${style.option_area}`}>
              <div
                className="g-blue-btn"
                onClick={() => {
                  exportCSV('search')
                }}>
                將搜尋到的成員匯出csv檔案
              </div>
              <div
                className="g-blue-btn"
                onClick={() => {
                  exportCSV('selected')
                }}>
                將選取的成員匯出csv檔案
              </div>
            </div>
          )}

          <form
            className={`${style.search_form}`}
            onSubmit={(e) => {
              e.preventDefault()
              searchMembers()
            }}>
            <div className={`${style.username_input}`}>
              <div className={style.content}>暱稱</div>
              <input
                type="text"
                onChange={(e) => {
                  setUsernameInput(e.target.value)
                }}
              />
            </div>
            <div className={`${style.realname_input}`}>
              <div className={style.content}>姓名</div>
              <input
                type="text"
                onChange={(e) => {
                  setUsernameInput(e.target.value)
                }}
              />
            </div>
            <div className={`${style.phoneNumber_input}`}>
              <div className={style.content}>電話號碼</div>
              <input
                type="text"
                onChange={(e) => {
                  setPhoneNumberInput(e.target.value)
                }}
              />
            </div>
            <div className={`${style.grade_input}`}>
              <div className={style.content}>年級</div>
              <input
                type="text"
                onChange={(e) => {
                  setGradeInput(e.target.value)
                }}
              />
            </div>
            <div className={`${style.role_input}`}>
              <div className={style.content}>身分組</div>
              <select
                className=""
                onChange={(e) => {
                  setRole(e.target.value)
                }}>
                <option value="">全部</option>
                <option value="teacher">教師</option>
                <option value="student">學生</option>
                <option value="admin">管理員</option>
              </select>
            </div>
            <button
              className="g-blue-btn"
              type="submit">
              搜尋
            </button>
          </form>

          <div className={`${style.member_list_area}`}>
            <div className={`${style.inner_line}`}>
              <span className={`${style.user_name}`}>暱稱</span>
              <span className={`${style.real_name}`}>姓名</span>
              <span className={style.phone}>電話號碼</span>
              <span className={style.grade}>年級</span>
              <span className={style.role}>身分組</span>
            </div>
            {members &&
              members.map((item, index) => (
                <li
                  key={index}
                  className={`${style.inner_line}`}
                  style={{
                    cursor: 'pointer',
                    border: selectedStudentId.find((id) => id === item._id) ? '2px solid rgb(153, 153, 153)' : '2px solid rgba(0, 0, 0, 0.2)',
                    backgroundColor: selectedStudentId.find((id) => id === item._id) ? 'rgb(242, 242, 242)' : 'transparent',
                    boxShadow: selectedStudentId.find((id) => id === item._id) ? '0px 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
                  }}
                  onClick={() => {
                    if (selectedStudentId.find((id) => id === item._id)) {
                      setSelectedStudentId(selectedStudentId.filter((id_filter) => id_filter !== item._id))
                    } else {
                      setSelectedStudentId([...selectedStudentId, item._id])
                    }
                  }}>
                  {item.userinfo.username === undefined && <span className={`${style.user_name}`}>無</span>}
                  {item.userinfo.username !== undefined && <span className={`${style.user_name}`}>{item.userinfo.username}</span>}
                  <span className={`${style.real_name}`}>{item.userinfo.realname}</span>
                  <span className={style.phone}>{item.userinfo.phoneNumber}</span>
                  <span className="course-class">{item.userinfo.courseClass}</span>
                  <span className={style.grade}>{item.role === 'student' ? item.userinfo.grade : null}</span>
                  {item.role === 'teacher' && <span className={style.role}>教師</span>}
                  {item.role === 'student' && <span className={style.role}>學生</span>}
                  {item.role === 'admin' && <span className={style.role}>管理員</span>}
                </li>
              ))}
          </div>

          <div className={`${style.page_switch}`}>
            <Image
              alt="switch back to first page icon"
              src={dbArrowLeft}
              className={`${style.page_switcher}`}
              onClick={() => {
                setMethod((prop) => {
                  return { name: prop.name, page: 1 }
                })
              }}></Image>
            <Image
              alt="switch back one page icon"
              src={ArrowLeft}
              className={`${style.page_switcher}`}
              onClick={() => {
                if (method.page === 1) {
                  return
                } else {
                  setMethod((prop) => {
                    return {
                      name: prop.name,
                      page: prop.page - 1,
                    }
                  })
                }
              }}></Image>
            {getPage(totalPage, method.page).map((item, index) => {
              if (method.page === item) {
                return (
                  <div
                    key={index}
                    className={`${style.now_page} ${style.active}`}>
                    {item}
                  </div>
                )
              }
              return (
                <div
                  onClick={() => {
                    setMethod((prop) => {
                      return { name: prop.name, page: item }
                    })
                  }}
                  key={index}
                  className={`${style.now_page}`}>
                  {item}
                </div>
              )
            })}
            <Image
              alt="switch next to left page icon"
              src={ArrowRight}
              className={`${style.page_switcher}`}
              onClick={() => {
                if (method.page === totalPage) {
                  return
                } else {
                  setMethod((prop) => {
                    return {
                      name: prop.name,
                      page: prop.page + 1,
                    }
                  })
                }
              }}></Image>
            <Image
              alt="switch next one page icon"
              src={dbArrowRight}
              className={`${style.page_switcher}`}
              onClick={() => {
                setMethod((prop) => {
                  return { name: prop.name, page: totalPage }
                })
                setPage(totalPage)
              }}></Image>
          </div>
        </div>
      </div>
    </div>
  )
}
