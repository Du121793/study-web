// 組件庫
import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import style from './style.module.css'
// method組件
import adminService from '../../../method/adminService'
import userService from '../../../method/userService'
import { useUserToken } from '../../../method/useUserToken'
//public
import dbArrowLeft from '../../../public/profile/doubleArrowLeft.png'
import dbArrowRight from '../../../public/profile/doubleArrowRight.png'
import ArrowLeft from '../../../public/profile/leftArrow.png'
import ArrowRight from '../../../public/profile/rightArrow.png'
// component
import DropDown from '../../../components/dropDown/DropDown'
import MessageAnime from '../../../components/message_anime/MessageAnime'
import LoadingAnime from '../../../components/loading_anime/LoadingAnime'

export default function MemberSelector({ selectedStudentId, setSelectedStudentId }) {
  // env
  const token = useUserToken()

  const [memberloading, setMemberLoading] = useState()
  // 請求參數
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPage, setTotalPage] = useState(1)
  const [nameInput, setNameInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [gradeInput, setGradeInput] = useState('')
  const [roleInput, setRoleInput] = useState('')
  const [selectCourse, setSelectCourse] = useState('')

  // 獲取資料
  const [members, setMembers] = useState([])
  const [totalArray, setTotalArray] = useState([])

  // UX
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // input的下拉式選單
  const [gradeList, setGradeList] = useState([])
  const [gradeListFlag, setGradeListFlag] = useState(false)
  const [returnValue, setReturnValue] = useState('')
  const handleBlur = () => {
    setTimeout(() => {
      setGradeListFlag(false)
    }, 20)
  }
  useEffect(() => {
    setGradeInput(returnValue)
  }, [returnValue])

  // 初始化UX
  const initUX = () => {
    const timer = setTimeout(() => {
      setMessage('')
    }, 2000)
    setLoading(false)
    return () => {
      clearTimeout(timer)
    }
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

  // 全選按鈕
  const selectAllStudent = () => {
    setSelectedStudentId(
      members.map((item) => {
        return item._id
      })
    )
  }

  // 取消全選按鈕
  const clearSearch = () => {
    setSelectedStudentId([])
  }

  // 搜尋功能
  const searchStudentButton = () => {
    let data = {
      realname: nameInput,
      phoneNumber: phoneInput,
      grade: roleInput === 'teacher' || roleInput === 'admin' ? '' : gradeInput,
      role: roleInput,
      courses: selectCourse,
      page: page,
      pageSize: pageSize,
    }
    setLoading(true)
    adminService
      .getMembers(token, data)
      .then((res) => {
        setMembers(res.data)
        setTotalPage(res.totalPage)
        let temp = []
        for (let i = 1; i <= res.totalPage; i++) {
          temp.push(i)
        }
        setTotalArray(temp)
      })
      .catch(() => {
        setMessage('發生錯誤')
      })
      .finally(() => {
        initUX()
      })
  }

  // 初始化已選擇的學生
  const initSelectedId = () => {
    setSelectedStudentId([])
  }

  // 獲得成員清單
  useEffect(() => {
    if (token) {
      setMemberLoading(true)
      let data = {
        page: page,
        pageSize: pageSize,
        role: roleInput,
        grade: roleInput === 'teacher' || roleInput === 'admin' ? '' : gradeInput,
      }
      setLoading(true)
      adminService
        .getMembers(token, data)
        .then((res) => {
          if (res.success) {
            setMembers(res.data)
            setTotalPage(res.totalPage)
            setMemberLoading(false)
            let temp = []
            for (let i = 1; i <= res.totalPage; i++) {
              temp.push(i)
            }
            setTotalArray(temp)
          }
        })
        .catch(() => {
          setMessage('發生錯誤')
        })
        .finally(() => {
          initUX()
        })
    }

    if (token) {
      const query = 'user'
      userService.getGradeList(token, query).then((res) => {
        setGradeList(res.data.grades)
      })
    }
  }, [token, page, pageSize, roleInput])

  return (
    <div className={`${style.member_select_area}`}>
      {loading && <LoadingAnime top={'50%'}></LoadingAnime>}
      {message && (
        <MessageAnime
          message={message}
          top="100px"
          duration={2000}
        />
      )}
      <div className={`${style.member_select_header}`}>成員搜尋功能</div>
      <div className={style['classification']}>
        <div className={`${style.search_inputs}`}>
          {/* 姓名 */}
          <div>
            <span>姓名:</span>
            <input
              className={`${style.input_name}`}
              onChange={(e) => {
                setNameInput(e.target.value)
              }}
              type="text"
            />
          </div>
          {/* 電話 */}
          <div>
            <span>電話:</span>
            <input
              className={`${style.input_phone}`}
              onChange={(e) => {
                setPhoneInput(e.target.value)
              }}
              type="text"
            />
          </div>
          {/* 年級 */}
          <div className={style['grade-container']}>
            <span>年級:</span>
            <div className={style['input-area']}>
              <input
                className={`${style.input_grade} ${roleInput === 'teacher' || roleInput === 'admin' ? style['lock'] : null}`}
                onChange={(e) => {
                  setGradeInput(e.target.value)
                }}
                onFocus={() => {
                  setGradeListFlag(true)
                }}
                onBlur={() => {
                  handleBlur()
                }}
                value={gradeInput}
                type="text"
              />
              {gradeListFlag && (
                <DropDown
                  setReturnValue={setReturnValue}
                  dataList={gradeList}></DropDown>
              )}
            </div>
          </div>
          {/* 身分組 */}
          <div className={`${style.role_inputs}`}>
            <div className={style['content']}>身分組:</div>
            <select
              onChange={(e) => {
                setRoleInput(e.target.value)
              }}>
              <option value="">全部</option>
              <option value="teacher">教師</option>
              <option value="student">學生</option>
              <option value="admin">管理員</option>
            </select>
          </div>
        </div>
        {/* 三個按鈕 */}
        <div className={style['btns']}>
          <button
            className="g-black-btn"
            onClick={selectAllStudent}>
            全選
          </button>
          <button
            className="g-red-btn"
            onClick={clearSearch}>
            取消選取
          </button>
          <button
            className="g-blue-btn"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              searchStudentButton()
              initSelectedId()
            }}>
            搜尋
          </button>
        </div>
      </div>
      <ul className={`${style.member_list_area}`}>
        <div className={`${style.inner_line}`}>
          <span className={`${style.user_name}`}>暱稱</span>
          <span className={`${style.real_name}`}>姓名</span>
          <span className={style['phone']}>電話號碼</span>
          <span className={style['grade']}>年級</span>
          <span className={style['role']}>身分組</span>
        </div>
        {memberloading && <LoadingAnime />}
        {members &&
          members.map((item, index) => (
            <div
              style={{
                cursor: 'pointer',
                border: selectedStudentId.find((id) => id === item._id) ? '2px solid rgb(153, 153, 153)' : '2px solid rgba(0, 0, 0, 0.2)',
                backgroundColor: selectedStudentId.find((id) => id === item._id) ? 'rgb(242, 242, 242)' : 'transparent',
                boxShadow: selectedStudentId.find((id) => id === item._id) ? '0px 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
              }}
              key={index}
              onClick={(e) => {
                if (selectedStudentId.find((id) => id === item._id)) {
                  setSelectedStudentId(selectedStudentId.filter((id_filter) => id_filter !== item._id))
                } else {
                  setSelectedStudentId([...selectedStudentId, item._id])
                }
              }}
              className={`${style.inner_line}`}>
              {/* 勾選框 */}
              {item.userinfo.username === undefined && <span className={`${style.user_name}`}>無</span>}
              {item.userinfo.username !== undefined && <span className={`${style.user_name}`}>{item.userinfo.username}</span>}
              <span className={`${style.real_name}`}>{item.userinfo.realname}</span>
              <span className={style['phone']}>{item.userinfo.phoneNumber}</span>
              <span className={style['course-class']}>{item.userinfo.courseClass}</span>
              <span className={style['grade']}>{item.role === 'student' ? item.userinfo.grade : null}</span>
              {item.role === 'teacher' && <span className={style['role']}>教師</span>}
              {item.role === 'student' && <span className={style['role']}>學生</span>}
              {item.role === 'admin' && <span className={style['role']}>管理員</span>}
            </div>
          ))}
      </ul>

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
  )
}
