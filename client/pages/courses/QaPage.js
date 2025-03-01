import React from 'react'
// 組件庫
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// global組件
import Header from '../../components/global/Header'

// method
import { useUserToken } from '../../method/useUserToken'
import userService from '../../method/userService'

// course component
import QaMessageBoard from './MessageBoard'
// --------------------------------------------------------------------------
export default function QaPage() {
  // 從url獲取參數
  const router = useRouter()
  const { qa_id, courseName } = router.query

  // 大部分api需要的token
  const token = useUserToken()

  // 請求取得的資料
  const [isLogined, setLogined] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const [qaInfo, setQaInfo] = useState(null)

  // 獲取的留言
  const [comments, setComments] = useState([])

  // 是否有圖片狀態
  // 之後要有多張照片狀況
  const [image, serImage] = useState([])

  // 請求使用者資料與設定登陸狀態
  useEffect(() => {
    if (token && qa_id) {
      userService
        .getUserInfo(token)
        .then((res) => {
          setUserInfo(res.data)
          setLogined(true)
        })
        .catch((err) => console.log(err))
      userService
        .getQaInfo(token, qa_id)
        .then((res) => {
          setQaInfo(res.data)
          serImage(res.data.image)
        })
        .catch((err) => console.log(err))
      userService
        .getQaComment(token, qa_id)
        .then((res) => {
          setComments(res.data)
        })
        .catch((err) => {
          console.error(err)
        })
    }
  }, [token, qa_id])

  // 請求獲得該提問id的留言
  const getComments = () => {}

  const test = () => {}

  return (
    <div className="qaPage-main">
      {/* header */}
      <Header loginState={isLogined} />
      <div className="qa-header">
        <button
          className="back-btn"
          onClick={() => {
            window.history.back()
          }}>
          返回課程
        </button>
        <div
          className="title"
          onClick={test}>
          {courseName}
        </div>
      </div>

      <div className="images-videos-area">
        {image &&
          image.map((item, index) => (
            <div
              className="image-container"
              key={index}>
              <div className="title">附件{index}</div>
              <Image
                className="image-video"
                src={item}
                alt="course has no image icon"
                width={0}
                height={0}
              />
            </div>
          ))}
      </div>

      <div className="qa-info-area">
        <div className="time">{qaInfo && new Date(qaInfo.date).toLocaleString()}</div>
        <div className="description">{qaInfo && qaInfo.description}</div>
      </div>

      <QaMessageBoard qa_id={qa_id} />

      <div className="qaPage-container">
        <div className="title">留言區</div>
        {/* 留言區域 */}
        {comments &&
          comments.map((item, index) => (
            <div
              className="comment-area"
              key={index}>
              <div className="user-shot-area">
                <Image
                  src={item.poster.pictureUrl}
                  width={64}
                  height={64}
                  alt="user shot"></Image>
              </div>
              <div className="message-info">
                <div className="message-top">
                  <div className="name">{item.poster.username}</div>
                  <div className="time">{item.date}</div>
                  <div className="isBest">{item.isBest === true && '最佳留言'}</div>
                </div>
                <div className="message-middle">{item.content}</div>
                <div className="message-bottom">
                  {item.videoURL.map((item, index) => (
                    <iframe
                      key={index}
                      id="iframe"
                      className="file-preview"
                      src={item}
                      title="Video Player"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      width={'240px'}
                      height={'160px'}
                    />
                  ))}
                  {item.image.map((item, index) => (
                    <Image
                      key={index}
                      className="file-preview"
                      src={item}
                      alt="Attached image of the commenter"
                      width={190}
                      height={128}></Image>
                  ))}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
