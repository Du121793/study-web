// 組件庫
import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
// method組件
import adminService from '../../method/adminService'
import { useUserToken } from '../../method/useUserToken'
// global
import LoadingAnime from '../../components/global/LoadingAnime'

//public
import dbArrowLeft from '../../public/profile/doubleArrowLeft.png'
import dbArrowRight from '../../public/profile/doubleArrowRight.png'
import ArrowLeft from '../../public/profile/leftArrow.png'
import ArrowRight from '../../public/profile/rightArrow.png'

export default function MemberSelector({ selectedStudentId, setSelectedStudentId }) {
  // env
  const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP
  const [isSelectAllCheckbox, setIsSelectAllCheckbox] = useState(false)
  const token = useUserToken()

  const [memberloading, setMemberLoading] = useState()
  // 請求參數
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPage, setTotalPage] = useState(1)
  const [nameInput, setNameInput] = useState(null)
  const [phoneInput, setPhoneInput] = useState(null)
  const [gradeInput, setGradeInput] = useState(null)
  const [roleInput, setRoleInput] = useState(null)
  const [selectCourse, setSelectCourse] = useState(null)

  // 控制訊息
  const [message, setMessage] = useState('無訊息')
  const [messageStatus, setMessageStatus] = useState(false)
  const [messageColor, setMessageColor] = useState('')
  // 綁定timeout，用於重計
  const messageTimer = useRef(null)
  const resetTimer = useRef(null)
  // 獲取資料
  const [members, setMembers] = useState([])
  const [totalArray, setTotalArray] = useState([])

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
  // 全選按鈕
  const selectAllStudent = () => {
    const boxs = document.querySelectorAll('.student-checkbox')
    boxs.forEach((checkbox) => {
      // 判斷是否有單個被選取
      if (checkbox.checked === false) {
        // 全部打勾
        checkbox.click()
      } else if (isSelectAllCheckbox === false && checkbox.checked === false) {
        boxs.forEach((checkbox) => {
          // 全部打勾
          checkbox.click()
        })
        setIsSelectAllCheckbox(true)
      }
    })
  }

  // 取消全選按鈕
  const clearSearch = () => {
    const boxs = document.querySelectorAll('.student-checkbox')
    if (isSelectAllCheckbox) {
      boxs.forEach((checkbox) => {
        // 全部打勾
        checkbox.click()
      })
      setIsSelectAllCheckbox(false)
    } else {
      // 判斷是否有單個被選取
      boxs.forEach((checkbox) => {
        if (checkbox.checked === true) {
          // 全部打勾
          checkbox.click()
        }
      })
    }
  }

  // 搜尋按鈕
  const searchStudentButton = () => {
    try {
      let data = {
        realname: nameInput,
        phoneNumber: phoneInput,
        gradeInput: gradeInput,
        role: roleInput,
        courses: selectCourse,
        page: page,
        pageSize: pageSize,
      }
      adminService.getMembers(token, data).then((res) => {
        setMembers(res.data)
        setTotalPage(res.totalPage)
        let temp = []
        for (let i = 1; i <= res.totalPage; i++) {
          temp.push(i)
        }
        setTotalArray(temp)
      })
    } catch (e) {
      console.error(e)
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

  // 點擊整片區域都能選取到
  const memberAreaClickEvent = (e) => {
    if (e.firstChild) {
      e.firstChild.click()
    }
  }

  // 初始化已選擇的學生
  const initSelectedId = () => {
    setSelectedStudentId([])
  }

  // 獲得成員清單
  useEffect(() => {
    if (token) {
      setMemberLoading(true)
      let data = {
        page: page,
        pageSize: pageSize,
      }
      try {
        adminService.getMembers(token, data).then((res) => {
          if (res.success) {
            setMembers(res.data)
            setTotalPage(res.totalPage)
            setMemberLoading(false)
            let temp = []
            for (let i = 1; i <= res.totalPage; i++) {
              temp.push(i)
            }
            setTotalArray(temp)
          } else {
            messageControl('發生錯誤，即將回到首頁', false)
            setTimeout(() => {
              window.location(clientIp)
            }, 3000)
          }
        })
      } catch (e) {
        alert(e)
      }
    }
  }, [token, page, pageSize])

  const test = () => {
    console.log(selectedStudentId)
  }

  return (
    <div className="member-select-area">
      <div
        style={{ height: messageStatus ? '20px' : '0', padding: messageStatus ? '24px' : '0', backgroundColor: messageColor }}
        className="message">
        {message}
      </div>
      <div className="member-select-header">成員搜尋功能</div>
      <div className="classification">
        <div className="search-inputs">
          {/* 姓名 */}
          <div>
            <span>姓名:</span>
            <input
              className="input-name"
              onChange={(e) => {
                setNameInput(e.target.value)
                console.log(e.target.value)
              }}
              type="text"
            />
          </div>
          {/* 電話 */}
          <div>
            <span>電話:</span>
            <input
              className="input-phone"
              onChange={(e) => {
                setPhoneInput(e.target.value)
                console.log(e.target.value)
              }}
              type="text"
            />
          </div>
          {/* 年級 */}
          <div>
            <span>年級:</span>
            <input
              className="input-grade"
              onChange={(e) => {
                setGradeInput(e.target.value)
                console.log(e.target.value)
              }}
              type="text"
            />
          </div>
          {/* 身分組 */}
          <div className="search-inputs">
            身分組:
            <select
              onChange={(e) => {
                setRoleInput(e.target.value)
                console.log(e.target.value)
              }}
              name=""
              id="">
              <option value="">全部</option>
              <option value="teacher">教師</option>
              <option value="student">學生</option>
            </select>
          </div>
        </div>
        {/* 三個按鈕 */}
        <div className="btns">
          <button
            className="search-option-btn"
            onClick={selectAllStudent}>
            全選
          </button>
          <button
            className="search-option-btn"
            onClick={clearSearch}>
            取消全選
          </button>
          <button
            className="search-option-btn"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              searchStudentButton()
              initSelectedId()
            }}>
            搜尋
          </button>
        </div>
      </div>
      <ul className="member-area">
        <div className="title-area">
          <span id="username">暱稱</span>
          <span id="realname">姓名</span>
          <span id="phone-number">電話號碼</span>
          <span id="grade">年級</span>
          <span id="role">身分組</span>
        </div>
        {memberloading && <LoadingAnime />}
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
                onLoad={() => {
                  initSelectedId()
                }}
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
          width={24}
          height={24}
          onClick={() => {
            setPage(1)
          }}></Image>
        <Image
          alt="switch back one page icon"
          src={ArrowLeft}
          className="page-switcher"
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
          width={24}
          height={24}
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
          width={24}
          height={24}
          onClick={() => {
            setPage(totalPage)
          }}></Image>
      </div>
    </div>
  )
}
