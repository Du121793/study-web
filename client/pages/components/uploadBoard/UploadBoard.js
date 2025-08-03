import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
const MyReactQuill = dynamic(() => import('../../../components/MyReactQuill'), { ssr: false })
import { useStrictClickHandler } from '../../../method/userful'
import adminService from '../../../method/adminService'
import { useUserToken } from '../../../method/useUserToken'
// css
import style from './uploadBoard.module.css'
import btn_style from '../../../styles/global/button.module.css'

export default function UploadBoard({ setHasPop, boardInfo, setEditHasChange, editHasChange, board_id = null, whichMethod = 'upload', setShowUploadBoardUI }) {
  const token = useUserToken()
  // 控制UI顯示
  const [visibility, setVisibility] = useState(false)
  // 控制body滑動條
  const [page_body, setPage_body] = useState([])
  // 請求參數
  const [title, setTitle] = useState(boardInfo?.title ? boardInfo.title : '')
  const [content, setContent] = useState(boardInfo?.content ? boardInfo.content : '')
  const [subTitle, setSubTitle] = useState(boardInfo?.subTitle ? boardInfo.subTitle : '')
  // edit請求參數
  const [editTitle, setEditTitle] = useState(boardInfo?.title ? boardInfo.title : '')
  const [editContent, setEditContent] = useState(boardInfo?.content ? boardInfo.content : '')
  const [editSubTitle, setEditSubTitle] = useState(boardInfo?.subTitle ? boardInfo.subTitle : '')
  // 用於控制ui高度
  const uiElement = useRef(null)
  const [getUiHeight, setGetUiHeight] = useState(0)
  // 控制訊息
  const [message, setMessage] = useState('')
  const [messageStatus, setMessageStatus] = useState(false)
  const [messageColor, setMessageColor] = useState('')

  const uploadSuccess = () => {
    setGetUiHeight(0)
    page_body.style.overflow = 'auto'
    setTimeout(() => {
      setShowUploadBoardUI(false)
    }, 200)
  }

  // 新增board
  const uploadBoard = () => {
    if (title === '' || title === null || content === '' || content === null || subTitle === '' || subTitle === null) {
      return
    }
    const data = {
      title: title,
      content: content,
      subTitle: subTitle,
    }
    adminService.postBoard(token, data).then((res) => {
      if (res.success) {
        setEditHasChange(!editHasChange)
        uploadSuccess()
      }
    })
  }

  // 編輯board
  const editBoard = () => {
    if (board_id) {
      /*
        若無輸入，會用舊值
      */
      const data = { board_id: board_id, title: editTitle, subTitle: editSubTitle, content: editContent }
      adminService.putBoard(token, data).then((res) => {
        if (res.success) {
          setEditHasChange(!editHasChange)
          setShowUploadBoardUI(false)
        }
      })
    }
  }
  return (
    <div>
      <div
        className="g-blue-btn"
        onClick={() => {
          setVisibility(true)
          setHasPop(true)
        }}>
        上傳公告
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
              {/* message */}
              <div
                style={{ height: messageStatus ? '20px' : '0', padding: messageStatus ? '24px' : '0', backgroundColor: messageColor }}
                className={style['message']}>
                {message}
              </div>
              <div
                className={style['upload-board-ui']}
                ref={uiElement}
                onClick={(e) => e.stopPropagation()}>
                {whichMethod === 'edit' ? <div className={`${style['title']}`}>編輯公告</div> : <div className={style['title']}>上傳公告</div>}

                <div className={style['input-container']}>
                  <div className={style['content']}>公告標題 :</div>
                  <input
                    type="text"
                    className={style['input']}
                    defaultValue={boardInfo?.title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                      setEditTitle(e.target.value)
                    }}
                  />
                  <div className="content">副標題 :</div>
                  <input
                    type="text"
                    className={style['input']}
                    defaultValue={boardInfo?.subTitle}
                    onChange={(e) => {
                      setSubTitle(e.target.value)
                      setEditSubTitle(e.target.value)
                    }}
                  />
                </div>
                <div className={style['textarea-container']}>
                  <div className={style['content']}>公告內文</div>
                  <MyReactQuill
                    className={style['editor']}
                    value={content}
                    onChange={(value) => {
                      setContent(value)
                      setEditContent(value) // 同時更新另一個狀態
                    }}
                  />
                </div>
                <div>
                  {whichMethod === 'edit' ? (
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
