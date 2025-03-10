import React, { use } from 'react'
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
import ImageZoom from './ImageZoom'
import adminService from '../../method/adminService'

// 用於請求後端圖片的路由
const getImageUrl = 'http://localhost:8080/resource/questionIMG'
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

  // 子組件成功留言後刷新留言區
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // 是否有圖片狀態
  // 之後要有多張照片狀況
  const [image, serImage] = useState([])

  // 控制圖片放大狀態
  const [imageIsZoom, setImageIsZoom] = useState(false)
  const [zoomImage, setZoomImage] = useState()

  // 控制圖片數量狀態
  const [manyImages, setManyImages] = useState(null)

  // 控制教師功能開啟與否
  const [teacherFunction, setTeacherFunction] = useState(false)
  const [publicComment, setPublicComment] = useState(false)
  // 請求
  // 1. 使用者資料
  // 2. QA的資料
  // 3. QA的留言區
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
          if (res.data.image.length) {
            setManyImages(res.data.image.length)
          }
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

  // 子組件留言成功後，重新請求QA的留言資料
  useEffect(() => {
    if (token && qa_id) {
      userService
        .getQaComment(token, qa_id)
        .then((res) => {
          setComments(res.data)
        })
        .catch((err) => {
          console.error(err)
        })
    }
  }, [submitSuccess, token, qa_id])

  // 將值傳給放大圖片功能
  const clickZoomImage = (imageUrl) => {
    setZoomImage(imageUrl)
    setImageIsZoom(true)
  }

  const test = () => {
    console.log(qaInfo)
  }

  const submitTeacherSetting = () => {
    if (qaInfo) {
      adminService
        .commentPublicSetting(token, qaInfo.courses, qaInfo._id, publicComment)
        .then((res) => {
          console.log(res)
        })
        .catch((err) => {
          console.log(err)
        })
    }
  }
  return (
    <div className="qaPage-main">
      {imageIsZoom && (
        <ImageZoom
          setImageIsZoom={setImageIsZoom}
          imageUrl={zoomImage}></ImageZoom>
      )}
      {/* header */}
      <Header loginState={isLogined} />
      {/* 標題 */}
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

      {/* 附件 */}
      <div className="images-videos-area">
        {image &&
          image.map((item, index) => (
            <div
              className="image-container"
              key={index}>
              <div className="title">附件{index + 1}</div>
              <Image
                className="image-video"
                src={`${getImageUrl}/${item}`}
                onClick={() => {
                  clickZoomImage(`${getImageUrl}/${item}`)
                }}
                alt="course has no image icon"
                // 若是圖片大於三張則縮小顯示
                width={(manyImages >= 3 && 200) || (manyImages < 3 && 600)}
                height={(manyImages >= 3 && 200) || (manyImages < 3 && 600)}
              />
            </div>
          ))}
      </div>
      {/* 教師功能 */}
      <div
        className="control-teacher-function"
        style={{ width: teacherFunction ? '40%' : '134px' }}>
        <div>
          <button
            className="control-teacher-function-btn"
            style={{ backgroundColor: teacherFunction ? '#f2bebe' : '#b5f3ad' }}
            onClick={() => {
              setTeacherFunction(!teacherFunction)
            }}>
            {teacherFunction && '關閉教師功能'}
            {!teacherFunction && '開啟教師功能'}
          </button>
        </div>
        {teacherFunction && (
          <div className="teacher-function">
            <div className="public-setting">
              <div>此問題設為公開</div>
              <input
                className="checkbox"
                type="checkbox"
                onChange={(e) => {
                  setPublicComment(e.target.checked)
                }}
              />
            </div>
            <div className="submit-btn">
              <button onClick={submitTeacherSetting}>送出並儲存</button>
            </div>
          </div>
        )}
      </div>

      {/* 問題詳細 */}
      <div className="qa-info-area">
        <div className="time">{qaInfo && new Date(qaInfo.date).toLocaleString()}</div>
        <div className="description">{qaInfo && qaInfo.description}</div>
      </div>

      {/* 留言組件 */}
      <QaMessageBoard
        qa_id={qa_id}
        submitSuccess={submitSuccess}
        setSubmitSuccess={setSubmitSuccess}
      />

      {/* 留言區 */}
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
                  className="user-shot"
                  src={item.poster.pictureUrl}
                  width={50}
                  height={50}
                  alt="user shot"></Image>
              </div>
              <div className="message-info">
                <div className="message-top">
                  <div className="name">{item.poster.username}</div>
                  <div className="time">{new Date(item.date).toLocaleString()}</div>
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
                  {/* 後端路徑正確不用用getImageUrl調整 */}
                  {item.image.map((item, index) => (
                    <Image
                      key={index}
                      onClick={() => {
                        clickZoomImage(item)
                      }}
                      className="file-preview"
                      src={item}
                      alt="Attached image of the commenter"
                      width={400}
                      height={400}></Image>
                  ))}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
