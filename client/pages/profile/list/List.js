// 組件庫
import { useRouter } from 'next/router'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import style from './style.module.css'

// public
import menuIcon from '../../../public/imgs/menu.png'
import add from '../../../public/global/add.png'
import reduce from '../../../public/global/reduce.png'

// method
import { useUserToken } from '../../../method/useUserToken'
import userService from '../../../method/userService'

export default function List({ switchState, setSwitchState }) {
  const router = useRouter()
  const token = useUserToken()
  // 透過使用者身分控制顯示哪些功能
  const [userRole, setUserRole] = useState(null)
  // 選單寬度切換，用於開關，320px
  const [listWidth, setListWidth] = useState(0)
  const listRef = useRef(null)
  // 選單切換高亮
  const [activeSwitch, setActiveSwitch] = useState([switchState ? switchState : 'public', switchState ? switchState : 'myCourse'])
  // 控制功能內option的顯示
  const [publicHeight, setPublicHeight] = useState([])
  const [teacherHeight, setTeacherHeight] = useState([])
  const [adminHeight, setAdminHeight] = useState([])
  const publicRef = useRef(null)
  const teacherRef = useRef(null)
  const adminRef = useRef(null)

  /* 關閉選單欄 */
  const closeList = () => {
    setListWidth(0)
  }

  useEffect(() => {
    const to = router.query.to
    const fc = router.query.fc
    setActiveSwitch([fc, to])
  }, [router.query])

  /* session */
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
      setUserRole(localStorage.getItem('user_role'))
    }
  })

  /* 監聽全局寬度變化 */
  const isClient = typeof window === 'object'
  const [windowsWidth, setWindowsWidth] = useState(0)
  useEffect(() => {
    if (!isClient) return false

    const handleResize = () => {
      setWindowsWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    // 先觸發一次，保證初始值正確
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [isClient])

  /* 獲取選單ref拿到寬高 */
  useEffect(() => {}, [listRef])

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

  /* 當畫面切換成手機畫面會收起選單，當畫面切換為電腦畫面會顯示選單 */
  const [phoneLock, setPhoneLock] = useState(false)
  const [PClock, setPCLock] = useState(false)
  /* 手機畫面處理 */
  useEffect(() => {
    // 當已在手機畫面，再次移動寬度不會造成選單自行收起
    if (phoneLock === true) {
      return
    } else if (windowsWidth <= 860 && windowsWidth !== 0) {
      // 當寬度在手機畫面將選單隱藏，只執行一次，除非回到電腦畫面
      setListWidth(0)
      setPhoneLock(true)
      setPCLock(false)
    }
  }, [windowsWidth])
  /* 電腦畫面處理 */
  useEffect(() => {
    if (PClock === true) {
      return
    } else if (windowsWidth >= 860 && listRef) {
      // 當寬度在電腦畫面顯示選單
      setListWidth(320)
      setPCLock(true)
      setPhoneLock(false)
    }
  }, [windowsWidth, listRef])

  return (
    <div className={`${style.list_main}`}>
      <div className={`${style.show_list_btn_area}`}>
        <Image
          alt="open list buttn"
          src={menuIcon}
          className={`${style.show_list_btn}`}
          width={48}
          height={48}
          onClick={() => {
            setListWidth(320)
          }}></Image>
      </div>
      <div
        className={`${style.list_info_area}`}
        ref={listRef}
        style={{ width: listWidth }}>
        <div
          className={`${style.close_list_btn_area}`}
          onClick={() => {
            closeList()
          }}>
          <Image
            alt="close list buttn"
            className={`${style.close_list_btn}`}
            src={menuIcon}
            width={48}
            height={48}></Image>
        </div>
        <div className={`${style.list_option}`}>
          {(userRole === 'student' || userRole === 'teacher' || userRole === 'admin') && (
            <div
              className={`${style.funciton_area}`}
              style={{ color: activeSwitch[0] === 'public' ? 'purple' : 'rgb(0, 0, 0)', height: publicHeight.length >= 1 && publicHeight[0] }}>
              <div className={style.title}>
                {/* 公共功能 */}
                <div
                  className={style.content}
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
              <div className={style.options}>
                {/* 我的課程 */}
                <div className={`${style.item_area}`}>
                  <div
                    className={style.item}
                    style={{ color: activeSwitch[1] === `myCourse` ? `purple` : null }}
                    onClick={() => {
                      // 當選項改變會傳給父層由父層控制顯示的組件
                      if (switchState === 'myCourse') return
                      setSwitchState('myCourse')
                      setActiveSwitch(['public', 'myCourse'])
                      if (window.innerWidth <= 860) closeList() // 當畫面為手機，切換後收起選單
                    }}>
                    我的課程
                  </div>
                </div>
                {/* 個人資訊 */}
                <div className={`${style.item_area}`}>
                  <div
                    className={style.item}
                    style={{ color: activeSwitch[1] === `profile` ? `purple` : null }}
                    onClick={() => {
                      // 當選項改變會傳給父層由父層控制顯示的組件
                      if (switchState === 'profile') return
                      setSwitchState('profile')
                      setActiveSwitch(['public', 'profile'])
                      if (window.innerWidth <= 860) closeList() // 當畫面為手機，切換後收起選單
                    }}>
                    個人資訊
                  </div>
                </div>
              </div>
            </div>
          )}
          {(userRole === 'teacher' || userRole === 'admin') && (
            <div
              className={`${style.funciton_area}`}
              style={{ color: activeSwitch[0] === 'teacher' ? 'purple' : 'rgb(0, 0, 0)', height: teacherHeight.length >= 1 && teacherHeight[0] }}>
              <div className={style.title}>
                {/* 教師功能 */}
                <div
                  className={style.content}
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
              <div className={style.options}>
                <div className={`${style.item_area}`}>
                  {/* 編輯課程資訊 */}
                  <div
                    className={style.item}
                    style={{ color: activeSwitch[1] === 'editCourse' ? 'purple' : null }}
                    onClick={() => {
                      // 當選項改變會傳給父層由父層控制顯示的組件
                      if (switchState === 'editCourse') return
                      setSwitchState('editCourse')
                      setActiveSwitch(['teacher', 'editCourse'])
                      if (window.innerWidth <= 860) closeList() // 當畫面為手機，切換後收起選單
                    }}>
                    編輯課程資訊
                  </div>
                </div>
                <div className={`${style.item_area}`}>
                  {/* 編輯課程成員 */}
                  <div
                    className={style.item}
                    style={{ color: activeSwitch[1] === 'editCourseMember' ? 'purple' : null }}
                    onClick={() => {
                      // 當選項改變會傳給父層由父層控制顯示的組件
                      if (switchState === 'editCourseMember') return
                      setSwitchState('editCourseMember')
                      setActiveSwitch(['teacher', 'editCourseMember'])
                      if (window.innerWidth <= 860) closeList() // 當畫面為手機，切換後收起選單
                    }}>
                    編輯課程成員
                  </div>
                </div>
              </div>
            </div>
          )}
          {userRole === 'admin' && (
            <div
              className={`${style.funciton_area}`}
              style={{ color: activeSwitch[0] === 'admin' ? 'purple' : 'black', height: adminHeight.length >= 1 && adminHeight[0] }}>
              <div className={style.title}>
                {/* 標題 管理員功能 */}
                <div
                  className={style.content}
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
              <div className={style.options}>
                <div className={`${style.item_area}`}>
                  {/* 修改成員資訊 */}
                  <div
                    className={style.item}
                    style={{ color: activeSwitch[1] === 'editMemberInfo' ? 'purple' : null }}
                    onClick={() => {
                      // 當選項改變會傳給父層由父層控制顯示的組件
                      if (switchState === 'editMemberInfo') return
                      setSwitchState('editMemberInfo')
                      setActiveSwitch(['admin', 'editMemberInfo'])
                      if (window.innerWidth <= 860) closeList() // 當畫面為手機，切換後收起選單
                    }}>
                    修改成員資訊
                  </div>
                </div>
                <div className={`${style.item_area}`}>
                  {/* 預註冊成員 */}
                  <div
                    className={style.item}
                    style={{ color: activeSwitch[1] === 'preRegisterMember' ? 'purple' : null }}
                    onClick={() => {
                      // 當選項改變會傳給父層由父層控制顯示的組件
                      if (switchState === 'preRegisterMember') return
                      setSwitchState('preRegisterMember')
                      setActiveSwitch(['admin', 'preRegisterMember'])
                      if (window.innerWidth <= 860) closeList() // 當畫面為手機，切換後收起選單
                    }}>
                    預註冊成員
                  </div>
                </div>
                <div className={`${style.item_area}`}>
                  {/* 刪除成員 */}
                  <div
                    className={style.item}
                    style={{ color: activeSwitch[1] === 'deletMember' ? 'purple' : null }}
                    onClick={() => {
                      // 當選項改變會傳給父層由父層控制顯示的組件
                      if (switchState === 'deletMember') return
                      setSwitchState('deletMember')
                      setActiveSwitch(['admin', 'deletMember'])
                      if (window.innerWidth <= 860) closeList() // 當畫面為手機，切換後收起選單
                    }}>
                    刪除成員
                  </div>
                </div>
                <div className={`${style.item_area}`}>
                  {/* 資料備份 */}
                  <div
                    className={style.item}
                    style={{ color: activeSwitch[1] === 'InfoBackUp' ? 'purple' : null }}
                    onClick={() => {
                      // 當選項改變會傳給父層由父層控制顯示的組件
                      if (switchState === 'InfoBackUp') return
                      setSwitchState('InfoBackUp')
                      setActiveSwitch(['admin', 'InfoBackUp'])
                      if (window.innerWidth <= 860) closeList() // 當畫面為手機，切換後收起選單
                    }}>
                    資料備份
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
