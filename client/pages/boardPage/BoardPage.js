// 庫
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
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
import DOMPurify from 'dompurify'
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
  const [message, setMessage] = useState('')
  const [messageStatus, setMessageStatus] = useState(false)
  const [messageColor, setMessageColor] = useState('')
  const [popUp, setHasPop] = useState(false)

  const initUX = () => {
    const timer = setTimeout(() => {
      setMessage('')
    }, 2000)
    setLoading(false)
    return () => {
      clearTimeout(timer)
    }
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
  
  // 允許的 iframe 來源（可按需增減）
  const ALLOWED_IFRAME_RULES = [
    // YouTube 只放行 /embed/
    { domain: 'youtube.com', pathPrefix: '/embed/' },
    { domain: 'youtube-nocookie.com', pathPrefix: '/embed/' },

    // 你要放行的 Google 服務（路徑限制可放寬成 '/'）
    { domain: 'google.com', pathPrefix: '/' },
    { domain: 'facebook.com', pathPrefix: '/' },
    { domain: 'vimeo.com', pathPrefix: '/' },
  ]

  function isSubdomainOf(hostname, domain) {
    return hostname === domain || hostname.endsWith('.' + domain)
  }

  function matchAllowed(url) {
    return (
      url.protocol === 'https:' &&
      ALLOWED_IFRAME_RULES.some(function (rule) {
        return isSubdomainOf(url.hostname, rule.domain) && url.pathname.indexOf(rule.pathPrefix) === 0
      })
    )
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    const hook = function (node, data) {
      if (data.tagName !== 'iframe') return

      const src = node.getAttribute('src') || ''
      try {
        const url = new URL(src, window.location.origin)
        if (!matchAllowed(url)) {
          node.remove() // 非白名單 → 刪掉
          return
        }

        // 最小權限：加 sandbox/allow 等屬性
        node.setAttribute('sandbox', ['allow-scripts', 'allow-same-origin', 'allow-presentation', 'allow-popups', 'allow-popups-to-escape-sandbox', 'allow-picture-in-picture'].join(' '))

        node.setAttribute('allow', ['accelerometer', 'autoplay', 'clipboard-write', 'encrypted-media', 'picture-in-picture', 'web-share'].join('; '))

        node.setAttribute('loading', 'lazy')
        node.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin')
        node.setAttribute('frameborder', '0')
        node.setAttribute('allowfullscreen', 'true') // 需要全螢幕就保留
      } catch (e) {
        node.remove()
      }
    }

    DOMPurify.addHook('uponSanitizeElement', hook)
    return () => {
      // 清掉這類 hook，避免重複註冊
      DOMPurify.removeHook('uponSanitizeElement')
    }
  }, [])

  // 獲取公告
  useEffect(() => {
    if (board_id) {
      setLoading(true)
      userService
        .getBoardsById(board_id)
        .then((res) => {
          if (res.success) {
            // 根據回傳資料結構不同做處理
            const board = Array.isArray(res.data) ? res.data[0] : res.data.boards ? res.data.boards[0] : res.data
            setBoardInfo(board)
          } else {
            setMessage('發生錯誤')
          }
        })
        .catch((err) => {
          console.log(err)
        })
        .finally(() => {
          initUX()
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
        {boardInfo?.title && <div className={style['content']}>{boardInfo.title}</div>}
        {boardInfo?.subTitle && <div className={style['subTitle']}>{boardInfo?.subTitle}</div>}
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
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(boardInfo?.content || '', {
                ADD_TAGS: ['iframe'],
                ADD_ATTR: ['src', 'class', 'title', 'loading', 'referrerpolicy', 'sandbox', 'allow', 'frameborder', 'allowfullscreen'],
              }),
            }}
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
