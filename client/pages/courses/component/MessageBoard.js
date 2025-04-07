import React, { useEffect, useRef } from 'react'
// 組件庫
import { useState } from 'react'

// method
import { useUserToken } from '../../../method/useUserToken'
// 傳送影片的請求
import QAMsgUpload from '../../methods/QaMsgUpload'

export default function MessageBoard({ qa_id, submitSuccess, setSubmitSuccess }) {
  const [user_role, setUser_role] = useState('')
  // 大部分api需要的token
  const token = useUserToken()
  const [uploadState, setUploadState] = useState(false)
  // 請求送出留言的參數
  const [content, setContent] = useState('')
  const [images, setImages] = useState([])
  const [video, setVideo] = useState()
  const [isPrivate, setIsPrivate] = useState(false)
  const [isBest, setIsBest] = useState(false)
  // 預覽圖片
  const [preViewImage, setPreViewImage] = useState([])
  // 按鈕綁定input
  const imageInput = useRef(null)
  // 控制訊息
  const [message, setMessage] = useState('無訊息')
  const [messageStatus, setMessageStatus] = useState(false)
  const [messageColor, setMessageColor] = useState('')
  // 綁定timeout，用於重計
  const messageTimer = useRef(null)
  const resetTimer = useRef(null)

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
  const test = () => {
    console.log(images)
  }

  useEffect(() => {
    if (!sessionStorage.getItem('user_role') || !sessionStorage.getItem('user_id')) {
      userService.getUserInfo(token).then((res) => {
        sessionStorage.setItem('user_lineID', res.data.lineID)
        sessionStorage.setItem('user_id', res.data._id)
        sessionStorage.setItem('user_line_shot', res.data.userinfo.pictureUrl)
        sessionStorage.setItem('user_role', res.data.role)
      })
    }
    const role = sessionStorage.getItem('user_role')
    if (role) {
      setUser_role(role)
    }
  })
  
  return (
    <div className="msg-board">
      <div
        style={{ height: messageStatus ? '20px' : '0', padding: messageStatus ? '24px' : '0', backgroundColor: messageColor }}
        className="message">
        {message}
      </div>
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
          可上傳最多一部影片
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
          <div
            className="ref g-blue-btn"
            onClick={() => {
              imageInput.current.click()
            }}>
            上傳圖片
          </div>
          <input
            style={{ display: 'none' }}
            ref={imageInput}
            type="file"
            onChange={(e) => {
              // 檢查是否有檔案被選取
              if (!e.target.files || !e.target.files[0]) {
                return
              }
              const selectedFile = e.target.files[0]

              // 檢查是否已經選過相同的檔案（這裡可以根據需求比對檔名或其他屬性）
              if (images.find((item) => item.name === selectedFile.name)) {
                console.log('不能上傳同樣的圖片')
              } else {
                setImages([...images, selectedFile])
                setPreViewImage([...preViewImage, selectedFile])
              }
            }}
          />
        </div>
        <div className="image-name-area">
          {images &&
            images.length > 0 &&
            images.map((item, index) => (
              <div
                className="image-name"
                key={index}>
                <div>{item.name}</div>
                <div
                  className="remove-image-btn"
                  onClick={() => {
                    setImages(
                      images.filter((obj) => {
                        return obj !== item
                      })
                    )
                  }}>
                  x
                </div>
              </div>
            ))}
        </div>
        {setUser_role && setUser_role === 'admin' && (
          <div className="is-private-checkbox-area">
            <input
              type="checkbox"
              className="checkbox"
              onChange={(e) => {
                setIsBest(e.target.checked)
              }}
            />
            是否置頂該留言
          </div>
        )}
        <div className="is-private-checkbox-area">
          <div className="input-area">
            是否匿名留言
            <input
              type="checkbox"
              className="checkbox"
              onChange={(e) => {
                setIsPrivate(e.target.checked)
              }}
            />
          </div>
          <div className="input-area">
            是否置頂留言
            <input
              type="checkbox"
              className="checkbox"
              onChange={(e) => {
                setIsBest(e.target.checked)
              }}
            />
          </div>
        </div>
        <div className="submit-btn-area">
          <QAMsgUpload
            messageControl={messageControl}
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
