import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
const MyReactQuill = dynamic(() => import('../../components/MyReactQuill'), { ssr: false })
import { useStrictClickHandler } from '../../method/userful'
import adminService from '../../method/adminService'
import { useUserToken } from '../../method/useUserToken'

export default function Board({ setEditHasChange, editHasChange, board_id = null, whichMethod = 'upload', setShowUploadBoardUI, setUploadBoardUIHeight, uploadBoardUIHeight, visibility, setVisibility }) {
  const token = useUserToken()
  // 控制body滑動條
  const [page_body, setPage_body] = useState([])
  // 請求參數
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [subTitle, setSubTitle] = useState('')
  // edit請求參數
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editSubTitle, setEditSubTitle] = useState('')
  // 用於控制ui高度
  const uiElement = useRef(null)
  const [getUiHeight, setGetUiHeight] = useState(0)
  // 嚴格onclick
  const strictClickCloseUI = useStrictClickHandler(() => {
    setVisibility('hidden')
    setGetUiHeight(0)
    page_body.style.overflow = 'auto'
    setTimeout(() => {
      setShowUploadBoardUI(false)
    }, 200)
  })

  const test = () => {
    console.log(content)
  }

  // 新增board
  const uploadBoard = () => {
    const data = {
      title: title,
      content: content,
      subTitle: subTitle,
    }
    adminService.postBoard(token, data).then((res) => {
      if (res.success) {
      }
    })
  }

  // 編輯board
  const editBoard = () => {
    if (board_id) {
      const data = { board_id: board_id, title: editTitle, subTitle: editSubTitle, content: editContent }
      adminService.putBoard(token, data).then((res) => {
        if (res.success) {
          setEditHasChange(!editHasChange)
        }
      })
    }
  }

  // 控制頁面scroll狀態
  useEffect(() => {
    if (uiElement?.current?.scrollHeight) {
      setGetUiHeight(uiElement.current.scrollHeight)
    }
    if (typeof document !== 'undefined') {
      setPage_body(document.querySelector('body'))
    }
    if (page_body && page_body.style) {
      page_body.style.overflow = 'hidden'
    }
  }, [page_body,uiElement])

  return (
    <div
      className="upload-board-main"
      {...strictClickCloseUI}>
      <div
        className="upload-board-ui"
        ref={uiElement}
        style={{ height: getUiHeight }}
        onClick={(e) => e.stopPropagation()}>
        {whichMethod === 'edit' ? (
          <div
            className="title"
            style={{ visibility: visibility }}
            onClick={test}>
            編輯公告
          </div>
        ) : (
          <div
            className="title"
            style={{ visibility: visibility }}
            onClick={test}>
            上傳公告
          </div>
        )}

        <div
          className="input-container"
          style={{ visibility: visibility }}>
          <div className="content">公告標題 :</div>
          <input
            type="text"
            className="input"
            onChange={(e) => {
              setTitle(e.target.value)
              setEditTitle(e.target.value)
            }}
          />
          <div className="content">副標題 :</div>
          <input
            type="text"
            className="input"
            onChange={(e) => {
              setSubTitle(e.target.value)
              setEditSubTitle(e.target.value)
            }}
          />
        </div>
        <div
          className="textarea-container"
          style={{ visibility: visibility }}>
          <div className="content">公告內文</div>
          <MyReactQuill
            value={content}
            onChange={(value) => {
              setContent(value)
              setEditContent(value) // 同時更新另一個狀態
            }}
          />
        </div>
        <div
          className="g-btn-area"
          style={{ visibility: visibility }}>
          {whichMethod === 'edit' ? (
            <div
              className="g-blue-btn submit"
              style={{ visibility: visibility }}
              onClick={editBoard}>
              編輯公告
            </div>
          ) : (
            <div
              className="g-blue-btn submit"
              style={{ visibility: visibility }}
              onClick={uploadBoard}>
              上傳公告
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
