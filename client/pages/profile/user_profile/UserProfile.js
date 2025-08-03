// 庫
import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import style from './style.module.css'
// method
import { useUserToken } from '../../../method/useUserToken'
import userService from '../../../method/userService'
import adminService from '../../../method/adminService'
// public
import anonymous from '../../../public/course/anonymous.png'
// components
import BackGround from '../components/back_ground/BackGround'

export default function UserProfile() {
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

  // 旋轉讀取
  const [loading, setLoading] = useState(false)

  // patch userinfo payload
  const [username, setUsername] = useState('')
  const [realname, setRealname] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState(false)
  const [hideAvatar, setHideAvatar] = useState(userInfo?.makePictureAnonymous)

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

  // 編輯成員資訊
  const patchUserInfo = () => {
    let data = {
      username,
      makeAnonymous: hideAvatar,
    }
    setLoading(true)
    adminService.patchUserInfo(token, data).then((res) => {
      if (res?.success) {
        setEditState(false)
        setLoading(false)
        userService.getUserInfo(token).then((res) => {
          if (res && res.success) {
            setHideAvatar(res.data.userinfo.makePictureAnonymous)
            setUserInfo(res.data)
            setLoading(false)
          } else {
            messageControl('發生錯誤，即將跳轉至首頁', false)
          }
        })
      }
    })
  }

  // 登出 刪除token
  const signOut = () => {
    if (localStorage.getItem('user_lineID')) {
      localStorage.removeItem('user_lineID')
    }
    if (localStorage.getItem('user_role')) {
      localStorage.removeItem('user_role')
    }
    if (localStorage.getItem('user_id')) {
      localStorage.removeItem('user_id')
    }
    if (localStorage.getItem('user_line_shot')) {
      localStorage.removeItem('user_line_shot')
    }
    localStorage.removeItem('token')
    window.location.replace('/')
  }

  // 載入使用者資訊
  useEffect(() => {
    if (token) {
      setLoading(true)
      userService
        .getUserInfo(token)
        .then((res) => {
          if (res && res.success) {
            setHideAvatar(res.data.userinfo.makePictureAnonymous)
            setUserInfo(res.data)
            setLoading(false)
          }
        })
        .catch((err) => {
          messageControl('發生錯誤，即將跳轉至首頁', false)
          console.error(err)
        })
    }
  }, [token])

  return (
    <div className={`${style.user_profile}`}>
      <BackGround></BackGround>
      <div
        className="right-bottom-loading-area"
        style={{ right: loading ? '8px' : '-100%' }}>
        <div className="loading"></div>
      </div>
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
      <div className={style['container']}>
        <div
          className={style.title}
          onClick={test}>
          個人資訊
        </div>

        <div className={`${style.top_section}`}>
          {hideAvatar === false && (
            <div className={style.avatar}>
              {userInfo?.userinfo && (
                <Image
                  alt="user avatar"
                  className={style.image}
                  loading="lazy"
                  src={userInfo.userinfo.pictureUrl}
                  width={0}
                  height={0}></Image>
              )}
            </div>
          )}
          {hideAvatar === true && (
            <div className={style.avatar}>
              <Image
                alt="user avatar"
                className={style.image}
                loading="lazy"
                src={anonymous}
                width={100}
                height={0}></Image>
            </div>
          )}
          {/* 右側資訊條 */}
          <div className={`${style.info_bar}`}>
            <div className={style.content}>
              <div>真實姓名:</div>
              <div className={`${style.content_info}`}>{userInfo?.userinfo?.realname && userInfo?.userinfo?.realname}</div>
            </div>
            {!editState && (
              <div className={style.content}>
                <div>暱稱:</div>
                <div className={`${style.content_info}`}>{userInfo?.userinfo?.username && userInfo?.userinfo?.username}</div>
              </div>
            )}
            {/* 編輯用input版本 */}
            {editState && (
              <div className={style.content}>
                <div>暱稱:</div>
                <input
                  type="text"
                  className={`${style.content_info}`}
                  defaultValue={userInfo?.userinfo?.username && userInfo?.userinfo?.username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                  }}
                />
              </div>
            )}
            {/* 隱藏頭像 */}
            <div className={`${style.content}`}>
              {!editState && <div className={style['text']}>{userInfo?.userinfo?.makePictureAnonymous === true ? '已隱藏頭像' : '正常顯示頭像'}</div>}
              {editState && (
                <div
                  className={`${style['hide-avatar-option']} ${hideAvatar === true && style['active']}`}
                  onClick={() => {
                    setHideAvatar(true)
                  }}>
                  隱藏頭像
                </div>
              )}
              {editState && (
                <div
                  className={`${style['hide-avatar-option']} ${hideAvatar === false && style['active']}`}
                  onClick={() => {
                    setHideAvatar(false)
                  }}>
                  顯示頭像
                </div>
              )}
            </div>
          </div>
          {/* 按鈕們 */}
          {/* 右側區域 (綠色框) */}
          <div className={`${style.right_panel}`}>
            <div className={`${style.button_group}`}>
              <button
                className="g-blue-btn"
                onClick={() => {
                  setEditState(true)
                }}>
                編輯資訊
              </button>
              <button
                className="g-blue-btn"
                onClick={() => {
                  patchUserInfo()
                }}>
                儲存
              </button>
              <button
                className="g-red-btn"
                onClick={() => {
                  signOut()
                }}>
                登出
              </button>
            </div>
          </div>
        </div>

        <div className={`${style.bottom_section}`}>
          <div className={`${style.content_area}`}>
            <div className={style.content}>ID</div>
            <div className={`${style.content_info}`}>{userInfo?._id}</div>
          </div>
          <div className={`${style.content_area}`}>
            <div className={style.content}>LineID</div>
            <div className={`${style.content_info}`}>{userInfo?.lineID}</div>
          </div>
          <div className={`${style.content_area}`}>
            <div className={style.content}>身分組</div>
            <div className={`${style.content_info}`}>{userInfo?.role}</div>
          </div>
          <div className={`${style.content_area}`}>
            <div className={style.content}>電話</div>
            <div className={`${style.content_info}`}>{userInfo?.userinfo?.phoneNumber}</div>
          </div>
          <div className={`${style.content_area}`}>
            <div className={style.content}>創建日期</div>
            <div className={`${style.content_info}`}>{new Date(userInfo?.date).toLocaleString()}</div>
          </div>
          <div className={`${style.content_area}`}>
            <div className={`${style.hint}`}>以上是我們網站取得到的所有個人資訊</div>
          </div>
        </div>
      </div>
    </div>
  )
}
