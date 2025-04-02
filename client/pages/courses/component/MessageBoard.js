import React from 'react'
// 組件庫
import { useState } from 'react'

// global組件

// method
import { useUserToken } from '../../../method/useUserToken'
// 傳送影片的請求
// import {startTusUpload} from '../methods/qaMsgUpload.js'
import QAMsgUpload from '../../methods/QaMsgUpload'

export default function MessageBoard({ qa_id, submitSuccess, setSubmitSuccess }) {

  // 大部分api需要的token
  const token = useUserToken()

  // 請求送出留言的參數
  const [content, setContent] = useState('')
  const [images, setImages] = useState([])
  const [video, setVideo] = useState()
  const [isPrivate, setIsPrivate] = useState(false)
  const [isBest, setIsBest] = useState(false)

  // 用於新增新的上傳檔案
  const [files, setFiles] = useState([''])

  const test = () => {}

  return (
    <div className="msg-board">
      <textarea
        type="text-area"
        className="text-area"
        placeholder="請輸入文字"
        onChange={(e) => {
          setContent(e.target.value)
        }}></textarea>
      <div className="settings-area">
        <div
          className="upload-video-btn-area"
          onClick={test}>
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
          {files.map((item, index) => (
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
          <QAMsgUpload
            token={token}
            file={video}
            question_id={qa_id}
            content={content}
            images={images}
            fileSize={video && video.size}
            isPrivate={isPrivate}
            isBest={isBest}
            submitSuccess={submitSuccess}
            setSubmitSuccess={setSubmitSuccess}></QAMsgUpload>
        </div>
      </div>
    </div>
  )
}
