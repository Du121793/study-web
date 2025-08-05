import React, { useEffect, useRef } from 'react'
// 組件庫
import { useState } from 'react'

// method
import { useUserToken } from '../../../../method/useUserToken'
// 傳送影片的請求
import QAMsgUpload from '../../../methods/QaMsgUpload'
// style
import style from './style.module.css'
export default function MessageBoard({ qa_id, submitSuccess, setSubmitSuccess }) {
  const [user_role, setUser_role] = useState('')
  // 大部分api需要的token
  const token = useUserToken()
  // 請求送出留言的參數
  const [content, setContent] = useState('')
  const [images, setImages] = useState([])
  const [video, setVideo] = useState()
  const [isPrivate, setIsPrivate] = useState(false)
  const [isBest, setIsBest] = useState(false)
  // 預覽圖片
  const [preViewImage, setPreViewImage] = useState([])
  // 控制訊息
  const [message, setMessage] = useState('無訊息')
  const [messageStatus, setMessageStatus] = useState(false)
  const [messageColor, setMessageColor] = useState('')
  // 綁定timeout，用於重計
  const messageTimer = useRef(null)
  const resetTimer = useRef(null)
  // 用來清空message框、圖片、影片
  const textAreaRef = useRef(null)
  const imageRef = useRef(null)
  const VideoRef = useRef(null)

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

  const test = () => {}

  // 取得role與檢查是否登陸
  useEffect(() => {
    if (!localStorage.getItem('user_role') || !localStorage.getItem('user_id')) {
      userService.getUserInfo(token).then((res) => {
        localStorage.setItem('user_lineID', res.data.lineID)
        localStorage.setItem('user_id', res.data._id)
        localStorage.setItem('user_line_shot', res.data.userinfo.pictureUrl)
        localStorage.setItem('user_role', res.data.role)
      })
    }
    const role = localStorage.getItem('user_role')
    if (role) {
      setUser_role(role)
    }
  })

  return (
    <div className={style['msg-board']}>
      <div
        style={{ height: messageStatus ? '100%' : '0', transition: 'none' }}
        className={style['message']}>
        <div
          className={style['info']}
          style={{
            height: messageStatus ? '20px' : '0',
            backgroundColor: messageColor,
            padding: messageStatus ? '24px' : '0',
          }}>
          {message}
        </div>
      </div>

      <textarea
        type="text-area"
        className={style['text-area']}
        placeholder="請輸入文字"
        ref={textAreaRef}
        onChange={(e) => {
          setContent(e.target.value)
        }}></textarea>

      <div className={style['settings-area']}>
        <div
          className={style['upload-video-btn-area']}
          onClick={test}>
          可上傳最多一部影片
          <input
            type="file"
            className={style['file-input']}
            accept="video/mp4"
            ref={VideoRef}
            onChange={(e) => {
              setVideo(e.target.files[0])
            }}
          />
        </div>

        <div className={style['upload-video-btn-area']}>
          <div
            className="ref g-blue-btn"
            onClick={() => {
              imageRef.current.click()
            }}>
            上傳圖片
          </div>
          <input
            style={{ display: 'none' }}
            ref={imageRef}
            type="file"
            onChange={(e) => {
              if (!e.target.files || !e.target.files[0]) return
              const selectedFile = e.target.files[0]
              if (images.find((item) => item.name === selectedFile.name)) {
                messageControl('不能上傳同樣的圖片', false)
              } else {
                setImages([...images, selectedFile])
                setPreViewImage([...preViewImage, selectedFile])
              }
            }}
          />
        </div>

        <div className={style['image-name-area']}>
          {images?.length > 0 &&
            images.map((item, index) => (
              <div
                className={style['image-name']}
                key={index}>
                <div>{item.name}</div>
                <div
                  className={style['remove-image-btn']}
                  onClick={() => {
                    setImages(images.filter((obj) => obj !== item))
                  }}>
                  x
                </div>
              </div>
            ))}
        </div>

        {setUser_role && setUser_role === 'admin' && (
          <div className={style['is-private-checkbox-area']}>
            <input
              type="checkbox"
              className={style['checkbox']}
              onChange={(e) => {
                setIsBest(e.target.checked)
              }}
            />
            是否置頂該留言
          </div>
        )}

        <div className={style['is-private-checkbox-area']}>
          <div className={style['input-area']}>
            是否匿名留言
            <input
              type="checkbox"
              className={style['checkbox']}
              onChange={(e) => {
                setIsPrivate(e.target.checked)
              }}
            />
          </div>
          <div className={style['input-area']}>
            是否置頂留言
            <input
              type="checkbox"
              className={style['checkbox']}
              onChange={(e) => {
                setIsBest(e.target.checked)
              }}
            />
          </div>
        </div>

        <div className={style['submit-btn-area']}>
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
            textAreaRef={textAreaRef}
            imageRef={imageRef}
            VideoRef={VideoRef}
            submitSuccess={submitSuccess}
            setSubmitSuccess={setSubmitSuccess}
            setImages={setImages}
            setPreViewImage={setPreViewImage}
          />
        </div>
      </div>
    </div>
  )
}
