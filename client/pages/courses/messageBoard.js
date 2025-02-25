import React from 'react'
// 組件庫
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// global組件

// method
import { useUserToken } from '../methods/service/useUserToken'
import userService from '../methods/service/userService'

// 傳送影片的請求
// import {startTusUpload} from '../methods/qaMsgUpload.js'
import QAMsgUpload from '../methods/qaMsgUpload'

const MessageBoard = () => {
  // 從url獲取參數
  const router = useRouter()
  const { course_id } = router.query
  const question_id = '67bd66c2032865bc616bf2cc'

  // 大部分api需要的token
  const token = useUserToken()

  // 登陸狀態
  const [userInfo, setUserInfo] = useState(null)

  // 請求送出留言的參數
  const [content, setContent] = useState('')
  const [images, setImages] = useState([])
  const [video, setVideo] = useState()
  const [isPrivate, setIsPrivate] = useState(false)
  const [isBest, setIsBest] = useState(false)

  // 用於新增新的上傳檔案
  const [files, setFiles] = useState([''])

  // 請求使用者資料與設定登陸狀態
  useEffect(() => {
    if (token) {
      userService
        .getUserInfo(token)
        .then((res) => {
          setUserInfo(res.data)
          setLogined(true)
        })
        .catch((err) => console.error('Error:', err.message))
    }
  }, [token])

  // 送出留言
  // 67bb6569c646a56b343ed51c
  const submitMsg = () => {
    userService
      .submitQaMessage(token, question_id, {
        content,
        image: images,
        fileSize: video.size,
        isPrivate,
        isBest,
      })
      .then((res) => {
        console.log(res)

        // 上傳影片
        // startTusUpload(token,res.data.uploadLink,res.data.commentID,video)
      })
  }

  const test = () => {
    console.log(images)
  }

  return (
    <div className="msg-board">
      <QAMsgUpload
        token={token}
        file={video}
        question_id={question_id}
        content={content}
        images={images}
        fileSize={video && video.size}
        isPrivate={isPrivate}
        isBest={isBest}></QAMsgUpload>
      <textarea
        type="text-area"
        className="text-area"
        placeholder="請輸入文字"
        onChange={(e) => {
          setContent(e.target.value)
        }}></textarea>
      <div className="settings-area">
        <div className="upload-video-btn-area">
          可傳送最多一部影片
          <input
            type="file"
            className="file-input"
            accept="video/mp4"
            onChange={(e) => {
              setVideo(e.target.files[0])
            }}
          />
        </div>
        <div className="upload-video-btn-area">
          可傳送多張圖片
          {files.map((index) => (
            <input
              key={index}
              type="file"
              className="file-input"
              accept="image/png image/jpg"
              onChange={(e) => {
                setFiles([...files, ''])
                setImages([...images, e.target.files[0]])
              }}
            />
          ))}
        </div>
        <div className="is-private-checkbox-area">
          <input
            type="checkbox"
            className="checkbox"
          />
          是否隱藏該留言
        </div>
        <div className="submit-btn-area">
          <button
            className="submit"
            onClick={() => {
              submitMsg()
              test()
            }}>
            送出留言
          </button>
        </div>
      </div>
    </div>
  )
}

export default MessageBoard
