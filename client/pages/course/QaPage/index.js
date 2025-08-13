import React from 'react'
// 組件庫
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'

import Image from 'next/image'
import DOMPurify from 'isomorphic-dompurify'

// global組件
import Header from '../../../components/header/Header'

// method
import { useUserToken } from '../../../method/useUserToken'
import userService from '../../../method/userService'
import adminService from '../../../method/adminService'

// course component
import QaMessageBoard from './components/messageBoard/MessageBoard'
import ImageZoom from '../component/image_zoom/ImageZoom'
import EditQA from '../component/edit_qa/EditQA'
import EditPublicQA from './components/upload_to_public/EditPublicQA'
// public
import anonymous from '../../../public/course/anonymous.png'
import star from '../../../public/course/star.png'
import dbArrowLeft from '../../../public/profile/doubleArrowLeft.png'
import dbArrowRight from '../../../public/profile/doubleArrowRight.png'
import ArrowLeft from '../../../public/profile/leftArrow.png'
import ArrowRight from '../../../public/profile/rightArrow.png'

// style
import style from './style.module.css'

// env
const server_url = process.env.NEXT_PUBLIC_SERVER_IP
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

// 用於請求後端圖片的路由
const getImageUrl = `${server_url}/resource/questionIMG`

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

  // 計算天數，留言用
  function formatTimeAgo(dateString) {
    const now = new Date()
    const past = new Date(dateString)
    const diffInSeconds = Math.floor((now - past) / 1000)

    const minute = 60
    const hour = minute * 60
    const day = hour * 24
    const week = day * 7
    const month = day * 30 // 簡化為 30 天
    const year = day * 365 // 簡化為 365 天

    if (diffInSeconds < minute) {
      return '剛剛'
    } else if (diffInSeconds < hour) {
      const minutes = Math.floor(diffInSeconds / minute)
      return `${minutes} 分鐘前`
    } else if (diffInSeconds < day) {
      const hours = Math.floor(diffInSeconds / hour)
      return `${hours} 小時前`
    } else if (diffInSeconds < week) {
      const days = Math.floor(diffInSeconds / day)
      return `${days} 天前`
    } else if (diffInSeconds < month) {
      const weeks = Math.floor(diffInSeconds / week)
      return `${weeks} 週前`
    } else if (diffInSeconds < year) {
      const months = Math.floor(diffInSeconds / month)
      return `${months} 個月前`
    } else {
      const years = Math.floor(diffInSeconds / year)
      return `${years} 年前`
    }
  }

  const messageControl = (info, isSuccess) => {
    setMessage(info)
    setMessageStatus(true)
    if (isSuccess) {
      setMessageColor('rgba(195, 240, 178, 0.8)')
    } else {
      setMessageColor('rgba(240, 178, 178, 0.8)')
    }

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
          setLoading(false)
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

  const HtmlRenderer = ({ htmlString }) => {
    const clean = DOMPurify.sanitize(htmlString)
    return (
      <div
        className={style['description']}
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    )
  }

  function getPage(total, thisPage, pageSize = 5) {
    if (total <= 0 || thisPage <= 0 || thisPage > total) {
      return []
    }

    let pageArr = []
    if (total <= pageSize) {
      for (let i = 0; i < total; i++) {
        pageArr.push(i + 1)
      }
      return pageArr
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
      pageArr.push(i)
    }

    return pageArr
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
      const stored = window.localStorage.getItem('token') || ''
      setUserToeken(stored.split(' ')[1] || '')
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
          console.log(res.data)
        })
        .catch((err) => {
          console.error(err)
          setLoading(false)
        })
    }
  }, [submitSuccess, token, qa_id, sortBy, page])

  useEffect(() => {
    if (!localStorage.getItem('user_role') || !localStorage.getItem('user_id')) {
      userService.getUserInfo(token).then((res) => {
        localStorage.setItem('user_lineID', res.data.lineID)
        localStorage.setItem('user_id', res.data._id)
        localStorage.setItem('user_line_shot', res.data.userinfo.pictureUrl)
        localStorage.setItem('user_role', res.data.role)
      })
    }
    if (localStorage.getItem('user_role')) {
      setLogined(true)
      const user_role = localStorage.getItem('user_role')
      if (user_role) {
        setUserRole(user_role)
      }
    }
    if (localStorage.getItem('user_id')) {
      const user_id = localStorage.getItem('user_id')
      if (user_id) {
        setUserId(user_id)
      }
    }
  }, [token])

  return (
    <div className={style['qaPage-main']}>
      {showEditQAUI && (
        <EditQA
          messageControl={messageControl}
          setShowEditQAUI={setShowEditQAUI}
          question_id={qa_id}
          token={token}
          course_id={course_id}
          hadEdit={hadEdit}
          setHadEdit={setHadEdit}
          setLoading={setLoading}
        />
      )}

      {imageIsZoom && (
        <ImageZoom
          imageIsZoom={imageIsZoom}
          setImageIsZoom={setImageIsZoom}
          imageUrl={zoomImage}
        />
      )}
      <Header
        loginState={isLogined}
        inIndex="course"
      />

      <div className={style['qa-header']}>
        <div className={style['left']}>
          <button
            className={style['back-btn']}
            onClick={() => {
              window.history.back()
            }}>
            返回課程
          </button>
        </div>
        <div className={style['right']}>
          {loading && (
            <div
              className={style['loading-area']}
              style={{ width: '120px', height: '48px' }}></div>
          )}
          <div className={style['content']}>{courseName}</div>
          <div className={style['hint']}>{qa_id}</div>
        </div>
      </div>

      {image.length > 0 && (
        <div className={style['images-videos-area']}>
          {image.map((item, index) => (
            <div
              className={style['image-container']}
              key={index}>
              <div className={style['title']}>圖片{index + 1}</div>
              <Image
                crossOrigin="anonymous"
                className={style['image-video']}
                loading="lazy"
                unoptimized={true}
                src={`${getImageUrl}/${item}?token=${userToken}`}
                onClick={() => {
                  clickZoomImage(`${getImageUrl}/${item}`)
                }}
                alt="course has no image icon"
                width={manyImages >= 3 ? 200 : 600}
                height={0}
                style={{ height: 'auto' }}
              />
            </div>
          ))}
        </div>
      )}

      <div className={style['qa-info-area']}>
        {qaInfo && userRole && (userRole === 'teacher' || userRole === 'admin' || (userRole === 'student' && new Date(qaInfo.date).getTime() >= thirtyMinutes)) && (
          <div className={style['edit-qa-function-area']}>
            <button
              onClick={() => {
                setShowEditQAUI(true)
              }}
              className="g-blue-btn">
              編輯提問
            </button>
            <EditPublicQA
              token={token}
              setShowPublicQASetting={setShowPublicQASetting}
              question_id={qa_id}
              course_id={course_id}
            />
            <div className={`${style['content']} ${style['submit']}`}>已回覆</div>
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
            className={style['loading-area']}
            style={{ width: '100%', height: '48px' }}></div>
        )}
        <div className={style['time']}>{qaInfo && new Date(qaInfo.date).toLocaleString()}</div>
        <HtmlRenderer htmlString={qaInfo && qaInfo.description} />
      </div>

      <QaMessageBoard
        qa_id={qa_id}
        submitSuccess={submitSuccess}
        setSubmitSuccess={setSubmitSuccess}
      />

      <div className={style['qaPage-container']}>
        <div className={style['title']}>留言區</div>
        <div className={style['sort-by-area']}>
          <div className={style['content']}>排序依據</div>
          <select
            onChange={(e) => {
              setSortBy(e.target.value)
            }}
            value={sortBy}>
            <option value="asc">正序</option>
            <option value="desc">倒序</option>
          </select>
        </div>
        {loading && (
          <div
            className={style['loading-area']}
            style={{ width: '80%', height: '64px' }}></div>
        )}
        {comments &&
          comments.map((item, index) => (
            <div
              className={style['comment-area']}
              key={index}>
              <div className={style['user-shot-area']}>
                {(!item?.poster?.displayPictureUrl || item?.poster?.displayPictureUrl === '' || item?.poster?.displayPictureUrl === 'null') && (
                  <Image
                    loading="lazy"
                    className={style['user-shot']}
                    src={anonymous}
                    width={40}
                    height={40}
                    alt="anonymous avatar"
                  />
                )}
                {item?.poster?.displayPictureUrl && (
                  <Image
                    loading="lazy"
                    className={style['user-shot']}
                    src={item.poster.displayPictureUrl}
                    width={40}
                    height={40}
                    alt="user avatar"
                  />
                )}
                <div className={style['mobile-message-info']}>
                  <div className={style['left']}>{item?.poster?.username ? <div className={style['name']}>{item.poster.username}</div> : <div className={style['name']}>用戶已刪除</div>}</div>
                  <div className={style['right']}>
                    {item?.isBest && (
                      <div className={style['isBest']}>
                        <Image
                          loading="lazy"
                          className={style['best-comment']}
                          src={star}
                          width={12}
                          height={12}
                          alt="best comment icon"
                        />
                        <div
                          className={style['content']}
                          style={{ color: '#46A3FF' }}>
                          置頂
                        </div>
                      </div>
                    )}
                    {item?.date && <div className={style['time']}>{formatTimeAgo(item.date)}</div>}
                  </div>
                </div>
              </div>
              <div className={style['message-info']}>
                <div className={style['message-top']}>
                  {item?.poster?.username ? <div className={style['name']}>{item.poster.username}</div> : <div className={style['name']}>用戶已刪除</div>}
                  {item?.date && <div className={style['time']}>{new Date(item.date).toLocaleString()}</div>}
                  {item?.isBest && (
                    <div className={style['isBest']}>
                      <Image
                        loading="lazy"
                        className={style['best-comment']}
                        src={star}
                        width={12}
                        height={12}
                        alt="best comment icon"
                      />
                      <div
                        className={style['content']}
                        style={{ color: '#46A3FF' }}>
                        置頂
                      </div>
                    </div>
                  )}
                  <div className={style['function-btn-area']}>
                    {(userRole === 'teacher' || userRole === 'admin') && item?.isBest ? (
                      <div
                        onClick={() => setCommentUnbest(item._id)}
                        className={style['set-best-comment-btn']}>
                        取消置頂
                      </div>
                    ) : (
                      <div
                        onClick={() => setCommentBest(item._id)}
                        className={style['set-best-comment-btn']}>
                        設為置頂
                      </div>
                    )}
                    {(userRole === 'teacher' || userRole === 'admin' || (item?.poster?._id && item.poster._id === userId)) && (
                      <div
                        onClick={() => deleteComment(item._id)}
                        className={style['delete-comment']}>
                        刪除留言
                      </div>
                    )}
                  </div>
                </div>

                {item?.content && <div className={style['message-middle']}>{item.content}</div>}
                {!item.content && !item.videoURL && !item.image && (
                  <div
                    className={style['message-middle']}
                    style={{ color: 'gray', fontWeight: 'bold' }}>
                    留言內容丟失
                  </div>
                )}
                <div className={style['message-bottom']}>
                  {item?.videoURL &&
                    item.videoURL.map((v, idx) => (
                      <iframe
                        key={idx}
                        id="iframe"
                        className={style['file-preview']}
                        src={v}
                        title="Video Player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        width={'600px'}
                        height={'240px'}
                      />
                    ))}
                  {item?.image &&
                    item.image.map((img, idx) => (
                      <Image
                        key={idx}
                        onClick={() => {
                          clickZoomImage(img)
                        }}
                        loading="lazy"
                        className={style['file-preview']}
                        src={`${img}?token=${token.split(' ')[1]}`}
                        alt="Attached image of the commenter"
                        width={400}
                        height={0}
                        style={{ height: 'auto' }}
                      />
                    ))}
                </div>
              </div>
            </div>
          ))}
        <div className={'page-switch'}>
          <Image
            alt="switch back to first page icon"
            src={dbArrowLeft}
            className={style['page-switcher']}
            width={24}
            height={24}
            onClick={() => {
              setPage(1)
            }}
          />
          <Image
            alt="switch back one page icon"
            src={ArrowLeft}
            className={style['page-switcher']}
            width={24}
            height={24}
            onClick={() => {
              if (page === 1) return
              setPage((prop) => prop - 1)
            }}
          />
          {getPage(totalPage, page).map((item, index) => {
            if (page === item) {
              return (
                <div
                  key={index}
                  className={`${style['now-page']} ${style['active']}`}>
                  {item}
                </div>
              )
            }
            return (
              <div
                onClick={() => setPage(item)}
                key={index}
                className={style['now-page']}>
                {item}
              </div>
            )
          })}
          <Image
            alt="switch next to left page icon"
            src={ArrowRight}
            className={style['page-switcher']}
            width={24}
            height={24}
            onClick={() => {
              if (page === totalPage) return
              setPage((prop) => prop + 1)
            }}
          />
          <Image
            alt="switch next one page icon"
            src={dbArrowRight}
            className={style['page-switcher']}
            width={24}
            height={24}
            onClick={() => {
              setPage(totalPage)
            }}
          />
        </div>
      </div>
    </div>
  )
}
