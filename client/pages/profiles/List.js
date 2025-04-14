// 組件庫
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

// public
import menuIcon from '../../public/imgs/menu.png'
import add from '../../public/global/add.png'
import reduce from '../../public/global/reduce.png'

// method
import { useUserToken } from '../../method/useUserToken'
import userService from '../../method/userService'

// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

export default function List({ switchState, setSwitchState }) {
  const token = useUserToken()
  // session控制來選擇顯示那些功能
  const [userRole, setUserRole] = useState(null)
  // 選單寬度切換，用於開關
  const [listWidth, setListWidth] = useState(320)
  const listRef = useRef(null)
  // 切換高亮
  const [activeSwitch, setActiveSwitch] = useState(['public', 'myCourse'])
  // 控制功能內option的顯示
  const [publicHeight, setPublicHeight] = useState([])
  const [teacherHeight, setTeacherHeight] = useState([])
  const [adminHeight, setAdminHeight] = useState([])
  const publicRef = useRef(null)
  const teacherRef = useRef(null)
  const adminRef = useRef(null)

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
      setUserRole(sessionStorage.getItem('user_role'))
    }
  })

  useEffect(() => {
    if (listRef) {
      setListWidth(listRef.current.scrollWidth)
      setTimeout(() => {
        setListWidth(listRef.current.scrollWidth)
      }, 30)
    }
  }, [listRef])

  useEffect(() => {
    if (publicRef) {
      setPublicHeight([publicRef?.current?.scrollHeight, publicRef?.current?.scrollHeight])
    }
    if (teacherRef) {
      setTeacherHeight([teacherRef?.current?.scrollHeight, teacherRef?.current?.scrollHeight])
    }
    if (adminRef) {
      setAdminHeight([adminRef?.current?.scrollHeight, adminRef?.current?.scrollHeight])
    }
  }, [publicRef, teacherRef, adminRef])

  return (
    <div className="list-main">
      <div className="show-list-btn-area">
        <Image
          alt="open list buttn"
          src={menuIcon}
          className="show-list-btn"
          width={48}
          height={48}
          onClick={() => {
            setListWidth(320)
          }}></Image>
      </div>
      <div
        className="list-info-area"
        ref={listRef}
        style={{ width: listWidth }}>
        <div
          className="close-list-btn-area"
          onClick={() => {
            setListWidth(0)
          }}>
          <Image
            alt="close list buttn"
            className="close-list-btn"
            src={menuIcon}
            width={48}
            height={48}></Image>
        </div>
        <div className="list-option">
          {(userRole === 'student' || userRole === 'teacher' || userRole === 'admin') && (
            <div
              className="funciton-area"
              style={{ color: activeSwitch[0] === 'public' ? 'purple' : 'rgb(0, 0, 0)', height: publicHeight.length >= 1 && publicHeight[0] }}>
              <div className="title">
                {/* 公共功能 */}
                <div
                  className="content"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => {
                    if (publicHeight[0] === 35) {
                      setPublicHeight([publicHeight[1], publicHeight[1]])
                    }
                    if (publicHeight[0] !== 35) {
                      setPublicHeight([35, publicHeight[1]])
                    }
                  }}>
                  公共功能
                </div>
                {publicHeight.length >= 1 && publicHeight[0] === 35 && (
                  <Image
                    alt="show public function options button"
                    style={{ cursor: 'pointer' }}
                    src={add}
                    width={20}
                    height={20}
                    onClick={() => {
                      setPublicHeight([publicHeight[1], publicHeight[1]])
                    }}
                  />
                )}
                {publicHeight.length >= 1 && publicHeight[0] !== 35 && (
                  <Image
                    alt="hidden public function options button"
                    style={{ cursor: 'pointer' }}
                    src={reduce}
                    width={20}
                    height={20}
                    onClick={() => {
                      setPublicHeight([35, publicHeight[1]])
                    }}
                  />
                )}
              </div>
              <div className="options">
                {/* 我的課程 */}
                <div className="item-area">
                  <div
                    className="item"
                    style={{ color: activeSwitch[1] === 'myCourse' ? 'purple' : null }}
                    onClick={() => {
                      if (switchState === 'myCourse') return
                      setSwitchState('myCourse')
                      setActiveSwitch(['public', 'myCourse'])
                    }}>
                    我的課程
                  </div>
                </div>
                {/* 個人資訊 */}
                <div className="item-area">
                  <div
                    className="item"
                    style={{ color: activeSwitch[1] === 'profile' ? 'purple' : null }}
                    onClick={() => {
                      if (switchState === 'profile') return
                      setSwitchState('profile')
                      setActiveSwitch(['public', 'profile'])
                    }}>
                    個人資訊
                  </div>
                </div>
              </div>
            </div>
          )}
          {(userRole === 'teacher' || userRole === 'admin') && (
            <div
              className="funciton-area"
              style={{ color: activeSwitch[0] === 'teacher' ? 'purple' : 'rgb(0, 0, 0)', height: teacherHeight.length >= 1 && teacherHeight[0] }}>
              <div className="title">
                {/* 教師功能 */}
                <div
                  className="content"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => {
                    if (teacherHeight[0] === 35) {
                      setTeacherHeight([teacherHeight[1], teacherHeight[1]])
                    }
                    if (teacherHeight[0] !== 35) {
                      setTeacherHeight([35, teacherHeight[1]])
                    }
                  }}>
                  教師功能
                </div>
                {teacherHeight.length >= 1 && teacherHeight[0] === 35 && (
                  <Image
                    alt="show teacher function options button"
                    style={{ cursor: 'pointer' }}
                    src={add}
                    width={20}
                    height={20}
                    onClick={() => {
                      setTeacherHeight([teacherHeight[1], teacherHeight[1]])
                    }}
                  />
                )}
                {teacherHeight.length >= 1 && teacherHeight[0] !== 35 && (
                  <Image
                    alt="hidden teacher function options button"
                    style={{ cursor: 'pointer' }}
                    src={reduce}
                    width={20}
                    height={20}
                    onClick={() => {
                      setTeacherHeight([35, teacherHeight[1]])
                    }}
                  />
                )}
              </div>
              <div className="options">
                <div className="item-area">
                  <div
                    className="item"
                    style={{ color: activeSwitch[1] === 'editCourse' ? 'purple' : null }}
                    onClick={() => {
                      if (switchState === 'editCourse') return
                      setSwitchState('editCourse')
                      setActiveSwitch(['teacher', 'editCourse'])
                    }}>
                    編輯課程資訊
                  </div>
                </div>
                <div className="item-area">
                  <div
                    className="item"
                    style={{ color: activeSwitch[1] === 'editCourseMember' ? 'purple' : null }}
                    onClick={() => {
                      if (switchState === 'editCourseMember') return
                      setSwitchState('editCourseMember')
                      setActiveSwitch(['teacher', 'editCourseMember'])
                    }}>
                    編輯課程成員
                  </div>
                </div>
              </div>
            </div>
          )}
          {userRole === 'admin' && (
            <div
              className="funciton-area"
              style={{ color: activeSwitch[0] === 'admin' ? 'purple' : 'black', height: adminHeight.length >= 1 && adminHeight[0] }}>
              <div className="title">
                {/* 管理員功能 */}
                <div
                  className="content"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => {
                    if (adminHeight[0] === 35) {
                      setAdminHeight([adminHeight[1], adminHeight[1]])
                    }
                    if (adminHeight[0] !== 35) {
                      setAdminHeight([35, adminHeight[1]])
                    }
                  }}>
                  管理員功能
                </div>
                {adminHeight.length >= 1 && adminHeight[0] === 35 && (
                  <Image
                    alt="hidden admin function options button"
                    style={{ cursor: 'pointer' }}
                    src={add}
                    width={20}
                    height={20}
                    onClick={() => {
                      setAdminHeight([adminHeight[1], adminHeight[1]])
                    }}
                  />
                )}
                {adminHeight.length >= 1 && adminHeight[0] !== 35 && (
                  <Image
                    alt="hidden admin function options button"
                    style={{ cursor: 'pointer' }}
                    src={reduce}
                    width={20}
                    height={20}
                    onClick={() => {
                      setAdminHeight([35, adminHeight[1]])
                    }}
                  />
                )}
              </div>
              <div className="options">
                <div className="item-area">
                  <div
                    className="item"
                    style={{ color: activeSwitch[1] === 'editMemberInfo' ? 'purple' : null }}
                    onClick={() => {
                      if (switchState === 'editMemberInfo') return
                      setSwitchState('editMemberInfo')
                      setActiveSwitch(['admin', 'editMemberInfo'])
                    }}>
                    修改成員資訊
                  </div>
                </div>
                <div className="item-area">
                  <div
                    className="item"
                    style={{ color: activeSwitch[1] === 'preRegisterMember' ? 'purple' : null }}
                    onClick={() => {
                      if (switchState === 'preRegisterMember') return
                      setSwitchState('preRegisterMember')
                      setActiveSwitch(['admin', 'preRegisterMember'])
                    }}>
                    預註冊成員
                  </div>
                </div>
                <div className="item-area">
                  <div
                    className="item"
                    style={{ color: activeSwitch[1] === 'deletMember' ? 'purple' : null }}
                    onClick={() => {
                      if (switchState === 'deletMember') return
                      setSwitchState('deletMember')
                      setActiveSwitch(['admin', 'deletMember'])
                    }}>
                    刪除成員
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
