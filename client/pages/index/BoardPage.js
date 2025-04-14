import { useRouter } from 'next/router'
import Header from '../../components/global/Header'
import { useEffect, useState } from 'react'
import userService from '../../method/userService'
import { useUserToken } from '../../method/useUserToken'
import Link from 'next/link'
import Footer from '../../components/global/Footer'
import UploadBoard from '../components/UploadBoard'
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

export default function BoardPage() {
  const token = useUserToken()
  const router = useRouter()
  const { board_id } = router.query
  const loginState = true
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

  // get Board info by id
  useEffect(() => {
    if (board_id) {
      userService.getBoardsById(board_id).then((res) => {
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
    }
  }, [])

  return (
    <div className="board-page-main">
      <Header loginState={loginState} />
      {showUploadBoardUI && (
        <UploadBoard
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
          <div className="g-red-btn">刪除公告</div>
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
      {/* board info area */}
      {boardInfo && (
        <div className="announcement">
          <div className="announcement-header">
            <div className="info">
              <div className="title">{boardInfo.title}</div>
              <div className="subTitle">{boardInfo.subTitle}</div>
            </div>
          </div>
          <div
            className="announcement-body"
            // 根據 content 的順序渲染所有元素（文字、圖片等）
            dangerouslySetInnerHTML={{ __html: boardInfo.content }}
          />
          <div className="announcement-footer">
            Posted by {boardInfo.poster.username} on {new Date(boardInfo.date).toLocaleString()}
          </div>
        </div>
      )}
      <div className="footer-area">
        <Footer></Footer>
      </div>
    </div>
  )
}
