import { useEffect, useState, useRef } from 'react'
import LoadingAnime from '../../components/global/LoadingAnime'
import { useUserToken } from '../../method/useUserToken'
import userService from '../../method/userService'
import Image from 'next/image'
import adminService from '../../method/adminService'

export default function UserProfile() {
  const [userInfoLoading, setUserInfoLoading] = useState(false)
  const token = useUserToken()
  const [userInfo, setUserInfo] = useState([])
  // 切換編輯狀態
  const avatarHandler = useRef(null)
  const [editState, setEditState] = useState(false)
  // 訊息相關
  const [message, setMessage] = useState('無訊息')
  const [messageStatus, setMessageStatus] = useState(false)
  const [messageColor, setMessageColor] = useState('')
  const messageTimer = useRef(null)
  const resetTimer = useRef(null)

  // patch userinfo payload
  const [username, setUsername] = useState('')
  const [realname, setRealname] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState(false)
  const [hideAvatar, setHideAvatar] = useState(false)

  // 控制訊息外觀與隱藏計時
  const messageControl = (info, isSuccess) => {
    setMessage(info)
    setMessageStatus(true)
    setMessageColor(isSuccess ? 'rgba(195, 240, 178, 0.8)' : 'rgba(240, 178, 178, 0.8)')

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

  const test = () => {
    console.log(userInfo)
  }

  const changeUserRole = (role) => {
    console.log(role)
    let data = {
      role,
    }
    adminService.changeRole(token, data).then((res) => {
      if (res?.success) {
        if (sessionStorage.getItem('user_lineID')) {
          sessionStorage.removeItem('user_lineID')
        }
        if (sessionStorage.getItem('user_role')) {
          sessionStorage.removeItem('user_role')
        }
        if (sessionStorage.getItem('user_id')) {
          sessionStorage.removeItem('user_id')
        }
        if (sessionStorage.getItem('user_role')) {
          sessionStorage.removeItem('user_role')
        }
        localStorage.removeItem('token')
        window.location.replace('/')
      }
    })
  }

  // 編輯成員資訊
  const patchUserInfo = () => {
    let data = {
      username,
      makeAnonymous: hideAvatar,
    }
    adminService.patchUserInfo(token, data).then((res) => {
      if (res?.success) {
        setEditState(false)
        setUserInfoLoading(true)
        userService.getUserInfo(token).then((res) => {
          if (res && res.success) {
            setHideAvatar(res.data.userinfo.makePictureAnonymous)
            setUserInfo(res.data)
            setUserInfoLoading(false)
          } else {
            messageControl('發生錯誤，即將跳轉至首頁', false)
          }
        })
      }
    })
  }

  // 載入使用者資訊
  useEffect(() => {
    if (token) {
      setUserInfoLoading(true)
      userService.getUserInfo(token).then((res) => {
        if (res && res.success) {
          console.log(res.data.userinfo)
          setHideAvatar(res.data.userinfo.makePictureAnonymous)
          setUserInfo(res.data)
          setUserInfoLoading(false)
        } else {
          messageControl('發生錯誤，即將跳轉至首頁', false)
        }
      })
    }
  }, [token])

  return (
    <div className="user-profile">
      {/* 訊息框 */}
      <div
        className="message"
        style={{
          height: messageStatus ? '20px' : '0',
          padding: messageStatus ? '24px' : '0',
          backgroundColor: messageColor,
        }}>
        {message}
      </div>

      {/* Loading轉圈動畫 */}
      {userInfoLoading && <LoadingAnime />}

      <div
        className="title"
        onClick={test}>
        個人資訊
      </div>

      <div className="top-section">
        <div className="hide-avatar">
          <input
            className="checkbox"
            onChange={(e) => {
              setHideAvatar(e.target.checked)
            }}
            type="checkbox"
          />
          <div className="content">隱藏頭像</div>
        </div>
        {hideAvatar === false && (
          <div className="avatar">
            {userInfo?.userinfo?.pictureUrl && (
              <Image
                alt="user avatar"
                className="image"
                loading="lazy"
                src={userInfo.userinfo.pictureUrl}
                width={100}
                height={100}
                objectFit="cover"></Image>
            )}
          </div>
        )}
        {/* 右側資訊條 */}
        <div className="info-bar">
          <div className="content">
            <div className="content-title">真實姓名:</div>
            <div className="content-info">{userInfo?.userinfo?.realname && userInfo?.userinfo?.realname}</div>
          </div>
          {!editState && (
            <div className="content">
              <div className="content-title">暱稱:</div>
              <div className="content-info">{userInfo?.userinfo?.username && userInfo?.userinfo?.username}</div>
            </div>
          )}
          {editState && (
            <div className="content">
              <div className="content-title">暱稱:</div>
              <input
                type="text"
                className="content-info"
                defaultValue={userInfo?.userinfo?.username && userInfo?.userinfo?.username}
                onChange={(e) => {
                  setUsername(e.target.value)
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="bottom-section">
        <div className="left-panel">
          <div className="content-area">
            <div className="content">ID</div>
            <div className="content-info">{userInfo?._id}</div>
          </div>
          <div className="content-area">
            <div className="content">LineID</div>
            <div className="content-info">{userInfo?.lineID}</div>
          </div>
          <div className="content-area">
            <div className="content">身分組</div>
            <div className="content-info">
              {userInfo?.role}
              {userInfo?.role !== 'admin' && (
                <button
                  onClick={(e) => {
                    changeUserRole(e.target.innerText)
                  }}
                  style={{ border: '1px solid rgba(0, 0, 0, 0.2)' }}>
                  admin
                </button>
              )}
              {userInfo?.role !== 'teacher' && (
                <button
                  onClick={(e) => {
                    changeUserRole(e.target.innerText)
                  }}
                  style={{ border: '1px solid rgba(0, 0, 0, 0.2)' }}>
                  teacher
                </button>
              )}
              {userInfo?.role !== 'student' && (
                <button
                  onClick={(e) => {
                    changeUserRole(e.target.innerText)
                  }}
                  style={{ border: '1px solid rgba(0, 0, 0, 0.2)' }}>
                  student
                </button>
              )}
            </div>
          </div>
          <div className="content-area">
            <div className="content">電話</div>
            <div className="content-info">{userInfo?.userinfo?.phoneNumber}</div>
          </div>
          <div className="content-area">
            <div className="content">創建日期</div>
            <div className="content-info">{new Date(userInfo?.date).toLocaleString()}</div>
          </div>
          <div className="content-area">
            <div className="content hint">以上是我們網站取得到的所有個人資訊</div>
          </div>
        </div>

        {/* 右側區域 (綠色框) */}
        <div className="right-panel">
          <div className="button-group">
            <button
              className="g-blue-btn"
              onClick={() => {
                setEditState(true)
              }}>
              編輯
            </button>
            <button
              className="g-blue-btn"
              onClick={() => {
                patchUserInfo()
              }}>
              儲存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
