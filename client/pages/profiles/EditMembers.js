// 原生組件庫
import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
// method
import adminService from '../../method/adminService'
import userService from '../../method/userService'
import { useUserToken } from '../../method/useUserToken'
//public
import dbArrowLeft from '../../public/profile/doubleArrowLeft.png'
import dbArrowRight from '../../public/profile/doubleArrowRight.png'
import ArrowLeft from '../../public/profile/leftArrow.png'
import ArrowRight from '../../public/profile/rightArrow.png'

// global component
import LoadingAnime from '../../components/global/LoadingAnime'

export default function EditMembers() {
  // env
  // const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

  const [memberloading, setMemberloading] = useState()
  const token = useUserToken()
  const [selectedStudentId, setSelectedStudentId] = useState([])
  // 控制訊息
  const [message, setMessage] = useState('無訊息')
  const [messageStatus, setMessageStatus] = useState(false)
  const [messageColor, setMessageColor] = useState('')
  const messageTimer = useRef(null)
  const resetTimer = useRef(null)
  // 請求參數
  const [getedCourse, setGetedCourse] = useState({ courses: [] })
  const [page, setPage] = useState(1)
  // allMemberPage
  // courseMemberPage
  // ousideMemberPage
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
  // loading anime
  const [loading, setLoading] = useState(false)
  // rander lock
  const [randerLock, setRanderLock] = useState(0)

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

  // 全選功能
  const selectAll = () => {
    console.log(members)
    console.log(selectedStudentId)
    let idTemp = []
    members.forEach((item) => {
      idTemp.push(item._id)
    })
    setSelectedStudentId([...selectedStudentId, ...idTemp])
  }

  // 按下"加入到課程"的函式，將選擇的人加入到指定課程
  const registerMemberToCourse = async () => {
    if (courseId !== '') {
      setMemberloading(true)
      adminService
        .registerMember(token, {
          user_ids: selectedStudentId, // 可以是陣列
          course_ids: [courseId],
        })
        .then((res) => {
          if (res.success) {
            setMemberloading(false)
            initSelector()
            getMembers()
            messageControl('加入到課程', true)
          } else {
            setMemberloading(false)
            messageControl('發生錯誤', false)
          }
        })
    } else {
      setMemberloading(false)
      messageControl('請先選擇課程', false)
    }
  }

  //  按下"移除出課程"的函式，將選擇的人加入到指定課程
  const removeRegisterCourse = () => {
    setMemberloading(true)
    adminService
      .unRegisterMember(token, {
        user_ids: selectedStudentId, // 可以是陣列
        course_ids: [courseId],
      })
      .then((res) => {
        if (res.success) {
          setMemberloading(false)
          messageControl('移除成功', true)
          getMembers()
          initSelector()
        } else {
          setMemberloading(false)
          messageControl('移除失敗', false)
        }
      })
  }

  // 按下打勾變色
  const checkboxClickEvent = (e) => {
    if (e.parentNode.style.border === '2px solid rgb(124, 225, 180)') {
      e.parentNode.style.border = '2px solid rgb(0, 0, 0,0.2)'
    } else {
      e.parentNode.style.border = '2px solid rgb(124, 225, 180)'
    }
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

  // 導出成csv
  const exportCSV = (by) => {
    if (by === 'search') {
      setExportRequested(true)
      setPageSize(Infinity)
    }
    if (by === 'selected' && selectedStudentId.length) {
      let data = {
        page: page,
        pageSize: pageSize,
        selected_members: [selectedStudentId],
      }
      adminService.exportMembers(token, data).then((res) => {})
    }
  }

  const getMembers = () => {
    switch (method.name) {
      case 'allMemberPage':
        setMemberloading(true)
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
            setMemberloading(false)
            setTotalPage(res.totalPage)
            setShowMembersState('all')
            setMembers(res.data)
          } else {
            setMemberloading(false)
            messageControl('發生錯誤', false)
          }
        })
        break
      case 'courseMemberPage':
        if (courseId !== '') {
          setMemberloading(true)
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
              setMemberloading(false)
              setTotalPage(res.totalPage)
              setShowMembersState('course members')
              setMembers(res.data)
            } else {
              setMemberloading(false)
              messageControl('發生錯誤', false)
            }
          })
        } else {
          messageControl('請選擇課程', false)
          setMembers([])
        }
        break
      case 'ousideMemberPage':
        if (courseId !== '') {
          setMemberloading(true)
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
              setMemberloading(false)
              setTotalPage(res.totalPage)
              setShowMembersState('all')
              setMembers(res.data)
            } else {
              setMemberloading(false)
              messageControl('發生錯誤', false)
            }
          })
        } else {
          messageControl('請選擇課程', false)
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
          setMemberloading(false)
          initSelector()
          messageControl('發生錯誤', false)
        }
      })
    }
  }, [token])

  // session
  useEffect(() => {
    const user_role = sessionStorage.getItem('user_role')
    setUserRole(user_role)
  }, [])

  // pageSize來控制，將搜尋到的成員匯出csv檔案
  useEffect(() => {
    // 如果totalPage=1，代表顯示成員數<=10，直接下載
    if (totalPage === 1) {
      if (pageSize === Infinity && !isExporting.current) {
        isExporting.current = true
        const data = {
          selected_members: members.map((item) => item._id),
        }
        adminService.exportMembers(token, data).then(() => {
          setPageSize(10)
          isExporting.current = false
        })
      }
    }
    if (totalPage !== 1 && pageSize === Infinity) {
      let tempMembers = members
      if (!isExporting.current) {
        isExporting.current = true
        const data = {
          selected_members: members !== tempMembers ? members : null,
        }
        adminService.exportMembers(token, data).then(() => {
          isExporting.current = false
          setPageSize(10)
        })
      }
    }
  }, [pageSize, token])

  const test = () => {
    console.log(selectedStudentId)
  }

  return (
    <div className="edit-members-main">
      {memberloading && <LoadingAnime />}
      <div
        style={{ height: messageStatus ? '20px' : '0', padding: messageStatus ? '24px' : '0', backgroundColor: messageColor }}
        className="message">
        {message}
      </div>
      <div
        className="title"
        onClick={test}>
        編輯成員
      </div>
      <div className="input-area">
        <span>課程名稱:</span>
        <select
          className="select"
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
      <div className="member-selector-area">
        <div className="option-area">
          <div
            className={`button show-course-members-btn ${method.name === 'ousideMemberPage' ? 'active' : null}`}
            onClick={() => {
              setMethod({
                name: 'ousideMemberPage',
                page: 1,
              })
            }}>
            顯示課程以外成員
          </div>
          <div
            className={`button show-course-members-btn ${method.name === 'allMemberPage' ? 'active' : null}`}
            onClick={() => {
              setMethod({
                name: 'allMemberPage',
                page: 1,
              })
            }}>
            顯示所有成員
          </div>
          <div
            className={`button show-course-members-btn ${method.name === 'courseMemberPage' ? 'active' : null}`}
            onClick={() => {
              setMethod({
                name: 'courseMemberPage',
                page: 1,
              })
            }}>
            顯示該課程成員
          </div>
          {showMembersState === 'all' && (
            <div
              className="button add-member-to-course-btn"
              onClick={registerMemberToCourse}>
              加入到課程
            </div>
          )}
          {showMembersState === 'course members' && (
            <div
              className="button remove-member-to-course-btn"
              onClick={removeRegisterCourse}>
              移除出課程
            </div>
          )}

          <div
            className="button select-all-btn"
            onClick={selectAll}>
            全選
          </div>
          <div
            className="button unselect-all-btn"
            onClick={initSelector}>
            反選
          </div>
        </div>
        {userRole && userRole === 'admin' && (
          <div className="option-area">
            <div
              className="button"
              onClick={() => {
                exportCSV('search')
              }}>
              將搜尋到的成員匯出csv檔案
            </div>
            <div
              className="button"
              onClick={() => {
                exportCSV('selected')
              }}>
              將選取的成員匯出csv檔案
            </div>
          </div>
        )}

        <div className="member-list-area">
          <div className="inner-line">
            <span className="user-name">暱稱</span>
            <span className="real-name">姓名</span>
            <span className="phone">電話號碼</span>
            <span className="grade">年級</span>
            <span className="role">身分組</span>
          </div>
          {members &&
            members.map((item, index) => (
              <li
                key={index}
                className="inner-line"
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
                {item.userinfo.username === undefined && <span className="user-name">無</span>}
                {item.userinfo.username !== undefined && <span className="user-name">{item.userinfo.username}</span>}
                <span className="real-name">{item.userinfo.realname}</span>
                <span className="phone">{item.userinfo.phoneNumber}</span>
                <span className="course-class">{item.userinfo.courseClass}</span>
                <span className="grade">{item.userinfo.grade}</span>
                {item.role === 'teacher' && <span className="role">教師</span>}
                {item.role === 'student' && <span className="role">學生</span>}
                {item.role === 'admin' && <span className="role">管理員</span>}
              </li>
            ))}
        </div>
        <div className="page-switch">
          <Image
            alt="switch back to first page icon"
            src={dbArrowLeft}
            className="page-switcher"
            onClick={() => {
              setMethod((prop) => {
                return { name: prop.name, page: 1 }
              })
            }}></Image>
          <Image
            alt="switch back one page icon"
            src={ArrowLeft}
            className="page-switcher"
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
                  className="now-page active">
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
                className="now-page">
                {item}
              </div>
            )
          })}
          <Image
            alt="switch next to left page icon"
            src={ArrowRight}
            className="page-switcher"
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
            className="page-switcher"
            onClick={() => {
              setMethod((prop) => {
                return { name: prop.name, page: totalPage }
              })
              setPage(totalPage)
            }}></Image>
        </div>
      </div>
    </div>
  )
}
