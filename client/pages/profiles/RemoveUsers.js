// 組件庫
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
// 導入method
import { useUserToken } from '../../method/useUserToken'
import adminService from '../../method/adminService'
export default function RemoveUsers() {
  const token = useUserToken()
  const [getUsers, setGetUsers] = useState([])
  // 請求用餐數
  const [selectedUserId, setSelectedUserId] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(9999)
  const [realNameValue, setRealNameValue] = useState(null)
  const [phoneValue, setPhoneValue] = useState(null)
  const [choseRole, setChoseRole] = useState(null)
  const [memberId, setMemberId] = useState(null)
  const [grade, setGrade] = useState(null)
  // 初始化所有資料的邊框
  const [optionBorder, setOptionBorder] = useState('1px solid rgba(0, 0, 0, 0.2)')
  // 控制訊息
  const [message, setMessage] = useState('無訊息')
  const [messageStatus, setMessageStatus] = useState(false)
  const [messageColor, setMessageColor] = useState('')

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
    adminService.getMembers(token).then((res) => {
      setGetUsers(res.data)
      console.log(res)
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

    if (e.target.style.border != '1px solid rgb(113, 231, 63)') {
      e.target.style.border = '1px solid rgb(113, 231, 63)'
    } else {
      e.target.style.border = '1px solid rgba(0, 0, 0, 0.2)'
    }
  }
  // 點擊刪除發送請求
  const deleteSelectedUsers = () => {
    if (selectedUserId.length) {
      adminService.deleteMembers(token, selectedUserId).then((res) => {
        console.log(res)
        if (res.success === true) {
          setSelectedUserId([])
          getUsersFunction()
          clearSelectedMemebers()
          messageControl(res.msg, true)
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
    const element = Array.from(document.querySelectorAll('.member-info'))
    element.map((item) => {
      item.style.border = '1px solid rgba(0, 0, 0, 0.2)'
    })
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
    adminService.getMembers(token, data).then((res) => {
      setGetUsers(res.data)
    })
  }

  // 刷新渲染使用者資料
  useEffect(() => {
    if (token) {
      adminService.getMembers(token).then((res) => {
        setGetUsers(res.data)
      })
    }
  }, [token])

  return (
    <div className="remove-users-page">
      <div className="remove-users-title">移除成員功能</div>
      <div
        style={{ height: messageStatus ? '20px' : '0', padding: messageStatus ? '24px' : '0', backgroundColor: messageColor }}
        className="message">
        {message}
      </div>
      {/* 搜尋選項: 姓名，電話，年級*/}
      <div className="remove-user-header">
        {/* 輸入姓名 */}
        <div>
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
        <div>
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
        <div>
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
          className="button"
          onClick={clearSelectedMemebers}>
          清除選項
        </div>
        <div
          className="button"
          onClick={searchMemebers}>
          搜尋
        </div>
        <div
          className="button"
          id="delete-btn"
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
                style={{ border: optionBorder }}>
                <div className="username">{!item.userinfo.username ? '無' : item.userinfo.username}</div>
                <div className="realname">{item.userinfo.realname}</div>
                <div className="grade">{item.userinfo.grade}</div>
                <div className="phone">{item.userinfo.phoneNumber}</div>
                <div className="userid">{item._id}</div>
                {item.role === 'admin' && <div className="role">管理員</div>}
                {item.role === 'teacher' && <div className="role">老師</div>}
                {item.role === 'student' && <div className="role">學生</div>}
              </div>
            )
        )}
      </div>
    </div>
  )
}
