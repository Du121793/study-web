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
import EditQA from './component/EditQA'
import EditPublicQA from './component/EditPublicQA'
// public
import anonymous from '../../public/course/anonymous.png'
import star from '../../public/course/star.png'
import dbArrowLeft from '../../public/profile/doubleArrowLeft.png'
import dbArrowRight from '../../public/profile/doubleArrowRight.png'
import ArrowLeft from '../../public/profile/leftArrow.png'
import ArrowRight from '../../public/profile/rightArrow.png'

// env
const server_url = process.env.NEXT_PUBLIC_SERVER_IP
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

// 用於請求後端圖片的路由
const getImageUrl = `${server_url}/resource/questionIMG`
// --------------------------------------------------------------------------
export default function QaPage() {
  const token = useUserToken()
  const [userToken, setUserToeken] = useState('')

  // 請求參數
  const [sortBy, setSortBy] = useState('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // 控制訊息
  const [message, setMessage] = useState('無訊息')
  const [messageStatus, setMessageStatus] = useState(false)
  const [messageColor, setMessageColor] = useState('')
  // 綁定timeout，用於重計
  const messageTimer = useRef(null)
  const resetTimer = useRef(null)

  // 30分鐘，用於判斷該qa是否超過30分鐘
  const thirtyMinutes = 30 * 60 * 1000

  // 旋轉讀取
  const [loading, setLoading] = useState(false)
  // 從url獲取參數
  const router = useRouter()
  const { qa_id, courseName, course_id } = router.query
  // 顯示公開提問ui
  const [showPublicQASetting, setShowPublicQASetting] = useState(false)
  // 請求取得的資料
  const [totalPage, setTotalPage] = useState(1)
  const [isLogined, setLogined] = useState(false)
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
  // 從session存取userinfo
  const [userRole, setUserRole] = useState(null)
  const [userId, setUserId] = useState(null)
  // 控制留言區的刷新
  const [commentHasChange, setCommentHasChange] = useState(false)

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

  // 將值傳給放大圖片功能
  const clickZoomImage = (imageUrl) => {
    setZoomImage(imageUrl)
    setImageIsZoom(true)
  }

  const deleteComment = (_id) => {
    setLoading(true)
    userService.deleteComment(token, qa_id, _id).then(() => {
      userService
        .getQaComment(token, qa_id)
        .then((res) => {
          setLoading(false)
          setComments(res.data)
        })
        .catch((err) => {
          console.error(err)
        })
    })
  }

  const initQaInfo = () => {
    userService.getQaInfo(token, qa_id).then((res) => {
      if (res.success) {
        setQaInfo(res.data)
      } else {
        messageControl('發生錯誤，即將跳轉回首頁', false)
        setTimeout(() => {
          window.location(clientIp)
        }, 3000)
      }
    })
  }

  // 請求修改問題設定
  const submitTeacherSetting = (pulic, isReplied) => {
    if (qaInfo) {
      adminService.commentPublicSetting(token, qaInfo.courses, qaInfo._id, pulic, isReplied).then((res) => {
        if (res.success) {
          initQaInfo()
          messageControl('修改成功', true)
        } else {
          messageControl('發生錯誤，修改失敗', false)
        }
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

  // 參數:總頁數，中間頁數，從中間往左右總共要幾頁
  function getPage(total, thisPage, pageSize = 5) {
    if (total <= 0 || thisPage <= 0 || thisPage > total) {
      return []
    }

    let page = []
    if (total <= pageSize) {
      for (let i = 0; i < total; i++) {
        page.push(i + 1)
      }
      return page
    }

    const leftSize = Math.floor((pageSize - 1) / 2)
    const rightSize = pageSize - 1 - leftSize

    let start = Math.max(1, thisPage - leftSize)
    let end = Math.min(total, thisPage + rightSize)

    if (start === 1) {
      end = Math.min(total, pageSize)
      start = 1
    } else if (end === total) {
      start = Math.max(1, total - pageSize + 1)
      end = total
    }

    for (let i = start; i <= end; i++) {
      page.push(i)
    }

    return page
  }

  const setCommentBest = (commentId) => {
    let data = {
      commentID: commentId,
      isBest: true,
    }
    if (commentId) {
      adminService.setCommentBest(token, data, qa_id).then((res) => {
        if (res.success) {
          setCommentHasChange(!commentHasChange)
          messageControl('修改成功', true)
        } else {
          messageControl('發生錯誤', false)
        }
      })
    }
  }

  const setCommentUnbest = (commentId) => {
    let data = {
      commentID: commentId,
      isBest: false,
    }
    if (commentId) {
      adminService.setCommentBest(token, data, qa_id).then((res) => {
        if (res.success) {
          setCommentHasChange(!commentHasChange)
          messageControl('修改成功', true)
        } else {
          messageControl('發生錯誤', false)
        }
      })
    }
  }

  // 請求
  // 1. QA的資料
  // 2. QA的留言區
  useEffect(() => {
    if (token && qa_id) {
      setLoading(true)
      userService
        .getQaInfo(token, qa_id)
        .then((res) => {
          setQaInfo(res.data)
          serImage(res.data.image)
          if (res.data.image.length) {
            setManyImages(res.data.image.length)
          }
        })
        .catch((err) => console.error(err))
      userService
        .getQaComment(token, qa_id)
        .then((res) => {
          setLoading(false)
          setTotalPage(res.pagination.totalPages)
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

  useEffect(() => {
    if (token && qa_id) {
      userService
        .getQaComment(token, qa_id)
        .then((res) => {
          setTotalPage(res.pagination.totalPages)
          setComments(res.data)
        })
        .catch((err) => {
          console.error(err)
        })
    }
  }, [commentHasChange])

  // 子組件留言成功後，重新請求QA的留言資料
  useEffect(() => {
    if (token && qa_id) {
      setLoading(true)
      let data = {
        sortOrder: sortBy,
        page: page,
        pageSize: pageSize,
      }
      userService
        .getQaComment(token, qa_id, data)
        .then((res) => {
          setLoading(false)
          setTotalPage(res.pagination.totalPages)
          setComments(res.data)
        })
        .catch((err) => {
          console.error(err)
        })
    }
  }, [submitSuccess, token, qa_id, sortBy, page])

  // session
  useEffect(() => {
    if (!sessionStorage.getItem('user_role') || !sessionStorage.getItem('user_id')) {
      userService.getUserInfo(token).then((res) => {
        sessionStorage.setItem('user_lineID', res.data.lineID)
        sessionStorage.setItem('user_id', res.data._id)
        sessionStorage.setItem('user_line_shot', res.data.userinfo.pictureUrl)
        sessionStorage.setItem('user_role', res.data.role)
      })
    }
    if (sessionStorage.getItem('user_role')) {
      setLogined(true)
      const user_role = sessionStorage.getItem('user_role')
      if (user_role) {
        setUserRole(user_role)
      }
    }
    if (sessionStorage.getItem('user_id')) {
      const user_id = sessionStorage.getItem('user_role')
      if (user_id) {
        setUserId(user_id)
      }
    }
  }, [])

  return (
    <div className="qaPage-main">
      <div
        style={{ height: messageStatus ? '20px' : '0', padding: messageStatus ? '24px' : '0', backgroundColor: messageColor }}
        className="message">
        {message}
      </div>

      <div
        className="right-bottom-loading-area"
        style={{ right: loading ? '8px' : '-100%' }}>
        <div className="loading"></div>
      </div>

      {/* 編輯提問UI */}
      {showEditQAUI && (
        <EditQA
          messageControl={messageControl}
          setShowEditQAUI={setShowEditQAUI}
          question_id={qa_id}
          token={token}
          course_id={course_id}
          hadEdit={hadEdit}
          setHadEdit={setHadEdit}
          setLoading={setLoading}></EditQA>
      )}
      {/* 公開提問UI */}
      {showPublicQASetting && (
        <EditPublicQA
          token={token}
          setShowPublicQASetting={setShowPublicQASetting}
          question_id={qa_id}
          course_id={course_id}
        />
      )}
      {/* 放大圖片功能 */}
      {imageIsZoom && (
        <ImageZoom
          setImageIsZoom={setImageIsZoom}
          imageUrl={zoomImage}></ImageZoom>
      )}
      {/* header */}
      <Header
        loginState={isLogined}
        inIndex="course"
      />

      {/* 標題 title區域*/}
      <div className="qa-header">
        <div className="left">
          <button
            className="back-btn"
            onClick={() => {
              window.history.back()
            }}>
            返回課程
          </button>
        </div>
        <div className="right">
          {loading && (
            <div
              className="loading-area"
              style={{ width: '120px', height: '48px' }}></div>
          )}
          <div className="content">{courseName}</div>
          <div className="hint">{qa_id}</div>
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
                    unoptimized={true}
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

      {/* 問題詳細 */}
      <div className="qa-info-area">
        {/* 編輯qa功能 */}
        {/* 老師可以在任何時間修改QA */}
        {/* 若是學生只有在30分鐘內可以編輯QA */}
        {qaInfo && userRole && (userRole === 'teacher' || userRole === 'admin' || (userRole === 'student' && new Date(qaInfo.date).getTime() >= thirtyMinutes)) && (
          <div className="edit-qa-function-area">
            <button
              onClick={() => {
                setShowEditQAUI(true)
              }}
              className="g-blue-btn">
              編輯提問
            </button>
            <button
              className="g-blue-btn"
              onClick={() => {
                setShowPublicQASetting(true)
              }}>
              上傳至公共問題區
            </button>
            <div className="content submit">已回覆</div>
            <input
              type="checkbox"
              checked={qaInfo.replied}
              onChange={() => {
                submitTeacherSetting(qaInfo.isPublic, !qaInfo.replied)
              }}
            />
          </div>
        )}
        {loading && (
          <div
            className="loading-area"
            style={{ width: '100%', height: '48px' }}></div>
        )}
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
        <div className="sort-by-area">
          <div className="content">排序依據</div>
          <select
            onChange={(e) => {
              setSortBy(e.target.value)
            }}>
            <option value="asc">正序</option>
            <option value="desc">倒序</option>
          </select>
        </div>
        {/* 留言區域 */}
        {loading && (
          <div
            className="loading-area"
            style={{ width: '80%', height: '64px' }}></div>
        )}
        {comments &&
          comments.map((item, index) => (
            <div
              className="comment-area"
              key={index}>
              {/* 確定發文者存在 */}
              <div className="user-shot-area">
                {(item?.poster?.displayPictureUrl === '' || item?.poster?.displayPictureUrl === 'null') && (
                  <Image
                    loading="lazy"
                    className="user-shot"
                    src={anonymous}
                    width={40}
                    height={40}
                    alt="anonymous avatar"></Image>
                )}
                {item?.poster?.displayPictureUrl && (
                  <Image
                    loading="lazy"
                    className="user-shot"
                    src={item.poster.displayPictureUrl}
                    width={40}
                    height={40}
                    alt="user avatar"></Image>
                )}
              </div>
              {/* 確定發文者存在 */}
              <div className="message-info">
                <div className="message-top">
                  {item?.poster?.username ? <div className="name">{item.poster.username}</div> : <div className="name">用戶已刪除</div>}
                  {item?.date && <div className="time">{new Date(item.date).toLocaleString()}</div>}
                  {item?.isBest && (
                    <div className="isBest">
                      <Image
                        loading="lazy"
                        className="best-comment"
                        src={star}
                        width={12}
                        height={12}
                        alt="best comment icon"></Image>
                      <div
                        className="content"
                        style={{ color: '#46A3FF' }}>
                        置頂
                      </div>
                    </div>
                  )}
                  <div className="function-btn-area">
                    {/* 先確認權限，再確認是否為置頂 */}
                    {(userRole === 'teacher' || userRole === 'admin') && item?.isBest ? (
                      <div
                        onClick={() => {
                          setCommentUnbest(item._id)
                        }}
                        className="set-best-comment-btn">
                        取消置頂
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setCommentBest(item._id)
                        }}
                        className="set-best-comment-btn">
                        設為置頂
                      </div>
                    )}
                    {(userRole === 'teacher' || userRole === 'admin' || (item?.poster?._id && item.poster._id === userId)) && (
                      <div
                        onClick={() => {
                          deleteComment(item._id)
                        }}
                        className="delete-comment">
                        刪除留言
                      </div>
                    )}
                  </div>
                </div>

                {item?.content ? (
                  <div className="message-middle">{item.content}</div>
                ) : (
                  <div
                    style={{ color: 'gray', fontWeight: 'bold' }}
                    className="message-middle">
                    留言內容丟失
                  </div>
                )}

                <div className="message-bottom">
                  {/* 影片 / 圖片 */}
                  {item?.videoURL &&
                    item.videoURL.map((item, index) => (
                      <iframe
                        key={index}
                        id="iframe"
                        className="file-preview"
                        src={item}
                        title="Video Player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        width={'600px'}
                        height={'240px'}
                      />
                    ))}
                  {/* 後端回傳圖片路徑正確不使用getImageUrl調整 */}
                  {item?.image &&
                    item.image.map((item, index) => (
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
                        height={0}
                        style={{ height: 'auto' }}></Image>
                    ))}
                </div>
              </div>
            </div>
          ))}
        <div className="page-switch">
          <Image
            alt="switch back to first page icon"
            src={dbArrowLeft}
            className="page-switcher"
            width={24}
            height={24}
            onClick={() => {
              setPage(1)
            }}></Image>
          <Image
            alt="switch back one page icon"
            src={ArrowLeft}
            className="page-switcher"
            width={24}
            height={24}
            onClick={() => {
              if (page === 1) {
                return
              } else {
                setPage((prop) => prop - 1)
              }
            }}></Image>
          {getPage(totalPage, page).map((item, index) => {
            if (page === item) {
              return (
                <div
                  key={index}
                  className="now-page active">
                  {item}
                </div>
              )
            }
            return (
              <div
                onClick={() => {
                  setPage(item)
                }}
                key={index}
                className="now-page">
                {item}
              </div>
            )
          })}
          <Image
            alt="switch next to left page icon"
            src={ArrowRight}
            className="page-switcher"
            width={24}
            height={24}
            onClick={() => {
              if (page === totalPage) {
                return
              } else {
                setPage((prop) => prop + 1)
              }
            }}></Image>
          <Image
            alt="switch next one page icon"
            src={dbArrowRight}
            className="page-switcher"
            width={24}
            height={24}
            onClick={() => {
              setPage(totalPage)
            }}></Image>
        </div>
      </div>
    </div>
  )
}
