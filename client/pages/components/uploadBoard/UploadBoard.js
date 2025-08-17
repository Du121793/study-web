// 組件庫
import { useState, useRef, useEffect } from 'react'
// 附加庫
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
const MyReactQuill = dynamic(() => import('../../../components/MyReactQuill'), { ssr: false })
// method
import adminService from '../../../method/adminService'
import { useUserToken } from '../../../method/useUserToken'
// css
import style from './uploadBoard.module.css'
import btn_style from '../../../styles/global/button.module.css'
// component
import MessageAnime from '../../../components/message_anime/MessageAnime'
import LoadingAnime from '../../../components/loading_anime/LoadingAnime'

export default function UploadBoard({ setShowUploadBoardUI, mode, setHasPop, boardInfo, setEditHasChange, editHasChange, board_id = null }) {
  const token = useUserToken()
  // 控制UI顯示
  const [visibility, setVisibility] = useState(false)
  // 請求參數
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [subTitle, setSubTitle] = useState('')
  // edit請求參數
  const [editTitle, setEditTitle] = useState(boardInfo?.title ? boardInfo.title : '')
  const [editContent, setEditContent] = useState(boardInfo?.content ? boardInfo.content : '')
  const [editSubTitle, setEditSubTitle] = useState(boardInfo?.subTitle ? boardInfo.subTitle : '')
  // 控制訊息
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  // ref
  const titleRef = useRef()
  const subTitleRef = useRef()
  const contentRef = useRef()
  // 初始化UX
  const initUX = () => {
    const timer = setTimeout(() => {
      setMessage('')
    }, 2000)
    setLoading(false)
    return () => {
      clearTimeout(timer)
    }
  }

  const closeUI = () => {
    setTitle('')
    setContent('')
  }

  // 新增board
  const uploadBoard = () => {
    if (title === '' || title === null || content === '' || content === null || content === '<p><br></p>') {
      setMessage('請重新確認必填欄位已填寫')
      initUX()
      return
    }
    const data = {
      title: titleRef.current.value,
      content: content,
      subTitle: subTitleRef.current.value,
    }
    adminService
      .postBoard(token, data)
      .then((res) => {
        if (res.success) {
          setEditHasChange(!editHasChange)
          setVisibility(false)
          setHasPop(false)
        } else {
          setMessage('發生錯誤')
        }
      })
      .catch(() => {
        setMessage('發生錯誤')
      })
      .finally(() => {
        initUX()
      })
  }

  // 編輯board
  const editBoard = () => {
    if (board_id) {
      // 若無輸入，會用舊值
      const data = { board_id: board_id, title: editTitle ? editTitle : boardInfo.title, subTitle: editSubTitle ? editSubTitle : boardInfo.subTitle, content: editContent ? editContent : boardInfo.content }
      adminService
        .putBoard(token, data)
        .then((res) => {
          if (res.success) {
            setEditHasChange(!editHasChange)
            setVisibility(false)
            window.location.reload()
          } else {
            setMessage('發生錯誤')
          }
        })
        .catch(() => {
          setMessage('發生錯誤')
        })
        .finally(() => {
          initUX()
        })
    }
  }

  // 檢查是從首頁開啟上傳介面還是從公告頁開啟編輯介面
  useEffect(() => {
    if (mode === 'upload') {
      setContent('')
    }
    if (mode === 'edit') {
      setContent(boardInfo?.content)
    }
  }, [visibility])

  return (
    <div>
      <div
        className="g-blue-btn"
        onClick={() => {
          setVisibility(true)
          setHasPop(true)
          if (setShowUploadBoardUI) {
            setShowUploadBoardUI(true)
          }
        }}>
        {mode === 'upload' && '上傳公告'}
        {mode === 'edit' && '編輯公告'}
      </div>
      <AnimatePresence>
        {visibility && (
          <motion.div
            className={style['upload-board-main']}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}>
            <motion.div
              className={style['upload-board-ui']}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.1 }}
              onClick={(e) => e.stopPropagation()} // 防止點到背景關閉
            >
              <div
                className={style['upload-board-ui']}
                onClick={(e) => e.stopPropagation()}>
                {message && (
                  <MessageAnime
                    message={message}
                    top="100px"
                    duration={2000}
                  />
                )}
                {loading && <LoadingAnime top={'40%'}></LoadingAnime>}
                {mode === 'edit' ? <div className={`${style['title']}`}>編輯公告</div> : <div className={style['title']}>上傳公告</div>}

                <div className={style['input-container']}>
                  <div className={style['content']}>公告標題 :</div>
                  <input
                    type="text"
                    placeholder="必填"
                    className={style['input']}
                    defaultValue={boardInfo?.title}
                    ref={titleRef}
                    onChange={(e) => {
                      setTitle(e.target.value)
                      setEditTitle(e.target.value)
                    }}
                  />
                  <div className="content">副標題 :</div>
                  <input
                    type="text"
                    placeholder="選填"
                    className={style['input']}
                    defaultValue={boardInfo?.subTitle}
                    ref={subTitleRef}
                    onChange={(e) => {
                      setSubTitle(e.target.value)
                      setEditSubTitle(e.target.value)
                    }}
                  />
                </div>
                <div className={style['textarea-container']}>
                  <div className={style['content']}>公告內文</div>
                  <MyReactQuill
                    ref={contentRef}
                    placeholder="必填"
                    className={style['editor']}
                    value={content}
                    onChange={(value) => {
                      setContent(value)
                      setEditContent(value) // 同時更新另一個狀態
                    }}
                  />
                </div>
                <div>
                  {mode === 'edit' ? (
                    <div className={style['btn-area']}>
                      <div
                        className={`${btn_style['g-blue-btn']} submit`}
                        onClick={editBoard}>
                        編輯公告
                      </div>
                      <div
                        className={btn_style['g-red-btn']}
                        onClick={() => {
                          setVisibility(false)
                          setHasPop(false)
                          setShowUploadBoardUI(false)
                        }}>
                        關閉介面
                      </div>
                    </div>
                  ) : (
                    <div className={`${style['btn-area']}`}>
                      <div
                        className={btn_style['g-red-btn']}
                        onClick={() => {
                          setVisibility(false)
                          if (setShowUploadBoardUI) {
                            setShowUploadBoardUI(false)
                          }
                        }}>
                        關閉介面
                      </div>
                      <div
                        className={btn_style['g-blue-btn']}
                        onClick={uploadBoard}>
                        上傳公告
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
