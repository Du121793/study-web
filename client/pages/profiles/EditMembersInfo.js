// 原生組件庫
import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'

// method
import { useUserToken } from '../../method/useUserToken'
import userService from '../../method/userService'
import adminService from '../../method/adminService'

//public
import dbArrowLeft from '../../public/profile/doubleArrowLeft.png'
import dbArrowRight from '../../public/profile/doubleArrowRight.png'
import ArrowLeft from '../../public/profile/leftArrow.png'
import ArrowRight from '../../public/profile/rightArrow.png'

export default function EditMembersInfo() {
  const token = useUserToken()

  const [editMemberId, setEditMemberId] = useState('')
  // search payload
  const [searchRealName, setSearchRealName] = useState(undefined)
  const [searchPhone, setSearchPhone] = useState(undefined)
  const [searchGrade, setSearchGrade] = useState(undefined)
  const [searchId, setSearchId] = useState(undefined)
  // search input ref
  const realNameRef = useRef(null)
  const PhoneRef = useRef(null)
  const GradeRef = useRef(null)
  const IdRef = useRef(null)
  // edit payload
  const [userNameInput, setUserNameInput] = useState(undefined)
  const [realNameInput, setRealNameInput] = useState(undefined)
  const [phoneInput, setPhoneInput] = useState(undefined)
  const [gradeInput, setGradeInput] = useState(undefined)
  const [idInput, setIdInput] = useState(undefined)
  const [roleInput, setRoleInput] = useState(undefined)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPage, setTotalPage] = useState(0)
  // get req
  const [members, setMembers] = useState(null)
  // 控制訊息
  const [message, setMessage] = useState('無訊息')
  const [messageStatus, setMessageStatus] = useState(false)
  const [messageColor, setMessageColor] = useState('')
  // 綁定timeout，用於重計
  const messageTimer = useRef(null)
  const resetTimer = useRef(null)
  // loading anime
  const [loading, setLoading] = useState(false)

  const test = () => {
    console.log(members)
  }

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

  const initSearchInput = () => {
    setSearchRealName(undefined)
    setSearchPhone(undefined)
    setSearchGrade(undefined)
    setSearchId(undefined)
    realNameRef.current.value = ''
    PhoneRef.current.value = ''
    GradeRef.current.value = ''
    IdRef.current.value = ''
  }

  const initInputValue = () => {
    setUserNameInput(undefined)
    setRealNameInput(undefined)
    setPhoneInput(undefined)
    setGradeInput(undefined)
    setRoleInput(undefined)
  }

  const searchMembers = () => {
    let data = {
      page: page,
      pageSize: pageSize,
      realname: searchRealName,
      phoneNumber: searchPhone,
      gradeInput: searchGrade,
    }
    adminService.getMembers(token, data).then((res) => {
      if (res?.success) {
        setTotalPage(res.totalPage)
        setMembers(res.data)
      } else {
        console.log(res)
      }
    })
  }

  const getMembers = () => {
    let data = {
      page: page,
      pageSize: pageSize,
    }
    adminService.getMembers(token, data).then((res) => {
      if (res?.success) {
        setMembers(res.data)
      }
    })
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

  const patchMemberInfo = (memberId) => {
    let data = {
      memberId: memberId,
      updateData: {
        username: userNameInput,
        realname: realNameInput,
        phoneNumber: phoneInput,
        grade: gradeInput,
        role: roleInput,
      },
    }
    adminService.patchUsersInfo(token, data).then((res) => {
      if (res?.success) {
        initInputValue()
        setEditMemberId('')
        getMembers()
        messageControl('修改成功', true)
      } else {
        if (res?.msg === '請提供要更新的資料' || res?.msg === '用戶暱稱不能為空、真實姓名不能為空、電話號碼不能為空、角色不能為空') {
          initInputValue()
          setEditMemberId('')
        }
      }
    })
  }

  // getMembers
  useEffect(() => {
    if (token) {
      setLoading(true)
      let data = {
        page: page,
        pageSize: pageSize,
      }
      adminService.getMembers(token, data).then((res) => {
        if (res?.success) {
          setLoading(false)
          setTotalPage(res.totalPage)
          setMembers(res.data)
        } else {
          setLoading(false)
        }
      })
    }
  }, [token, page])

  return (
    <div className="edit-members-info-main g-shadow">
      <div
        style={{ height: messageStatus ? '20px' : '0', padding: messageStatus ? '24px' : '0', backgroundColor: messageColor }}
        className="message">
        {message}
      </div>
      {loading && (
        <div className="loading-main">
          <div className="loader"></div>
        </div>
      )}
      <div
        className="header-title"
        onClick={test}>
        編輯成員資訊功能
      </div>
      <div className="search-area">
        <div className="input-area">
          <div className="realName">
            <div className="content">真實姓名</div>
            <input
              type="text"
              ref={realNameRef}
              placeholder="可選"
              onChange={(e) => {
                setSearchRealName(e.target.value)
              }}
            />
          </div>
          <div className="phone">
            <div className="content">電話</div>
            <input
              type="text"
              ref={PhoneRef}
              placeholder="可選"
              onChange={(e) => {
                setSearchPhone(e.target.value)
              }}
            />
          </div>
          <div className="grade">
            <div className="content">年級</div>
            <input
              type="text"
              ref={GradeRef}
              placeholder="可選"
              defaultValue={searchGrade}
              onChange={(e) => {
                setSearchGrade(e.target.value)
              }}
            />
          </div>
          <div className="id">
            <div className="content">用戶ID</div>
            <input
              type="text"
              ref={IdRef}
              placeholder="可選"
              defaultValue={searchId}
              onChange={(e) => {
                setSearchId(e.target.value)
              }}
            />
          </div>
        </div>
        <div className="btn-area">
          <div
            className="g-black-btn"
            onClick={initSearchInput}>
            清空選項
          </div>
          <div
            className="g-blue-btn"
            onClick={searchMembers}>
            搜尋
          </div>
        </div>
      </div>
      <div className="member-list-area g-shadow">
        
        <div className="inner-line">
          <div className="user-name">暱稱</div>
          <div className="real-name">姓名</div>
          <div className="phone">電話號碼</div>
          <div className="grade">年級</div>
          <div className="role">身分組</div>
          <div className="id">ID</div>
        </div>

        {members &&
          members.length > 0 &&
          members.map((item, idx) => {
            if (editMemberId && editMemberId === item._id) {
              return (
                <div
                  className="inner-line"
                  key={idx}>
                  <input
                    value={item.userinfo.username}
                    type="text"
                    className="input user-name"
                    onChange={(e) => {
                      setUserNameInput(e.target.value)
                    }}></input>
                  <input
                    value={item.userinfo.realname}
                    type="text"
                    className="input real-name"
                    onChange={(e) => {
                      setRealNameInput(e.target.value)
                    }}></input>
                  <input
                    value={item.userinfo.phoneNumber}
                    type="text"
                    className="input phone"
                    onChange={(e) => {
                      setPhoneInput(e.target.value)
                    }}></input>
                  <input
                    value={item.userinfo.grade}
                    type="text"
                    className="input grade"
                    onChange={(e) => {
                      setGradeInput(e.target.value)
                    }}></input>
                  <select
                    defaultValue={item.role}
                    onChange={(e) => {
                      setRoleInput(e.target.value)
                    }}>
                    <option value="admin">管理員</option>
                    <option value="teacher">教師</option>
                    <option value="student">學生</option>
                  </select>
                  <div className="id">{item._id}</div>
                  <div
                    className="g-green-btn"
                    onClick={(e) => {
                      patchMemberInfo(item._id)
                    }}>
                    儲存
                  </div>
                </div>
              )
            } else {
              return (
                <div
                  className="inner-line"
                  key={idx}>
                  <div className="user-name">{item.userinfo.username}</div>
                  <div className="real-name">{item.userinfo.realname}</div>
                  <div className="phone">{item.userinfo.phoneNumber}</div>
                  <div className="grade">{item.userinfo.grade}</div>
                  <div className="role">{item.role === 'admin' ? '管理員' : item.role === 'teacher' ? '教師' : '學生'}</div>
                  <div className="id">{item._id}</div>
                  <div
                    className="g-blue-btn"
                    onClick={() => {
                      setEditMemberId(item._id)
                      setUserNameInput(item.userinfo.username)
                      setRealNameInput(item.userinfo.realname)
                      setPhoneInput(item.userinfo.phoneNumber)
                      setGradeInput(item.userinfo.grade)
                      setRoleInput(item.role)
                    }}>
                    編輯
                  </div>
                </div>
              )
            }
          })}

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
              console.log(totalPage)
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
