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
    setSelectedStudentId(
      members.map((item) => {
        return item._id
      })
    )
  }

  // 取消全選按鈕
  const clearSearch = () => {
    setSelectedStudentId([])
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
        role: roleInput,
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
  }, [token, page, pageSize, roleInput])

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
            className="g-black-btn"
            onClick={selectAllStudent}>
            全選
          </button>
          <button
            className="g-red-btn"
            onClick={clearSearch}>
            取消選取
          </button>
          <button
            className="g-blue-btn"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              searchStudentButton()
              initSelectedId()
            }}>
            搜尋
          </button>
        </div>
      </div>
      <ul className="member-list-area">
        <div className="inner-line">
          <span className="user-name">暱稱</span>
          <span className="real-name">姓名</span>
          <span className="phone">電話號碼</span>
          <span className="grade">年級</span>
          <span className="role">身分組</span>
        </div>
        {memberloading && <LoadingAnime />}
        {members &&
          members.map((item, index) => (
            <div
              style={{
                cursor: 'pointer',
                border: selectedStudentId.find((id) => id === item._id) ? '2px solid rgb(153, 153, 153)' : '2px solid rgba(0, 0, 0, 0.2)',
                backgroundColor: selectedStudentId.find((id) => id === item._id) ? 'rgb(242, 242, 242)' : 'transparent',
                boxShadow: selectedStudentId.find((id) => id === item._id) ? '0px 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
              }}
              key={index}
              onClick={(e) => {
                if (selectedStudentId.find((id) => id === item._id)) {
                  setSelectedStudentId(selectedStudentId.filter((id_filter) => id_filter !== item._id))
                } else {
                  setSelectedStudentId([...selectedStudentId, item._id])
                }
              }}
              className="inner-line">
              {/* 勾選框 */}
              {item.userinfo.username === undefined && <span className="user-name">無</span>}
              {item.userinfo.username !== undefined && <span className="user-name">{item.userinfo.username}</span>}
              <span className="real-name">{item.userinfo.realname}</span>
              <span className="phone">{item.userinfo.phoneNumber}</span>
              <span className="course-class">{item.userinfo.courseClass}</span>
              <span className="grade">{item.userinfo.grade}</span>
              {item.role === 'teacher' && <span className="role">教師</span>}
              {item.role === 'student' && <span className="role">學生</span>}
              {item.role === 'admin' && <span className="role">管理員</span>}
            </div>
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
