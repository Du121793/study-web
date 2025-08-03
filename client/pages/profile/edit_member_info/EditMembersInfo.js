// 原生組件庫
import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import style from './style.module.css'

// method
import { useUserToken } from '../../../method/useUserToken'
import adminService from '../../../method/adminService'

//public
import dbArrowLeft from '../../../public/profile/doubleArrowLeft.png'
import dbArrowRight from '../../../public/profile/doubleArrowRight.png'
import ArrowLeft from '../../../public/profile/leftArrow.png'
import ArrowRight from '../../../public/profile/rightArrow.png'

// components
import BackGround from '../components/back_ground/BackGround'
import LoadingAnime from '../../../components/loading_anime/LoadingAnime'
import MessageAnime from '../../../components/message_anime/MessageAnime'
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
  const [message, setMessage] = useState(null)
  // 旋轉讀取
  const [loading, setLoading] = useState(false)

  const test = () => {}

  // 初始化
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

  // 初始化
  const initInputValue = () => {
    setUserNameInput(undefined)
    setRealNameInput(undefined)
    setPhoneInput(undefined)
    setGradeInput(undefined)
    setRoleInput(undefined)
  }

  // 搜尋成員
  const searchMembers = () => {
    let data = {
      page: page,
      pageSize: pageSize,
      realname: searchRealName,
      phoneNumber: searchPhone,
      gradeInput: searchGrade,
    }
    setLoading(true)
    adminService
      .getMembers(token, data)
      .then((res) => {
        if (res?.success) {
          setTotalPage(res.totalPage)
          setMembers(res.data)
        }
      })
      .catch((err) => {
        setMessage('發生錯誤')
      })
    setLoading(false)
    setTimeout(() => {
      setMessage(null)
    }, 2000)
  }

  // 取得成員
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

  // 編輯成員資訊
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
    setLoading(true)
    adminService.patchUsersInfo(token, data).then((res) => {
      if (res?.success) {
        initInputValue()
        setEditMemberId('')
        getMembers()
        setMessage('修改成功')
      } else {
        if (res?.msg === '請提供要更新的資料' || res?.msg === '用戶暱稱不能為空、真實姓名不能為空、電話號碼不能為空、角色不能為空') {
          initInputValue()
          setEditMemberId('')
        }
      }
      setLoading(false)
    })
    setTimeout(() => {
      setMessage(null)
    }, 2000)
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
    <div className={`${style.edit_members_info_main} g-shadow`}>
      <BackGround></BackGround>
      {loading && <LoadingAnime top={'20%'}></LoadingAnime>}
      {message && (
        <MessageAnime
          message={message}
          top="50%"
          duration={2000}
        />
      )}
      <div
        className={`${style.header_title}`}
        onClick={test}>
        編輯成員資訊功能
      </div>

      <div className={`${style.search_area}`}>
        <div className={`${style.input_area}`}>
          <div className={style.realName}>
            <div className={style.content}>真實姓名</div>
            <input
              type="text"
              ref={realNameRef}
              placeholder="可選"
              onChange={(e) => {
                setSearchRealName(e.target.value)
              }}
            />
          </div>
          <div className={style.phone}>
            <div className={style.content}>電話</div>
            <input
              type="text"
              ref={PhoneRef}
              placeholder="可選"
              onChange={(e) => {
                setSearchPhone(e.target.value)
              }}
            />
          </div>
          <div className={style.grade}>
            <div className={style.content}>年級</div>
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
          <div className={style.id}>
            <div className={style.content}>用戶ID</div>
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
        <div className={`${style.btn_area}`}>
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
      <div className={`${style.member_list_area} g-shadow`}>
        <div className={`${style.inner_line}`}>
          <div className={`${style.user_name}`}>暱稱</div>
          <div className={`${style.real_name}`}>姓名</div>
          <div className={style.phone}>電話號碼</div>
          <div className={style.grade}>年級</div>
          <div className={style.role}>身分組</div>
          <div className={style.id}>ID</div>
        </div>

        {members &&
          members.length > 0 &&
          members.map((item, idx) => {
            if (editMemberId && editMemberId === item._id) {
              return (
                <div
                  className={`${style.inner_line}`}
                  key={idx}>
                  <input
                    defaultValue={item.userinfo.username}
                    type="text"
                    className={`${style.input} ${style.user_name}`}
                    onChange={(e) => {
                      setUserNameInput(e.target.value)
                    }}></input>
                  <input
                    defaultValue={item.userinfo.realname}
                    type="text"
                    className={`${style.input} ${style.real_name}`}
                    onChange={(e) => {
                      setRealNameInput(e.target.value)
                    }}></input>
                  <input
                    defaultValue={item.userinfo.phoneNumber}
                    type="text"
                    className={`${style.input} ${style.phone}`}
                    onChange={(e) => {
                      setPhoneInput(e.target.value)
                    }}></input>
                  <input
                    defaultValue={item.userinfo.grade}
                    type="text"
                    className={`${style.input} ${style.grade}`}
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
                  <div className={style.id}>{item._id}</div>
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
                  className={`${style.inner_line}`}
                  key={idx}>
                  <div className={`${style.user_name}`}>{item.userinfo.username}</div>
                  <div className={`${style.real_name}`}>{item.userinfo.realname}</div>
                  <div className={style.phone}>{item.userinfo.phoneNumber}</div>
                  <div className={style.grade}>{item.role === 'student' ? item.userinfo.grade : null}</div>
                  <div className={style.role}>{item.role === 'admin' ? '管理員' : item.role === 'teacher' ? '教師' : '學生'}</div>
                  <div className={style.id}>{item._id}</div>
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
