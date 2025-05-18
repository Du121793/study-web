// 庫
import { useRouter } from 'next/router'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
// globel component
import Header from '../../components/global/Header'
import Footer from '../../components/global/Footer'
// method
import userService from '../../method/userService'
import { useUserToken } from '../../method/useUserToken'
import adminService from '../../method/adminService'
// child component
import UploadBoard from '../components/UploadBoard'
// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

export default function BoardPage() {
  const token = useUserToken()
  const router = useRouter()
  const { board_id } = router.query
  const [loginState, setLoginState] = useState(false)
  const [showUploadBoardUI, setShowUploadBoardUI] = useState(false)
  const [uploadBoardUIHeight, setUploadBoardUIHeight] = useState(0)
  const [whichMethod, setWhichMethod] = useState('edit')
  const [editHasChange, setEditHasChange] = useState(false)
  // 用於開關UI時覆蓋所有內部元素
  const [visibility, setVisibility] = useState('visible')
  // 從sessionStorage獲取userRole
  const [userRole, setUserRole] = useState(null)
  // 初始設為 null，代表尚未取得公告資料
  const [boardInfo, setBoardInfo] = useState(null)
  // 編輯公告
  const [editBoard, setEditBoard] = useState(false)
  // 二次確認刪除
  const [dbcheckDelete, setDbcheckDelete] = useState(false)
  // loading anime
  const [loading, setLoading] = useState(false)
  // 控制訊息
  const [message, setMessage] = useState('無訊息')
  const [messageStatus, setMessageStatus] = useState(false)
  const [messageColor, setMessageColor] = useState('')
  // 綁定timeout，用於重計
  const messageTimer = useRef(null)
  const resetTimer = useRef(null)

  const test = () => {
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

  // 刪除公告
  const deletBoard = () => {
    setLoading(true)
    adminService.deleteBoard(token, boardInfo._id).then((res) => {
      if (res?.success) {
        setLoading(false)
        window.location.href = `${clientIp}`
      } else {
        setLoading(false)
        messageControl('發生錯誤，刪除失敗', false)
      }
    })
  }

  // get Board info by id
  useEffect(() => {
    if (board_id) {
      setLoading(true)
      userService.getBoardsById(board_id).then((res) => {
        setLoading(false)
        if (res.success) {
          // 根據回傳資料結構不同做處理
          const board = Array.isArray(res.data) ? res.data[0] : res.data.boards ? res.data.boards[0] : res.data
          setBoardInfo(board)
        }
      })
    }
  }, [token, board_id, editHasChange])

  // check sessionStorage
  useEffect(() => {
    if (sessionStorage.getItem('user_role')) {
      const role = sessionStorage.getItem('user_role')
      setUserRole(role)
      if (role) {
        setLoginState(true)
      }
    }
  }, [])

  return (
    <div className="board-page-main">
      <div className="messaege-area">
        <div
          style={{ height: messageStatus ? '20px' : '0', padding: messageStatus ? '24px' : '0', backgroundColor: messageColor }}
          className="message">
          {message}
        </div>
      </div>

      <div
        className="right-bottom-loading-area"
        style={{ right: loading ? '8px' : '-100%' }}>
        <div className="loading"></div>
      </div>
      <Header
        loginState={loginState}
        inIndex="public"
      />
      {showUploadBoardUI && (
        <UploadBoard
          boardInfo={boardInfo}
          visibility={visibility}
          setVisibility={setVisibility}
          setShowUploadBoardUI={setShowUploadBoardUI}
          setUploadBoardUIHeight={setUploadBoardUIHeight}
          uploadBoardUIHeight={uploadBoardUIHeight}
          whichMethod={whichMethod}
          board_id={board_id}
          setEditHasChange={setEditHasChange}
          editHasChange={editHasChange}
        />
      )}
      {/* edit btn */}
      {userRole && userRole === 'admin' ? (
        <div className="g-btn-area">
          <Link
            href={clientIp}
            className="g-black-btn">
            回到上一頁
          </Link>
          <div
            className="g-blue-btn"
            onClick={() => {
              setShowUploadBoardUI(true)
              setTimeout(() => {
                setUploadBoardUIHeight(800)
                setVisibility('visible')
              }, 1)
            }}>
            編輯公告
          </div>
          {!dbcheckDelete && (
            <div
              className="g-red-btn"
              onClick={() => {
                setDbcheckDelete(true)
              }}>
              刪除公告
            </div>
          )}
          {dbcheckDelete && (
            <div
              className="g-green-btn"
              onClick={() => {
                deletBoard()
              }}>
              確定刪除
            </div>
          )}
          {dbcheckDelete && (
            <div
              className="g-red-btn"
              onClick={() => {
                setDbcheckDelete(false)
              }}>
              取消
            </div>
          )}
        </div>
      ) : (
        <div className="g-btn-area">
          <Link
            href={clientIp}
            className="g-black-btn">
            回到上一頁
          </Link>
        </div>
      )}

      <div
        className={`main-title-area`}
        style={{ whiteSpace: 'pre-wrap' }}>
        {boardInfo?.title && boardInfo?.subTitle && <div className="content">{boardInfo.title}</div>}
        {boardInfo?.title && boardInfo?.subTitle && <div className="subTitle">{boardInfo?.subTitle}</div>}
        {!boardInfo?.title && (
          <div
            className="loading-area"
            style={{ width: '120px', height: '48px' }}></div>
        )}
      </div>

      {/* board info area */}
      {boardInfo && (
        <div className="announcement">
          <div
            className="announcement-body"
            style={{ whiteSpace: 'pre-wrap' }}
            // 根據 content 的順序渲染所有元素（文字、圖片等）
            dangerouslySetInnerHTML={{ __html: boardInfo.content }}
          />
          {!boardInfo?._id && (
            <div
              className="loading-area"
              style={{ margin: '0 auto', width: '90%', height: '32px' }}></div>
          )}
          {boardInfo.poster && (
            <div className="announcement-footer">
              Posted by {boardInfo.poster.username} on {new Date(boardInfo.date).toLocaleString()}
            </div>
          )}
        </div>
      )}
      <div className="footer-area">
        <Footer></Footer>
      </div>
    </div>
  )
}
