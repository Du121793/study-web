// 庫
import { useRouter } from 'next/router'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
// globel component
import Header from '../../components/header/Header'
import Footer from '../../components/footer/Footer'
// method
import userService from '../../method/userService'
import { useUserToken } from '../../method/useUserToken'
import adminService from '../../method/adminService'
// component
import UploadBoard from '../components/uploadBoard/UploadBoard'

import style from './boardPage.module.css'

// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

export default function BoardPage() {
  const token = useUserToken()
  const router = useRouter()
  const { board_id } = router.query // 拿到id
  const [loginState, setLoginState] = useState(false)
  const [showUploadBoardUI, setShowUploadBoardUI] = useState(false)
  const [uploadBoardUIHeight, setUploadBoardUIHeight] = useState(0)
  const [editHasChange, setEditHasChange] = useState(false)
  // 從sessionStorage獲取userRole
  const [userRole, setUserRole] = useState(null)
  // 初始設為 null，代表尚未取得公告資料
  const [boardInfo, setBoardInfo] = useState(null)
  // 二次確認刪除
  const [dbcheckDelete, setDbcheckDelete] = useState(false)
  // loading anime
  const [loading, setLoading] = useState(false)
  // 控制訊息
  const [message, setMessage] = useState('無訊息')
  const [messageStatus, setMessageStatus] = useState(false)
  const [messageColor, setMessageColor] = useState('')
  const [popUp, setHasPop] = useState(false)

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

  // 獲取公告
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

  /* 檢查是否有登陸 */
  useEffect(() => {
    if (localStorage.getItem('user_role')) {
      const role = localStorage.getItem('user_role')
      setUserRole(role)
      if (role) {
        setLoginState(true)
      }
    }
  }, [])

  return (
    <div className={style['board-page-main']}>
      <div className="messaege-area">
        <div
          style={{ height: messageStatus ? '20px' : '0', padding: messageStatus ? '24px' : '0', backgroundColor: messageColor }}
          className="message">
          {message}
        </div>
      </div>
      <div
        className={style['right-bottom-loading-area']}
        style={{ right: loading ? '8px' : '-100%' }}>
        <div className="loading"></div>
      </div>
      <div className={style['header']}>
        <Header
          loginState={loginState}
          inIndex="public"
        />
      </div>
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
        <div className={style['g-btn-area']}>
          <Link
            href={clientIp}
            className="g-black-btn">
            回到上一頁
          </Link>
          <UploadBoard
            setHasPop={setHasPop}
            mode={'edit'}
            board_id={board_id}
            setEditHasChange={setEditHasChange}
            boardInfo={boardInfo}></UploadBoard>
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
        className={style[`main-title-area`]}
        style={{ whiteSpace: 'pre-wrap' }}>
        {boardInfo?.title && boardInfo?.subTitle && <div className={style['content']}>{boardInfo.title}</div>}
        {boardInfo?.title && boardInfo?.subTitle && <div className={style['subTitle']}>{boardInfo?.subTitle}</div>}
        {!boardInfo?.title && (
          <div
            className="loading-area"
            style={{ width: '120px', height: '48px' }}></div>
        )}
      </div>

      {/* board info area */}
      {boardInfo && (
        <div className={style['announcement']}>
          <div
            className={style['announcement-body']}
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
            <div className={style['announcement-footer']}>
              Posted by {boardInfo.poster.username} on {new Date(boardInfo.date).toLocaleString()}
            </div>
          )}
        </div>
      )}
      <div className={style['footer-area']}>
        <Footer></Footer>
      </div>
    </div>
  )
}
