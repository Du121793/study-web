import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'

// method
import { useUserToken } from '../../../method/useUserToken'
import adminService from '../../../method/adminService'
import userService from '../../../method/userService'
// component
import StudentSelector from '../component/student_selector/StudentSelector'
import VideoSelector from '../component/video_selector/VideoSelector'
import AccessStudentList from '../component/access_student_list/AccessStudentList'
import AccessVideoList from '../component/access_video_list/AccessVideoList'
import LoadingAnime from '../../../components/loading_anime/LoadingAnime'
import MessageAnime from '../../../components/message_anime/MessageAnime'

// public
import editIcon from '../../../public/global/edit.png'
import removeIcon from '../../../public/global/delete.png'
import Header from '../../../components/header/Header'

// style
import style from './style.module.css'

// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

export default function AccessSetting() {
  const token = useUserToken()
  const router = useRouter()
  const { course_name, course_id } = router.query
  // 請求參數
  const [isPrivate, setIsPrivate] = useState(true)
  // 控制新增權杖狀態
  const [isClickAdd, setIsClickAdd] = useState(false)
  // 控制學生選擇器狀態
  const [showStudentSelector, setShowStudentSelector] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState([])
  // 控制影片選擇器狀態
  const [showVideoSelector, setShowVideoSelector] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState([])
  // 控制授權學生清單
  const [showAccessStudentList, setShowAccessStudentList] = useState(false)
  // 控制授權影片清單
  const [showAccessVideoList, setShowAccessVideoList] = useState(false)
  // 控制選擇的清單的id給子組件
  const [choseAccessId, setChoseAccessId] = useState(null)
  // 控制編輯狀態
  const [editStatus, setEditStatus] = useState(false)
  // 是否選擇無期限
  const [isInfiniite, setIsInfiniite] = useState(false)
  // 時間狀態
  const [overDate, setOverDate] = useState(null)
  // 名稱狀態
  const [accessName, setAccessName] = useState('')
  // 二次確認刪除
  const [deleteDoubleCheck, setDeleteDoubleCheck] = useState(null)
  // 編輯access狀態
  const [editAccessId, setEditAccessId] = useState('')
  const [editAccessName, setEditAccessName] = useState('')
  const [editAccessDate, setEditAccessDate] = useState('')
  const [editisInfiniite, setEditIsInfiniite] = useState(false)
  const [editIsPrivate, setEditIsPrivate] = useState(true)
  // header login state
  const [loginState, setLoginState] = useState(false)
  // UX
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [fatherMessage, setFatherMessage] = useState('')
  // 請求存取
  const [accessInfo, setAccessInfo] = useState(null) // 獲得所有權杖狀態
  const [allStds, setAllStds] = useState([]) // 獲得所有學生
  const [allVdos, setAllVdos] = useState([]) // 獲得所有影片

  const test = () => {}

  const initMessage = () => {
    const timer = setTimeout(() => {
      setMessage('')
    }, 2000)
    return () => clearTimeout(timer)
  }

  // 新增權杖
  const submitNewAccess = () => {
    try {
      if (selectedVideo && selectedStudent && (overDate || isInfiniite)) {
        let data = {
          accessName: accessName,
          videoIDs: selectedVideo,
          studentIDs: selectedStudent,
          accessDate: overDate ? overDate : null,
          unlimited: isInfiniite ? isInfiniite : null,
          setPrivate: isPrivate,
        }
        setLoading(true)
        adminService.addNewVideoAccess(token, course_id, data).then((res) => {
          if (res && res.success) {
            setMessage('新增成功')
            adminService.getAccessAllInfo(token, course_id).then((res) => {
              if (res.success === true) {
                setAccessInfo(res.data)
                setLoading(false)
              } else {
                setMessage('發生錯誤')
              }
            })
          } else {
            setMessage('發生錯誤')
            return
          }
        })
      } else {
        setMessage('名稱或結束日期不能為空')
      }
    } catch (err) {
      setMessage('發生錯誤')
    }
    initMessage()
  }

  //刪除權杖
  const deleteAccess = (access_id) => {
    try {
      if (deleteDoubleCheck && access_id && course_id) {
        adminService.deleteAccess(token, course_id, access_id).then((res) => {
          adminService
            .getAccessAllInfo(token, course_id)
            .then((res) => {
              if (res?.success === true) {
                setMessage('刪除成功')
                setAccessInfo(res.data)
              }
            })
            .catch((err) => {
              setMessage('刪除失敗')
              console.error(err)
            })
        })
      }
    } catch (err) {
      setMessage('發生錯誤:')
    }
    initMessage()
  }

  //編輯權杖
  const submitEditAccess = () => {
    if (editAccessName === '') {
      setMessage(`名稱不能為空`)
      return
    }
    let data = {
      accessName: editAccessName,
      accessDate: editAccessDate,
      unlimited: editAccessDate === null ? true : false,
      setPrivate: editIsPrivate,
    }
    try {
      adminService.editAccessInfo(token, course_id, editAccessId, data).then((res) => {
        if (res.success === true) {
          setEditStatus(!editStatus)
          setMessage(`編輯成功`)
        } else {
          setMessage(`發生錯誤${res.data.msg}`)
        }
      })
    } catch (err) {
      setMessage(`發生錯誤:${err}`)
    }
    initMessage()
  }

  // 獲得該課程的權杖
  useEffect(() => {
    if (!token || !course_id) return
    setLoginState(true) // 登陸狀態
    adminService
      .getAccessAllInfo(token, course_id)
      .then((res) => {
        if (res.success === true) {
          setAccessInfo(res.data)
        } else {
          setMessage('發生錯誤，取得資料失敗')
        }
      })
      .catch((err) => {
        setMessage('發生錯誤，取得資料失敗')
        console.error(err)
      })
      .finally(() => {
        setLoading(false)
        initMessage()
      })
  }, [token, course_id, editStatus])

  // 取得所有(學生 / 影片)
  useEffect(() => {
    if (!token || !course_id) return
    // 學生
    const params = { courses: course_id }
    adminService
      .getMembers(token, params)
      .then((res) => {
        // 過濾學生
        const studentArr = res.data.filter((item) => {
          if (item.role === 'student') return item
        })
        setAllStds(studentArr)
      })
      .catch((err) => {
        console.error(err)
        setMessage('發生錯誤，獲取資料失敗')
      })
      .finally(() => {
        setLoading(false)
        initMessage()
      })
    // 影片
    const data = {
      type: 'MainClass',
      pageSize: Infinity,
      course_id,
    }
    userService
      .getVideoInfo(token, course_id, data)
      .then((res) => {
        setAllVdos(res.data)
      })
      .catch((err) => {
        console.error(err)
        setMessage('發生錯誤，獲取資料失敗')
      })
      .finally(() => {
        setLoading(false)
        initMessage()
      })
  }, [token, course_id])

  return (
    <div className={style['access-setting-main']}>
      {loading && <LoadingAnime></LoadingAnime>}
      {message && (
        <MessageAnime
          message={message}
          top="100px"
          duration={2000}></MessageAnime>
      )}
      {fatherMessage && (
        <MessageAnime
          message={fatherMessage}
          top="100px"
          duration={2000}></MessageAnime>
      )}
      <Header
        loginState={loginState}
        inIndex="course"></Header>
      <div className={style['btn-area']}>
        <Link
          href={{ pathname: `${clientIp}/course`, query: { courseName: course_name, courseId: course_id } }}
          className={style['back-btn']}>
          返回課程
        </Link>
      </div>
      <div className={style['main-container']}>
        <div className={style['header']}>
          <div
            className={style['title']}
            onClick={test}>
            變更影片權限功能
          </div>
          <div
            className="g-blue-btn"
            onClick={() => {
              setIsClickAdd(!isClickAdd)
            }}>
            新增權杖
          </div>
        </div>
        {/* 新增UI */}
        {isClickAdd && (
          <div className={style['add-area']}>
            <div className={style['name-area']}>
              <div className={style['content']}>名稱:</div>
              <input
                type="text"
                placeholder="請輸入名稱"
                onChange={(e) => {
                  setAccessName(e.target.value)
                }}
              />
            </div>
            <div className={style['studen-area']}>
              <div className={style['content']}>學生人數 {selectedStudent.length} 。</div>
              <StudentSelector
                course_id={course_id}
                showStudentSelector={showStudentSelector}
                setShowStudentSelector={setShowStudentSelector}
                selectedStudent={selectedStudent}
                setSelectedStudent={setSelectedStudent}></StudentSelector>
            </div>
            <div className={style['video-area']}>
              <div className={style['content']}>影片數量 {selectedVideo.length} 。</div>
              <VideoSelector
                course_id={course_id}
                showVideoSelector={showVideoSelector}
                setShowVideoSelector={setShowVideoSelector}
                selectedVideo={selectedVideo}
                setSelectedVideo={setSelectedVideo}></VideoSelector>
            </div>
            <div className={style['dateSetting-area']}>
              <div className={style[('content', 'title')]}>結束日期設定</div>
              <div className={style['infinity-option-area']}>
                <div className={style['content']}>無期限</div>
                <input
                  type="checkbox"
                  onChange={(e) => {
                    setIsInfiniite(e.target.checked)
                    setOverDate(null)
                  }}
                />
              </div>

              {!isInfiniite && (
                <input
                  type="datetime-local"
                  onChange={(e) => {
                    setOverDate(e.target.value)
                  }}
                  className={style['video-record-date']}
                />
              )}
            </div>
            <div className={style['is-private']}>
              <div className={style['content']}>將影片設為私人</div>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => {
                  setIsPrivate(e.target.checked)
                }}
              />
              {!isPrivate && <div className={style['hint']}>若關閉此設定，設定公開的影片會維持公開，但他將不會套用此權杖</div>}
            </div>
            <div
              className="g-green-btn"
              onClick={submitNewAccess}>
              新增
            </div>
          </div>
        )}

        {accessInfo &&
          accessInfo.map((item, index) => (
            <div
              className={style['access-info']}
              key={index}>
              <div className={style['name-area']}>
                權杖名稱 :
                {editAccessId === item._id ? (
                  <input
                    className={style['input-area']}
                    placeholder={item.accessName}
                    onChange={(e) => {
                      setEditAccessName(e.target.value)
                    }}></input>
                ) : (
                  <div className={style['name']}>{item.accessName}</div>
                )}
              </div>

              <div className={style['date-area']}>
                期限 :
                {editAccessId === item._id ? (
                  <div>
                    {!editisInfiniite && (
                      <input
                        className={style['input-area']}
                        type="datetime-local"
                        placeholder="輸入時間"
                        onChange={(e) => {
                          setEditAccessDate(e.target.value)
                        }}></input>
                    )}
                    無期限
                    <input
                      type="checkbox"
                      onClick={(e) => {
                        setEditIsInfiniite(e.target.checked)
                      }}
                    />
                  </div>
                ) : (
                  <div className={style['time']}>{item.accessDate === null ? '永久' : new Date(item.accessDate).toLocaleString()}</div>
                )}
              </div>
              <div className={style['student']}>
                <div className={style['content']}>學生人數 : {item.studentIDs.length}</div>
              </div>
              <div className={style['video']}>
                <div className={style['content']}>影片數量 : {item.videoIDs.length}</div>
              </div>

              <AccessStudentList
                allStds={allStds}
                accessInfo={accessInfo}
                course_id={course_id}
                choseAccessId={item._id}
                editStatus={editStatus}
                setEditStatus={setEditStatus}
                setFatherMessage={setFatherMessage}></AccessStudentList>

              <AccessVideoList
                allVdos={allVdos}
                accessInfo={accessInfo}
                course_id={course_id}
                choseAccessId={item._id}
                editStatus={editStatus}
                setEditStatus={setEditStatus}
                setFatherMessage={setFatherMessage}></AccessVideoList>
              {editAccessId === item._id && (
                <div className={style['edit-area']}>
                  <div className={style['content']}>將影片設為私人</div>
                  <input
                    type="checkbox"
                    checked={editIsPrivate}
                    onChange={(e) => {
                      setEditIsPrivate(e.target.checked)
                    }}></input>
                </div>
              )}
              <div className={style['image-area']}>
                {editAccessId === item._id && (
                  <div
                    className={style['complate-btn']}
                    onClick={() => {
                      setEditAccessId('')
                      submitEditAccess()
                    }}>
                    完成
                  </div>
                )}
                {editAccessId !== item._id && (
                  <Image
                    src={editIcon}
                    className={style['image']}
                    alt="edit icon"
                    width={20}
                    height={20}
                    onClick={() => {
                      setEditAccessId(item._id)
                    }}></Image>
                )}
                {deleteDoubleCheck !== item._id && (
                  <Image
                    src={removeIcon}
                    className={style['image']}
                    alt="delete icon"
                    width={20}
                    height={20}
                    onClick={() => {
                      setDeleteDoubleCheck(item._id)
                    }}></Image>
                )}
                {deleteDoubleCheck === item._id && (
                  <div className={style['double-check-area']}>
                    <div
                      className={style['confirm-btn']}
                      onClick={() => {
                        setDeleteDoubleCheck(null)
                        setChoseAccessId(item._id)
                        deleteAccess(item._id)
                      }}>
                      確定
                    </div>

                    <div className={style['content']}>確定刪除嗎?</div>
                    <div
                      className={style['cancel-btn']}
                      onClick={() => {
                        setDeleteDoubleCheck(null)
                      }}>
                      取消
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
