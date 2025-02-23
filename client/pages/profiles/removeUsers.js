// 組件庫
import { useState, useEffect } from 'react'
import { useUserToken } from '../methods/service/useUserToken'
import Image from 'next/image'
// 導入method
import adminService from '../methods/service/adminService'
export default function removeUsers() {
  const token = useUserToken()
  const [getUsers, setGetUsers] = useState([])
  const [optionBorder, setOptionBorder] = useState('2px solid rgba(0, 0, 0, 0.2)')
  const [selectedUserId, setSelectedUserId] = useState([])
  const [isDeleted, setIsDeleted] = useState(false)
  const [realNameValue, setRealNameValue] = useState()
  const [phoneValue, setPhoneValue] = useState()
  const [choseRole, setChoseRole] = useState()
  // 刷新渲染使用者資料
  useEffect(() => {
    if (token) {
      getUsersFunction()
    }
  }, [token])
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

    if (e.target.style.border != '2px solid rgb(113, 231, 63)') {
      e.target.style.border = '2px solid rgb(113, 231, 63)'
    } else {
      e.target.style.border = '2px solid rgba(0, 0, 0, 0.2)'
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
        }
      })
    }
  }
  // 取消選取所有已選取的成員
  const clearSelectedMemebers = () => {
    setSelectedUserId([])
    const element = Array.from(document.querySelectorAll('.member-info'))
    element.map((item) => {
      item.style.border = '2px solid rgba(0, 0, 0, 0.2)'
    })
  }
  // 搜尋使用者資料
  const searchMemebers = () => {
    adminService.getMembers(token, { realname: realNameValue, phoneNumber: phoneValue, role: choseRole }).then((res) => {
      console.log(res.data)
      setGetUsers(res.data)
    })
  }
  return (
    <div className="remove-users-page">
      <div className="remove-users-title">移除成員功能</div>
      {/* 搜尋選項 */}
      <div className="remove-user-header">
        {/* 輸入姓名 */}
        <div>
          <div className="title">真實姓名</div>
          <input
            onChange={(e) => {
              setRealNameValue(e.target.value)
            }}
            className="name-input"
            type="text"
            placeholder="請輸入"
          />
        </div>
        {/* 輸入電話 */}
        <div>
          <div className="title">電話</div>
          <input
            onChange={(e) => {
              setPhoneValue(e.target.value)
            }}
            className="phone-input"
            type="text"
            placeholder="請輸入"
          />
        </div>
        <div>
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
          <div className="phone">電話號碼</div>
          <div className="userid">用戶ID</div>
          <div className="role">身分組</div>
        </div>
      </div>
      <div className="user-list">
        {getUsers.map(
          (item) =>
            item.role !== 'admin' && (
              <div
                onClick={(e) => {
                  selectedUser(e, item._id)
                }}
                className="container member-info"
                style={{ border: optionBorder }}>
                <div className="username">{item.userinfo.username}</div>
                <div className="realname">{item.userinfo.realname}</div>
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
