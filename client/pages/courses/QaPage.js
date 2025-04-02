import React, { use } from 'react'
// 組件庫
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify'

// global組件
import Header from '../../components/global/Header'

// method
import { useUserToken } from '../../method/useUserToken'
import userService from '../../method/userService'

// course component
import QaMessageBoard from './component/MessageBoard'
import ImageZoom from './component/ImageZoom'
import adminService from '../../method/adminService'
import EditQA from './QA/EditQA'

// 用於請求後端圖片的路由
const getImageUrl = 'http://localhost:8080/resource/questionIMG'
// --------------------------------------------------------------------------
export default function QaPage() {
  // 控制訊息
  const [message, setMessage] = useState('無訊息')
  const [messageStatus, setMessageStatus] = useState(false)
  const [messageColor, setMessageColor] = useState('')

  // 30分鐘，用於判斷該qa是否超過30分鐘
  const thirtyMinutes = 30 * 60 * 1000

  // 從url獲取參數
  const router = useRouter()
  const { qa_id, courseName, course_id } = router.query

  // const userToeken = window.localStorage.getItem('token').split(' ')[1]
  // 大部分api需要的token
  const token = useUserToken()

  const [userToken, setUserToeken] = useState('')
  // 請求參數
  const [isReplied, setIsReplied] = useState(false)

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

  // 控制編輯qa的ui
  const [showEditQAUI, setShowEditQAUI] = useState(false)
  const [hadEdit, setHadEdit] = useState(false)

  const [userRole, setUserRole] = useState(null)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    if (!sessionStorage.getItem('user_role') || !sessionStorage.getItem('user_id')) {
      userService.getUserInfo(token).then((res) => {
        sessionStorage.setItem('user_lineID', res.data.lineID)
        sessionStorage.setItem('user_id', res.data._id)
        sessionStorage.setItem('user_line_shot', res.data.userinfo.pictureUrl)
        sessionStorage.setItem('user_role', res.data.role)
      })
    }
    const role = localStorage.getItem('user_role')
    const user_id = localStorage.getItem('user_role')
    if (role) {
      setUserRole(role)
    }
    if (user_id) {
      setUserId(user_id)
    }
  }, [])

  // 控制訊息
  const messageControl = (info, isSuccess) => {
    setMessage(info)
    setMessageStatus(true)
    if (isSuccess) {
      setMessageColor('rgba(195, 240, 178, 0.8)')
    } else {
      setMessageColor('rgba(240, 178, 178, 0.8)')
    }
    setTimeout(() => {
      setMessageStatus(false)
      setTimeout(() => {
        setMessage('無訊息')
        setMessageColor('')
      }, 200)
    }, 2000)
  }

  // 將值傳給放大圖片功能
  const clickZoomImage = (imageUrl) => {
    setZoomImage(imageUrl)
    setImageIsZoom(true)
  }

  const deleteComment = (_id) => {
    userService.deleteComment(token, qa_id, _id).then(() => {
      userService
        .getQaComment(token, qa_id)
        .then((res) => {
          setComments(res.data)
        })
        .catch((err) => {
          console.error(err)
        })
    })
  }

  const test = () => {}

  // 請求修改問題設定
  const submitTeacherSetting = () => {
    if (qaInfo) {
      adminService
        .commentPublicSetting(token, qaInfo.courses, qaInfo._id, publicComment, isReplied)
        .then((res) => {
          console.log(res)
        })
        .catch((err) => {
          console.log(err)
        })
    }
  }

  // 渲染html元素
  const HtmlRenderer = ({ htmlString }) => {
    // sanitize() 會自動移除 <script>、事件屬性（如 onclick）等不安全標籤／屬性。
    const clean = DOMPurify.sanitize(htmlString)
    return (
      <div
        className="description"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    )
  }

  // 請求
  // 1. 使用者資料
  // 2. QA的資料
  // 3. QA的留言區
  useEffect(() => {
    if (token && qa_id) {
      console.log('跑一次')
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
    if (typeof window !== 'undefined') {
      setUserToeken(window.localStorage.getItem('token').split(' ')[1])
    }
  }, [token, qa_id, hadEdit])

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

  return (
    <div className="qaPage-main">
      <div
        style={{ height: messageStatus ? '20px' : '0', padding: messageStatus ? '24px' : '0', backgroundColor: messageColor }}
        className="message">
        {message}
      </div>

      {showEditQAUI && (
        <EditQA
          messageControl={messageControl}
          setShowEditQAUI={setShowEditQAUI}
          question_id={qa_id}
          token={token}
          course_id={course_id}
          hadEdit={hadEdit}
          setHadEdit={setHadEdit}></EditQA>
      )}
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

      {/* 圖片 */}
      {image.length > 0 && (
        <div className="images-videos-area">
          {image &&
            image.map((item, index) => {
              return (
                <div
                  className="image-container"
                  key={index}>
                  <div className="title">圖片{index + 1}</div>
                  <Image
                    crossOrigin="anonymous"
                    className="image-video"
                    loading="lazy"
                    src={`${getImageUrl}/${item}?token=${userToken}`}
                    onClick={() => {
                      clickZoomImage(`${getImageUrl}/${item}`)
                    }}
                    alt="course has no image icon"
                    // 若是圖片大於三張則縮小顯示
                    width={manyImages >= 3 ? 200 : 600}
                    height={0}
                    style={{ height: 'auto' }}
                  />
                </div>
              )
            })}
        </div>
      )}

      <div className="btn-area">
        {/* 教師功能 */}
        <div
          className="control-teacher-function"
          style={{ width: teacherFunction ? '40%' : '134px' }}>
          <div className="btn-area">
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
              <div className="replied-setting">
                <div>此問題是否已回覆</div>
                <input
                  className="checkbox"
                  type="checkbox"
                  onChange={(e) => {
                    setIsReplied(e.target.checked)
                  }}
                />
              </div>
              <div className="submit-btn">
                <button onClick={submitTeacherSetting}>送出並儲存</button>
              </div>
            </div>
          )}
        </div>
        {/* 編輯qa功能 */}
        {/* 老師可以在任何時間修改QA */}
        {/* 若是學生只有在30分鐘內可以編輯QA */}
        {userRole && (userRole === 'teacher' || userRole === 'admin' || (userRole === 'student' && new Date(qaInfo.date).getTime() >= thirtyMinutes)) && (
          <div className="edit-qa-function-area">
            <div className="form-area">
              <div
                className="title"
                onClick={() => {
                  setShowEditQAUI(true)
                }}>
                編輯提問
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 問題詳細 */}
      <div className="qa-info-area">
        <div className="time">{qaInfo && new Date(qaInfo.date).toLocaleString()}</div>
        <HtmlRenderer htmlString={qaInfo && qaInfo.description}></HtmlRenderer>
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
                  loading="lazy"
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
                  {(item.poster._id === userId || userRole === 'teacher' || userRole === 'admin') && (
                    <div
                      onClick={() => {
                        deleteComment(item._id)
                      }}
                      className="delete-comment">
                      刪除留言
                    </div>
                  )}
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
                      loading="lazy"
                      className="file-preview"
                      src={`${item}?token=${token.split(' ')[1]}`}
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
