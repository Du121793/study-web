import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'

// method
import { useUserToken } from '../../method/useUserToken'
import userService from '../../method/userService'
import adminService from '../../method/adminService'

// 子組件
import StudentSelector from './StudentSelector'
import VideoSelector from './VideoSelector'
import AccessStudentList from './AccessStudentList'
import AccessVideoList from './AccessVideoList'

// public
import editIcon from '../../public/global/edit.png'
import removeIcon from '../../public/global/delete.png'

// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

export default function AccessSetting() {
  const token = useUserToken()
  const router = useRouter()
  const { course_name, course_id } = router.query
  const [userInfo, setUserInfo] = useState({})
  // 獲得所有權杖狀態
  const [accessInfo, setAccessInfo] = useState(null)
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
  // 訊息處理
  const [messageStatus, setMessageStatus] = useState(false)
  const [messageInfo, setMessageInfo] = useState('發生不明錯誤')
  const [messageColor, setMessageColor] = useState('')
  // 編輯access狀態
  const [editAccessId, setEditAccessId] = useState('')
  const [editAccessName, setEditAccessName] = useState('')
  const [editAccessDate, setEditAccessDate] = useState('')
  const [editisInfiniite, setEditIsInfiniite] = useState(false)

  // 使用者資料
  useEffect(() => {
    if (token) {
      userService.getUserInfo(token).then((res) => {
        setUserInfo(res.data)
      })
    }
    if (token && course_id) {
      adminService.getAccessAllInfo(token, course_id).then((res) => {
        if (res.success === true) {
          setAccessInfo(res.data)
        }
      })
    }
  }, [token, course_id, editStatus])

  const test = () => {
    console.log(accessInfo)
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
        }
        adminService.addNewVideoAccess(token, course_id, data).then((res) => {
          if (res && res.success) {
            messageControl('新增成功', true)
            adminService.getAccessAllInfo(token, course_id).then((res) => {
              if (res.success === true) {
                setAccessInfo(res.data)
              }
            })
          } else {
            return
          }
        })
      } else {
        messageControl('名稱或結束日期不能為空')
      }
    } catch (err) {
      messageControl('發生錯誤:', err)
    }
  }

  //刪除權杖
  const deleteAccess = (access_id) => {
    try {
      if (deleteDoubleCheck && access_id && course_id) {
        adminService.deleteAccess(token, course_id, access_id).then((res) => {
          console.log(res)
          adminService.getAccessAllInfo(token, course_id).then((res) => {
            if (res.success === true) {
              messageControl('刪除成功', true)
              setAccessInfo(res.data)
            }
          })
        })
      }
    } catch (err) {
      messageControl('發生錯誤:', err)
    }
  }

  //編輯權杖
  const submitEditAccess = () => {
    if (editAccessName === '') {
      messageControl(`名稱不能為空`, false)
      return
    }
    let data = {
      accessName: editAccessName,
      accessDate: editAccessDate,
      unlimited: editAccessDate === null ? true : false,
    }
    try {
      adminService.editAccessInfo(token, course_id, editAccessId, data).then((res) => {
        if (res.success === true) {
          setEditStatus(!editStatus)
          messageControl(`編輯成功`, true)
        } else {
          messageControl(`發生錯誤${res.data.msg}`, false)
        }
      })
    } catch (err) {
      messageControl(`發生錯誤:${err}`, false)
    }
  }

  const messageControl = (info, isSuccess) => {
    setMessageInfo(info)
    setMessageStatus(true)
    if (isSuccess) {
      setMessageColor('rgba(195, 240, 178, 0.8)')
    } else {
      setMessageColor('rgba(240, 178, 178, 0.8)')
    }
    setTimeout(() => {
      setMessageStatus(false)
      setTimeout(() => {
        setMessageInfo('發生不明錯誤')
        setMessageColor('')
      }, 200)
    }, 2000)
  }

  return (
    <div className="access-setting-main">
      <div className="components">
        {showStudentSelector && (
          <StudentSelector
            course_id={course_id}
            showStudentSelector={showStudentSelector}
            setShowStudentSelector={setShowStudentSelector}
            selectedStudent={selectedStudent}
            setSelectedStudent={setSelectedStudent}
            messageControl={messageControl}></StudentSelector>
        )}
        {showVideoSelector && (
          <VideoSelector
            course_id={course_id}
            showVideoSelector={showVideoSelector}
            setShowVideoSelector={setShowVideoSelector}
            selectedVideo={selectedVideo}
            setSelectedVideo={setSelectedVideo}></VideoSelector>
        )}
        {showAccessStudentList && (
          <AccessStudentList
            showAccessStudentList={showAccessStudentList}
            setShowAccessStudentList={setShowAccessStudentList}
            course_id={course_id}
            choseAccessId={choseAccessId}
            editStatus={editStatus}
            setEditStatus={setEditStatus}
            messageControl={messageControl}></AccessStudentList>
        )}
        {showAccessVideoList && (
          <AccessVideoList
            showAccessVideoList={showAccessVideoList}
            setShowAccessVideoList={setShowAccessVideoList}
            course_id={course_id}
            choseAccessId={choseAccessId}
            editStatus={editStatus}
            setEditStatus={setEditStatus}></AccessVideoList>
        )}
      </div>
      <div className="main-container">
        <div className="header">
          <Link
            href={{ pathname: `${clientIp}/courses/Course`, query: { courseName: course_name, courseId: course_id } }}
            className="back-btn">
            返回課程
          </Link>
          <div
            className="title"
            onClick={test}>
            變更影片權限功能
          </div>
          <div
            className="btn"
            onClick={() => {
              setIsClickAdd(!isClickAdd)
            }}>
            新增權杖
          </div>
        </div>
<<<<<<< HEAD
        {/* 新增UI */}
=======

        <div
          style={{ height: messageStatus ? '20px' : '0', padding: messageStatus ? '24px' : '0', backgroundColor: messageColor }}
          className="message">
          {messageInfo}
        </div>

>>>>>>> front-end-dev
        {isClickAdd && (
          <div className="add-area">
            <div className="name-area">
              <div className="content">名稱:</div>
              <input
                type="text"
                placeholder="請輸入名稱"
                onChange={(e) => {
                  setAccessName(e.target.value)
                }}
              />
            </div>
            <div className="studen-area">
              <div className="content">學生:</div>
              <div className="content">{selectedStudent.length}，</div>
              <div
                className="button"
                onClick={() => {
                  setShowStudentSelector(true)
                }}>
                選擇學生
              </div>
              ，
            </div>
            <div className="video-area">
              <div className="content">影片:</div>
              <div className="content">{selectedVideo.length}，</div>
              <div
                className="button"
                onClick={() => {
                  setShowVideoSelector(true)
                }}>
                選擇影片
              </div>
              ，
            </div>
            <div className="dateSetting-area">
              <div className="content">結束日期:</div>
              無期限
              <input
                type="checkbox"
                onChange={(e) => {
                  setIsInfiniite(e.target.checked)
                  setOverDate(null)
                }}
              />
              {!isInfiniite && (
                <input
                  type="datetime-local"
                  onChange={(e) => {
                    setOverDate(e.target.value)
                  }}
                  className="video-record-date"
                />
              )}
            </div>
            <div
              className="submit-btn"
              onClick={submitNewAccess}>
              新增
            </div>
          </div>
        )}
<<<<<<< HEAD
        {/* 顯示權杖UI */}
=======

        {accessInfo &&
          accessInfo.map((item, index) => (
            <div
              className="access-info"
              key={index}>
              <div className="name-area">
                權杖名稱 :
                {editAccessId === item._id ? (
                  <input
                    className="input-area"
                    placeholder={item.accessName}
                    onChange={(e) => {
                      setEditAccessName(e.target.value)
                    }}></input>
                ) : (
                  <div className="name">{item.accessName}</div>
                )}
              </div>

              <div className="date-area">
                期限 :
                {editAccessId === item._id ? (
                  <div>
                    {!editisInfiniite && (
                      <input
                        className="input-area"
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
                  <div className="time">{item.accessDate === null ? '永久' : new Date(item.accessDate).toLocaleString()}</div>
                )}
              </div>
              <div className="student">
                <div className="content">學生人數 : {item.studentIDs.length}</div>
              </div>
              <div className="video">
                <div className="content">影片數量 : {item.videoIDs.length}</div>
              </div>
              <div
                className="list-btn"
                onClick={() => {
                  setShowAccessStudentList(true)
                  setChoseAccessId(item._id)
                }}>
                授權學生清單
              </div>
              <div
                className="list-btn"
                onClick={() => {
                  setShowAccessVideoList(true)
                  setChoseAccessId(item._id)
                }}>
                授權影片清單
              </div>
              <div className="image-area">
                {editAccessId === item._id && (
                  <div
                    className="complate-btn"
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
                    className="image"
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
                    className="image"
                    alt="delete icon"
                    width={20}
                    height={20}
                    onClick={() => {
                      setDeleteDoubleCheck(item._id)
                    }}></Image>
                )}
                {deleteDoubleCheck === item._id && (
                  <div className="double-check-area">
                    <div className="content">確定刪除嗎?</div>
                    <div
                      className="confirm-btn"
                      onClick={() => {
                        setDeleteDoubleCheck(null)
                        setChoseAccessId(item._id)
                        deleteAccess(item._id)
                      }}>
                      確定
                    </div>
                    <div
                      className="cancel-btn"
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
>>>>>>> front-end-dev
      </div>
    </div>
  )
}
