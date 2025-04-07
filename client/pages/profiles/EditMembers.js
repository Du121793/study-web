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
    let allSelect = document.querySelectorAll('.select-area')
    if (allSelect) {
      Array.from(allSelect).forEach((item) => {
        item.click()
      })
    }
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
            showAllCourseMemebers(false)
            initSelector()
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
          showAllCourseMemebers(false)
          initSelector()
        } else {
          setMemberloading(false)
          messageControl('移除失敗', false)
        }
      })
  }

  // 使成員區域點擊整片區域都能選取到
  const memberAreaClickEvent = (e) => {
    if (e.firstChild) {
      e.firstChild.click()
    }
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

  // 顯示所有成員
  const showAllCourseMemebers = (needMessage) => {
    setMemberloading(true)
    let data = {
      page: page,
      pageSize: pageSize,
    }
    adminService.getMembers(token, data).then((res) => {
      if (res.success) {
        setMemberloading(false)
        if (needMessage) {
          messageControl('顯示所有成員', true)
        }
        setShowMembersState('all')
        setMembers(res.data)
        initSelector()
      } else {
        setMemberloading(false)
        initSelector()
        messageControl('發生錯誤', false)
      }
    })
  }

  // 顯示課程成員
  const showCourseMembers = () => {
    if (courseId !== '') {
      setMemberloading(true)
      let data = {
        page: page,
        pageSize: pageSize,
        courses: courseId,
      }
      adminService.getMembers(token, data).then((res) => {
        if (res.success) {
          setMemberloading(false)
          setShowMembersState('course members')
          setMembers(res.data)
          initSelector()
          messageControl('顯示課程成員', true)
        } else {
          setMemberloading(false)
          initSelector()
          messageControl('發生錯誤', false)
        }
      })
    } else {
      messageControl('請先選擇課程', false)
    }
  }

  // 顯示課程以外的成員
  const showElseCourseMemebers = () => {
    // 檢查是否有選擇課程
    if (courseId !== '') {
      setMemberloading(true)
      let allMembers = ''
      let courseMembers = ''
      let getAllMemberData = {
        page: page,
        pageSize: pageSize,
      }
      adminService.getMembers(token, getAllMemberData).then((res) => {
        if (res.success) {
          setMemberloading(true)
          initSelector()
          allMembers = res.data
        }
      })

      let getCourseMemberData = {
        page: page,
        pageSize: pageSize,
        courses: courseId,
      }
      adminService
        .getMembers(token, getCourseMemberData)
        .then((res) => {
          if (res.success) {
            setMemberloading(false)
            courseMembers = res.data
          }
        })
        .then(() => {
          if (courseMembers !== '' && allMembers !== '') {
            // 檢查 courseMembers 與 allMembers 是否完全相同
            const isIdentical = courseMembers.length === allMembers.length && courseMembers.every((courseMember) => allMembers.some((member) => member._id === courseMember._id))

            if (isIdentical) {
              setMembers([]) // 如果兩個陣列資料一模一樣，就設成空陣列
            } else {
              setMembers(allMembers.filter((obj1) => courseMembers.every((obj2) => obj2._id !== obj1._id)))
            }
            setShowMembersState('all')
          }
          messageControl('顯示課程以外成員', true)
        })
    } else {
      messageControl('請先選擇課程', false)
      setMemberloading(false)
    }
  }

  // 初始化已選擇的成員
  const initSelectedId = () => {
    setSelectedStudentId([])
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
        selected_members: selectedStudentId,
      }
      adminService.exportMembers(token, data).then((res) => {})
    }
  }

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

  // 獲取所有課程
  useEffect(() => {
    if (token) {
      let data = {
        page: page,
        pageSize: pageSize,
      }
      adminService.getCourses(token).then((res) => {
        setGetedCourse(res.data)
      })
      adminService.getMembers(token, data).then((res) => {
        setTotalPage(res.totalPage)
        setMembers(res.data)
      })
    }
    // 顯示該課程成員
    if (token && courseId) {
      setMemberloading(true)
      let data = {
        page: page,
        pageSize: pageSize,
        courses: courseId,
      }
      adminService.getMembers(token, data).then((res) => {
        if (res.success) {
          setMemberloading(false)
          setMembers(res.data)
          setTotalPage(res.totalPage)
          messageControl('顯示該課程成員', true)
        }
      })
    }
  }, [token, courseId, page, pageSize])

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
              console.log('all')
              showAllCourseMemebers()
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
            className="button show-all-members-btn"
            onClick={showElseCourseMemebers}>
            顯示課程以外成員
          </div>
          <div
            className="button show-all-members-btn"
            onClick={showAllCourseMemebers}>
            顯示所有成員
          </div>
          <div
            className="button show-course-members-btn"
            onClick={showCourseMembers}>
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

        <ul className="member-area">
          <div className="title-area">
            <span id="username">暱稱</span>
            <span id="realname">姓名</span>
            <span id="phone-number">電話號碼</span>
            <span id="grade">年級</span>
            <span id="role">身分組</span>
          </div>
          {members &&
            members.map((item, index) => (
              <li
                style={{
                  border: selectedStudentId.find((id) => {
                    return id === item._id
                  })
                    ? '2px solid rgb(124, 225, 180)'
                    : '2px solid rgb(0, 0, 0,0.2)',
                }}
                key={index}
                className="select-area"
                onClick={(e) => {
                  memberAreaClickEvent(e.target)
                }}>
                {/* 勾選框 */}
                <input
                  className="student-checkbox"
                  type="checkbox"
                  checked={selectedStudentId.find((id) => {
                    return id === item._id
                  })}
                  onChange={(e) => {
                    checkboxClickEvent(e.target)
                    setSelectedStudentId((prev) => {
                      return e.target.checked ? [...prev, item._id] : prev.filter((id) => id !== item._id)
                    })
                  }}
                />
                <div className="searched-info">
                  {item.userinfo.username === undefined && <span id="username">無</span>}
                  {item.userinfo.username !== undefined && <span id="username">{item.userinfo.username}</span>}
                  <span id="realname">{item.userinfo.realname}</span>
                  <span id="phone-number">{item.userinfo.phoneNumber}</span>
                  <span id="course-class">{item.userinfo.courseClass}</span>
                  <span id="grade">{item.userinfo.grade}</span>
                  {item.role === 'teacher' && <span id="role">教師</span>}
                  {item.role === 'student' && <span id="role">學生</span>}
                  {item.role === 'admin' && <span id="role">管理員</span>}
                </div>
              </li>
            ))}
        </ul>
        <div className="page-switch">
          <Image
            alt="switch back to first page icon"
            src={dbArrowLeft}
            className="page-switcher"
            onClick={() => {
              setPage(1)
            }}></Image>
          <Image
            alt="switch back one page icon"
            src={ArrowLeft}
            className="page-switcher"
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
                  className="now-page active">
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
              console.log(totalPage)
              if (page === totalPage) {
                return
              } else {
                setPage((prop) => prop + 1)
              }
            }}></Image>
          <Image
            alt="switch next one page icon"
            src={dbArrowRight}
            className="page-switcher"
            onClick={() => {
              setPage(totalPage)
            }}></Image>
        </div>
      </div>
    </div>
  )
}
