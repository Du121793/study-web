// 組件庫
import { useEffect, useState } from 'react'
// method組件
import adminService from '../../method/adminService'
import { useUserToken } from '../../method/useUserToken'
export default function MemberSelector({ selectedStudentId, setSelectedStudentId }) {
  const [isSelectAllCheckbox, setIsSelectAllCheckbox] = useState(false)
  const token = useUserToken()

  // 請求參數
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [nameInput, setNameInput] = useState(null)
  const [phoneInput, setPhoneInput] = useState(null)
  const [gradeInput, setGradeInput] = useState(null)
  const [roleInput, setRoleInput] = useState(null)
  const [selectCourse, setSelectCourse] = useState(null)

  // 獲取資料
  const [members, setMembers] = useState([])
  const [totalPage, setTotalPage] = useState(null)
  const [totalArray, setTotalArray] = useState([])

  // 全選按鈕
  const selectAllStudent = () => {
    const boxs = document.querySelectorAll('.student-checkbox')
    boxs.forEach((checkbox) => {
      // 判斷是否有單個被選取
      if (checkbox.checked === false) {
        // 全部打勾
        checkbox.click()
      } else if (isSelectAllCheckbox === false && checkbox.checked === false) {
        boxs.forEach((checkbox) => {
          // 全部打勾
          checkbox.click()
        })
        setIsSelectAllCheckbox(true)
      }
    })
  }

  // 取消全選按鈕
  const clearSearch = () => {
    const boxs = document.querySelectorAll('.student-checkbox')
    if (isSelectAllCheckbox) {
      boxs.forEach((checkbox) => {
        // 全部打勾
        checkbox.click()
      })
      setIsSelectAllCheckbox(false)
    } else {
      // 判斷是否有單個被選取
      boxs.forEach((checkbox) => {
        if (checkbox.checked === true) {
          // 全部打勾
          checkbox.click()
        }
      })
    }
  }

  // 搜尋按鈕
  const searchStudentButton = () => {
    try {
      let data = {
        realname: nameInput,
        phoneNumber: phoneInput,
        gradeInput: gradeInput,
        role: roleInput,
        courses: selectCourse,
        page: page,
        pageSize: pageSize,
      }
      adminService.getMembers(token, data).then((res) => {
        setMembers(res.data)
        setTotalPage(res.totalPage)
        let temp = []
        for (let i = 1; i <= res.totalPage; i++) {
          temp.push(i)
        }
        setTotalArray(temp)
      })
    } catch (e) {
      console.error(e)
    }
  }

  // 按下打勾變色
  const checkboxClickEvent = (e) => {
    if (e.parentNode.style.border === '2px solid rgb(124, 225, 180)') {
      e.parentNode.style.border = '2px solid rgb(0, 0, 0,0.2)'
    } else {
      e.parentNode.style.border = '2px solid rgb(124, 225, 180)'
    }
  }

  // 點擊整片區域都能選取到
  const memberAreaClickEvent = (e) => {
    if (e.firstChild) {
      e.firstChild.click()
    }
  }

  // 初始化已選擇的學生
  const initSelectedId = () => {
    setSelectedStudentId([])
  }

  // 獲得成員清單
  useEffect(() => {
    if (token) {
      let data = {
        page: page,
        pageSize: pageSize,
      }
      try {
        adminService.getMembers(token, data).then((res) => {
          setMembers(res.data)
          setTotalPage(res.totalPage)
          let temp = []
          for (let i = 1; i <= res.totalPage; i++) {
            temp.push(i)
          }
          setTotalArray(temp)
        })
      } catch (e) {
        alert(e)
      }
    }
  }, [token, page, pageSize])

  const test = () => {
    console.log(selectedStudentId)
  }

  return (
    <div className="member-select-area">
      <div className="member-select-header">成員搜尋功能</div>
      <div className="classification">
        <div className="search-inputs">
          {/* 姓名 */}
          <div>
            <span>姓名:</span>
            <input
              className="input-name"
              onChange={(e) => {
                setNameInput(e.target.value)
                console.log(e.target.value)
              }}
              type="text"
            />
          </div>
          {/* 電話 */}
          <div>
            <span>電話:</span>
            <input
              className="input-phone"
              onChange={(e) => {
                setPhoneInput(e.target.value)
                console.log(e.target.value)
              }}
              type="text"
            />
          </div>
          {/* 年級 */}
          <div>
            <span>年級:</span>
            <input
              className="input-grade"
              onChange={(e) => {
                setGradeInput(e.target.value)
                console.log(e.target.value)
              }}
              type="text"
            />
          </div>
          {/* 身分組 */}
          <div className="search-inputs">
            身分組:
            <select
              onChange={(e) => {
                setRoleInput(e.target.value)
                console.log(e.target.value)
              }}
              name=""
              id="">
              <option value="">全部</option>
              <option value="teacher">教師</option>
              <option value="student">學生</option>
            </select>
          </div>
        </div>
        {/* 三個按鈕 */}
        <div className="btns">
          <button
            className="search-option-btn"
            onClick={selectAllStudent}>
            全選
          </button>
          <button
            className="search-option-btn"
            onClick={clearSearch}>
            取消全選
          </button>
          <button
            className="search-option-btn"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              searchStudentButton()
              initSelectedId()
            }}>
            搜尋
          </button>
        </div>
      </div>
      <ul className="member-area">
        <div className="title-area">
          <span id="username">暱稱</span>
          <span id="realname">姓名</span>
          <span id="phone-number">電話號碼</span>
          <span id="grade">年級</span>
          <span id="role">身分組</span>
        </div>
        {members &&
          members.map((item, index) => (
            <li
              style={{
                border: selectedStudentId.find((id) => {
                  return id === item._id
                })
                  ? '2px solid rgb(124, 225, 180)'
                  : '2px solid rgb(0, 0, 0,0.2)',
              }}
              key={index}
              onClick={(e) => {
                memberAreaClickEvent(e.target)
              }}>
              {/* 勾選框 */}
              <input
                className="student-checkbox"
                type="checkbox"
                checked={selectedStudentId.find((id) => {
                  return id === item._id
                })}
                onLoad={() => {
                  initSelectedId()
                }}
                onChange={(e) => {
                  checkboxClickEvent(e.target)
                  setSelectedStudentId((prev) => {
                    return e.target.checked ? [...prev, item._id] : prev.filter((id) => id !== item._id)
                  })
                }}
              />
              <div className="searched-info">
                {item.userinfo.username === undefined && <span id="username">無</span>}
                {item.userinfo.username !== undefined && <span id="username">{item.userinfo.username}</span>}
                <span id="realname">{item.userinfo.realname}</span>
                <span id="phone-number">{item.userinfo.phoneNumber}</span>
                <span id="course-class">{item.userinfo.courseClass}</span>
                <span id="grade">{item.userinfo.grade}</span>
                {item.role === 'teacher' && <span id="role">教師</span>}
                {item.role === 'student' && <span id="role">學生</span>}
                {item.role === 'admin' && <span id="role">管理員</span>}
              </div>
            </li>
          ))}
      </ul>

      <div className="page-switch">
        {page === 1 ? (
          <div className="content">已經在第一頁了</div>
        ) : (
          <div
            className="pointer content"
            onClick={() => {
              setPage(1)
            }}>
            第一頁
          </div>
        )}
        {page === 1 ? null : (
          <div
            className="page-switcher"
            onClick={() => {
              if (page === 1) {
                return
              } else {
                setPage((prop) => prop - 1)
              }
            }}>
            上一頁
          </div>
        )}

        <div className="now-page">{page}</div>
        {page === totalPage ? null : (
          <div
            className="page-switcher"
            onClick={() => {
              console.log(totalPage)
              if (page === totalPage) {
                return
              } else {
                setPage((prop) => prop + 1)
              }
            }}>
            下一頁
          </div>
        )}
        {page === totalPage ? (
          <div className="content">已經是最後一頁了</div>
        ) : (
          <div
            className="pointer content"
            onClick={() => {
              setPage(totalPage)
            }}>
            最後一頁
          </div>
        )}
      </div>
    </div>
  )
}
