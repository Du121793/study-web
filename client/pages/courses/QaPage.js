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

// public
import noImageIcon from '../../public/course/no-image-available-icon.jpg'

// course component
import QaMessageBoard from './MessageBoard'

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

  // 是否有圖片狀態
  // 之後要有多張照片狀況
  const [image, serImage] = useState([])

  // 請求使用者資料與設定登陸狀態
  useEffect(() => {
    if (token) {
      userService
        .getUserInfo(token)
        .then((res) => {
          setUserInfo(res.data)
          setLogined(true)
        })
        .catch((err) => console.log(err))
      userService.getQaInfo(token, qa_id).then((res) => {
        setQaInfo(res.data)
        serImage(res.data.image)
      })
      .catch((err)=>console.log('沒有圖片'))
    }
  }, [token])

  const test = () => {
    console.log(qaInfo)
    // qaInfo.image.map((item) => console.log(item))
  }

  return (
    <div className="qaPage-main">
      <Header loginState={isLogined} />
      <div className="qaPage-container">
        <div className="left-area">
          <div className="top">
            <button
              className="back-btn"
              onClick={() => {
                window.history.back()
              }}>
              返回課程
            </button>
            <div
              className="course-name-title"
              onClick={test}>
              {courseName}
            </div>
          </div>
          <div className="middle">
            <div className="image-area">
              {!image.length && (
                <Image
                  className="no-image-icon"
                  src={noImageIcon}
                  alt="course has no image icon"
                  width={1000}
                  height={100}
                />
              )}
              {image &&
                image.map((item) => (
                  <Image
                    className="images"
                    src={item}
                    alt="course has no image icon"
                    width={1000}
                    height={100}
                  />
                ))}
            </div>
          </div>
          <div className="bottom">
            <div className="qa-info-area">
              <div className="time">{qaInfo && new Date(qaInfo.date).toLocaleString()}</div>
              <div className="description">{qaInfo && qaInfo.description}</div>
            </div>
          </div>
        </div>
        <div className="right-area">
          <div className="title">
            <div className="message-board-title">留言板</div>
          </div>
          <div className="message-board-area"></div>
        </div>
      </div>
      <QaMessageBoard />
    </div>
  )
}
