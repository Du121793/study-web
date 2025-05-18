// 組件庫
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
//public
import dbArrowLeft from '../../public/profile/doubleArrowLeft.png'
import dbArrowRight from '../../public/profile/doubleArrowRight.png'
import ArrowLeft from '../../public/profile/leftArrow.png'
import ArrowRight from '../../public/profile/rightArrow.png'
// 導入method
import { useUserToken } from '../../method/useUserToken'
import adminService from '../../method/adminService'
export default function RemoveUsers() {
  const token = useUserToken()
  // get members
  const [getUsers, setGetUsers] = useState([])
  const [membersTemp, setMembersTemp] = useState([])
  // 旋轉讀取
  const [loading, setLoading] = useState(false)
  // 請求參數
  const [selectedUserId, setSelectedUserId] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPage, setTotalPage] = useState(1)
  const [realNameValue, setRealNameValue] = useState(null)
  const [phoneValue, setPhoneValue] = useState(null)
  const [choseRole, setChoseRole] = useState(null)
  const [memberId, setMemberId] = useState(null)
  const [grade, setGrade] = useState(null)
  // 初始化所有資料的邊框
  const [optionBorder, setOptionBorder] = useState('2px solid rgba(0, 0, 0, 0.2)')
  // 控制訊息
  const [message, setMessage] = useState('無訊息')
  const [messageStatus, setMessageStatus] = useState(false)
  const [messageColor, setMessageColor] = useState('')

  const checkSelectedMembers = () => {}

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
    setTimeout(() => {
      setMessageStatus(false)
      setTimeout(() => {
        setMessage('無訊息')
        setMessageColor('')
      }, 200)
    }, 2000)
  }

  //請求獲取使用者
  const getUsersFunction = () => {
    setLoading(true)
    adminService.getMembers(token).then((res) => {
      if (res?.success) {
        setGetUsers(res.data)
        setLoading(false)
      }
    })
  }

  // 點擊選擇單個用戶
  const selectedUser = (e, _id) => {
    if (
      selectedUserId.find((item) => {
        return item === _id
      })
    ) {
      setSelectedUserId(
        selectedUserId.filter((item) => {
          return item !== _id
        })
      )
    } else {
      setSelectedUserId([...selectedUserId, _id])
    }
  }

  // 點擊刪除發送請求
  const deleteSelectedUsers = () => {
    if (selectedUserId.length) {
      setLoading(true)
      adminService.deleteMembers(token, selectedUserId).then((res) => {
        if (res.success === true) {
          setSelectedUserId([])
          getUsersFunction()
          clearSelectedMemebers()
          messageControl(res.msg, true)
          setLoading(false)
        } else {
          messageControl('發生錯誤', false)
          console.error(res)
        }
      })
    }
  }

  // 取消選取所有已選取的成員
  const clearSelectedMemebers = () => {
    setSelectedUserId([])
  }

  // 搜尋使用者資料
  const searchMemebers = () => {
    let data = {
      realname: realNameValue,
      phoneNumber: phoneValue,
      role: choseRole,
      _id: memberId,
      page: page,
      pageSize: pageSize,
      grade: grade,
    }
    setLoading(true)
    adminService.getMembers(token, data).then((res) => {
      if (res?.success) {
        setGetUsers(res.data)
        setLoading(false)
      }
    })
  }

  // 刷新渲染使用者資料
  useEffect(() => {
    if (token) {
      let data = {
        page: page,
        pageSize: pageSize,
      }
      setLoading(true)
      adminService.getMembers(token, data).then((res) => {
        if (res.success) {
          setTotalPage(res.totalPage)
          setGetUsers(res.data)
          setLoading(false)
        }
      })
    }
  }, [token, page])

  return (
    <div className="remove-users-page">
      <div
        className="right-bottom-loading-area"
        style={{ right: loading ? '8px' : '-100%' }}>
        <div className="loading"></div>
      </div>
      <div className="remove-users-title">移除成員功能</div>
      <div
        style={{ height: messageStatus ? '20px' : '0', padding: messageStatus ? '24px' : '0', backgroundColor: messageColor }}
        className="message">
        {message}
      </div>
      {/* 搜尋選項: 姓名，電話，年級*/}
      <div className="remove-user-header">
        {/* 輸入姓名 */}
        <div className="top-info-input">
          <div className="title">真實姓名:</div>
          <input
            onChange={(e) => {
              setRealNameValue(e.target.value)
            }}
            className="name-input"
            type="text"
            placeholder="選填"
          />
        </div>
        {/* 輸入電話 */}
        <div className="top-info-input">
          <div className="title">電話:</div>
          <input
            onChange={(e) => {
              setPhoneValue(e.target.value)
            }}
            className="phone-input"
            type="text"
            placeholder="選填"
          />
        </div>
        {/* 輸入年級 */}
        <div className="top-info-input">
          <div className="title">年級 :</div>
          <input
            onChange={(e) => {
              setGrade(e.target.value)
            }}
            className="grade-input"
            type="text"
            placeholder="選填"
          />
        </div>
      </div>
      {/* 搜尋選項: 用戶ID，身分組 */}
      <div className="container-line">
        <div className="title">用戶ID:</div>
        <input
          onChange={(e) => {
            setMemberId(e.target.value)
          }}
          className="member-id-input"
          type="text"
          placeholder="選填"
        />
        <div className="title">身分組</div>
        <select
          onChange={(e) => {
            setChoseRole(e.target.value)
            clearSelectedMemebers()
          }}>
          <option value="">全部</option>
          <option value="teacher">教師</option>
          <option value="student">學生</option>
        </select>
      </div>
      {/* 按鈕區域 */}
      <div className="header-btns">
        <div
          className="g-black-btn"
          onClick={clearSelectedMemebers}>
          清空選項
        </div>
        <div
          className="g-blue-btn"
          onClick={searchMemebers}>
          搜尋
        </div>
        <div
          className="g-red-btn"
          onClick={deleteSelectedUsers}>
          刪除
        </div>
      </div>
      {/* list標題 */}
      <div className="user-list-title">
        <div className="container">
          <div className="username">暱稱</div>
          <div className="realname">真實性名</div>
          <div className="grade">年級</div>
          <div className="phone">電話號碼</div>
          <div className="userid">用戶ID</div>
          <div className="role">身分組</div>
        </div>
      </div>
      {/* list內容 */}
      <div className="user-list">
        {getUsers.map(
          (item, index) =>
            item.role !== 'admin' && (
              <div
                key={index}
                onClick={(e) => {
                  selectedUser(e, item._id)
                }}
                className="container member-info"
                style={{ border: selectedUserId.find((id) => item._id === id) ? '2px solid rgb(113, 231, 63)' : '2px solid rgba(0, 0, 0, 0.2)' }}>
                <div className="username">{!item.userinfo.username ? '無' : item.userinfo.username}</div>
                <div className="realname">{item.userinfo.realname}</div>
                <div className="grade">{item.role === 'student' ? item.userinfo.grade : null}</div>
                <div className="phone">{item.userinfo.phoneNumber}</div>
                <div className="userid">{item._id}</div>
                {item.role === 'admin' && <div className="role">管理員</div>}
                {item.role === 'teacher' && <div className="role">老師</div>}
                {item.role === 'student' && <div className="role">學生</div>}
              </div>
            )
        )}
      </div>
      <div className="page-switch">
        <Image
          alt="switch back to first page icon"
          src={dbArrowLeft}
          className="page-switcher"
          width={24}
          height={24}
          onClick={() => {
            checkSelectedMembers()
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
              checkSelectedMembers()
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
                checkSelectedMembers()
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
            if (page === totalPage) {
              return
            } else {
              setPage((prop) => prop + 1)
              checkSelectedMembers()
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
            checkSelectedMembers()
          }}></Image>
      </div>
    </div>
  )
}
