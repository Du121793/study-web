// 組件庫
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import style from './style.module.css'
//public
import dbArrowLeft from '../../../public/profile/doubleArrowLeft.png'
import dbArrowRight from '../../../public/profile/doubleArrowRight.png'
import ArrowLeft from '../../../public/profile/leftArrow.png'
import ArrowRight from '../../../public/profile/rightArrow.png'
// 導入method
import { useUserToken } from '../../../method/useUserToken'
import adminService from '../../../method/adminService'
import userService from '../../../method/userService'
// components
import BackGround from '../components/back_ground/BackGround'
import LoadingAnime from '../../../components/loading_anime/LoadingAnime'
import MessageAnime from '../../../components/message_anime/MessageAnime'
import DropDown from '../../../components/dropDown/DropDown'

export default function RemoveUsers() {
  const token = useUserToken()
  // get members
  const [getUsers, setGetUsers] = useState([])
  const [membersTemp, setMembersTemp] = useState([])
  // 旋轉讀取
  const [loading, setLoading] = useState(false)
  // 請求參數
  const [selectedUserId, setSelectedUserId] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPage, setTotalPage] = useState(1)
  const [realNameValue, setRealNameValue] = useState(null)
  const [phoneValue, setPhoneValue] = useState(null)
  const [choseRole, setChoseRole] = useState(null)
  const [memberId, setMemberId] = useState(null)
  const [grade, setGrade] = useState(null)
  // 初始化所有資料的邊框
  const [optionBorder, setOptionBorder] = useState('2px solid rgba(0, 0, 0, 0.2)')
  // 控制訊息
  const [message, setMessage] = useState(null)

  // input的下拉式選單
  const [gradeList, setGradeList] = useState([])
  const [gradeListFlag, setGradeListFlag] = useState(false)
  const [returnValue, setReturnValue] = useState('')
  const handleBlur = () => {
    setTimeout(() => {
      setGradeListFlag(false)
    }, 20)
  }

  const checkSelectedMembers = () => {}

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

  //請求獲取使用者
  const getUsersFunction = () => {
    setLoading(true)
    adminService.getMembers(token).then((res) => {
      if (res?.success) {
        setGetUsers(res.data)
        setLoading(false)
      }
    })
  }

  // 點擊選擇單個用戶
  const selectedUser = (e, _id) => {
    if (
      selectedUserId.find((item) => {
        return item === _id
      })
    ) {
      setSelectedUserId(
        selectedUserId.filter((item) => {
          return item !== _id
        })
      )
    } else {
      setSelectedUserId([...selectedUserId, _id])
    }
  }

  // 點擊刪除發送請求
  const deleteSelectedUsers = () => {
    if (selectedUserId.length) {
      setLoading(true)
      adminService.deleteMembers(token, selectedUserId).then((res) => {
        if (res.success === true) {
          setSelectedUserId([])
          getUsersFunction()
          clearSelectedMemebers()
          messageControl(res.msg, true)
          setLoading(false)
          setMessage('刪除完成')
        } else {
          setMessage('發生錯誤')
          console.error(res)
        }
      })
    } else {
      setMessage('請選擇要刪除的成員')
    }
    setTimeout(() => {
      setMessage(null)
    }, 2000)
  }

  // 取消選取所有已選取的成員
  const clearSelectedMemebers = () => {
    setSelectedUserId([])
  }

  // 搜尋使用者資料
  const searchMemebers = () => {
    let data = {
      realname: realNameValue,
      phoneNumber: phoneValue,
      role: choseRole,
      _id: memberId,
      page: page,
      pageSize: pageSize,
      grade: grade,
    }
    setLoading(true)
    adminService.getMembers(token, data).then((res) => {
      if (res?.success) {
        setGetUsers(res.data)
        setLoading(false)
      }
    })
  }

  useEffect(() => {
    setGrade(returnValue)
  }, [returnValue])

  // 刷新渲染使用者資料
  useEffect(() => {
    if (token) {
      let data = {
        page: page,
        pageSize: pageSize,
      }
      setLoading(true)
      adminService.getMembers(token, data).then((res) => {
        if (res.success) {
          setTotalPage(res.totalPage)
          setGetUsers(res.data)
          setLoading(false)
        }
      })
    }
    if (token) {
      userService.getGradeList(token).then((res) => {
        setGradeList(res.data.grades)
      })
    }
  }, [token, page])

  return (
    <div className={`${style.remove_users_page}`}>
      {loading && <LoadingAnime></LoadingAnime>}
      {message && (
        <MessageAnime
          message={message}
          top="100px"
          duration={2000}
        />
      )}
      <BackGround></BackGround>
      <div className={style['option-container']}>
        {/* 搜尋選項: 姓名，電話，年級*/}
        <div className={`${style.remove_user_header}`}>
          {/* 輸入姓名 */}
          <div className={`${style.top_info_input}`}>
            <div className={style.title}>真實姓名:</div>
            <input
              onChange={(e) => {
                setRealNameValue(e.target.value)
              }}
              className={`${style.name_input}`}
              type="text"
              placeholder="選填"
            />
          </div>
          {/* 輸入電話 */}
          <div className={`${style.top_info_input}`}>
            <div className={style.title}>電話:</div>
            <input
              onChange={(e) => {
                setPhoneValue(e.target.value)
              }}
              type="text"
              placeholder="選填"
            />
          </div>
          {/* 輸入年級 */}
          <div className={`${style.top_info_input}`}>
            <div className={style.title}>年級 :</div>
            <div className={style['input-area']}>
              <input
                onFocus={() => {
                  setGradeListFlag(true)
                }}
                onBlur={() => {
                  handleBlur()
                }}
                onChange={(e) => {
                  setGrade(e.target.value)
                }}
                value={grade}
                className={`${style.grade_input}`}
                type="text"
                placeholder="選填"
              />
              {gradeListFlag && (
                <DropDown
                  setReturnValue={setReturnValue}
                  dataList={gradeList}></DropDown>
              )}
            </div>
          </div>
        </div>
        {/* 搜尋選項: 用戶ID，身分組 */}
        <div className={`${style.container_line}`}>
          <div className={style.title}>用戶ID:</div>
          <input
            onChange={(e) => {
              setMemberId(e.target.value)
            }}
            className={`${style.member_id_input}`}
            type="text"
            placeholder="選填"
          />
          <div className={style.title}>身分組</div>
          <select
            onChange={(e) => {
              setChoseRole(e.target.value)
              clearSelectedMemebers()
            }}>
            <option value="">全部</option>
            <option value="teacher">教師</option>
            <option value="student">學生</option>
          </select>
        </div>
        {/* 按鈕區域 */}
        <div className={`${style.header_btns}`}>
          <div
            className="g-black-btn"
            onClick={clearSelectedMemebers}>
            清空選項
          </div>
          <div
            className="g-blue-btn"
            onClick={searchMemebers}>
            搜尋
          </div>
          <div
            className="g-red-btn"
            onClick={deleteSelectedUsers}>
            刪除
          </div>
        </div>
      </div>
      <div className={style['list-container']}>
        {/* list標題 */}
        <div className={`${style.user_list_title}`}>
          <div className={style.container}>
            <div className={style.username}>暱稱</div>
            <div className={style.realname}>真實性名</div>
            <div className={style.grade}>年級</div>
            <div className={style.phone}>電話號碼</div>
            <div className={style.userid}>用戶ID</div>
            <div className={style.role}>身分組</div>
          </div>
        </div>
        {/* list內容 */}
        <div className={`${style.user_list}`}>
          {getUsers.map(
            (item, index) =>
              item.role !== 'admin' && (
                <div
                  key={index}
                  onClick={(e) => {
                    selectedUser(e, item._id)
                  }}
                  className={`member-info ${style.container}`}
                  style={{ border: selectedUserId.find((id) => item._id === id) ? '2px solid rgb(113, 231, 63)' : '2px solid rgba(0, 0, 0, 0.2)' }}>
                  <div className={style.username}>{!item.userinfo.username ? '無' : item.userinfo.username}</div>
                  <div className={style.realname}>{item.userinfo.realname}</div>
                  <div className={style.grade}>{item.role === 'student' ? item.userinfo.grade : null}</div>
                  <div className={style.phone}>{item.userinfo.phoneNumber}</div>
                  <div className={style.userid}>{item._id}</div>
                  {item.role === 'admin' && <div className={style.role}>管理員</div>}
                  {item.role === 'teacher' && <div className={style.role}>老師</div>}
                  {item.role === 'student' && <div className={style.role}>學生</div>}
                </div>
              )
          )}
        </div>
        <div className="page-switch">
          <Image
            alt="switch back to first page icon"
            src={dbArrowLeft}
            className="page-switcher"
            width={24}
            height={24}
            onClick={() => {
              checkSelectedMembers()
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
                checkSelectedMembers()
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
                  checkSelectedMembers()
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
                checkSelectedMembers()
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
              checkSelectedMembers()
            }}></Image>
        </div>
      </div>
    </div>
  )
}
