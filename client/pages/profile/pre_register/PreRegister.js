'use client'
// 組件庫
import { useCallback, useEffect, useState } from 'react'
import style from './style.module.css'
// 導入methmod
import adminService from '../../../method/adminService'
import { useUserToken } from '../../../method/useUserToken'
// components
import BackGround from '../components/back_ground/BackGround'
import LoadingAnime from '../../../components/loading_anime/LoadingAnime'
import MessageAnime from '../../../components/message_anime/MessageAnime'
export default function PreRegister() {
  const token = useUserToken()
  const [getCourses, setGetCourses] = useState([])
  // 選擇身分組
  const [chooseRole, setChooseRole] = useState('')
  // 選擇年級
  const [chooseGrade, setChooseGrade] = useState('111')
  // 選擇課程
  const [chooseCourses, setChooseCourses] = useState([])
  const [chooseCoursesName, setChooseCoursesName] = useState([])
  // 使用 state 儲存所有使用者輸入的行資料
  const [inputRows, setInputRows] = useState([{ name: '', grade: '', phone: '' }])
  // 控制訊息
  const [message, setMessage] = useState(null)

  // 旋轉讀取
  const [loading, setLoading] = useState(false)

  // 儲存最後要提交的使用者資料
  let users = []
  let Busers = []

  // 處理各欄位輸入
  const handleInputChange = (index, field, value) => {
    const newRows = [...inputRows]
    newRows[index] = { ...newRows[index], [field]: value }
    setInputRows(newRows)

    // 當在最後一行的電話欄位輸入第一個字時，新增一行
    if (field === 'phone' && value.length === 1 && index === inputRows.length - 1) {
      setInputRows([...newRows, { name: '', phone: '' }])
    }
  }

  // 將新的成員註冊到所選課程內
  const registerCourseToNewMember = useCallback(
    (members_id, hasAlreadyRegister) => {
      // 註冊課程請求
      if (members_id.length > 0 && chooseCourses.length > 0) {
        let data = {
          user_ids: members_id,
          course_ids: chooseCourses,
        }
        adminService.registerMember(token, data).then((res) => {
          if (!hasAlreadyRegister) {
            if (res.success) {
              setMessage('註冊成功')
            } else {
              setMessage(`發生錯誤`)
            }
          }
        })
      }
    },
    [token, chooseCourses]
  )

  // 提交按鈕
  const submitBtnClick = () => {
    // 檢查是否選擇身分組
    if (!chooseRole) {
      setMessage(`請選擇身分組`)
      setTimeout(() => {
        setMessage(null)
      }, 2000)
      return
    }
    if (!inputRows) {
      setMessage(`請輸入欲註冊的用戶資訊`)
      setTimeout(() => {
        setMessage(null)
      }, 2000)
      return
    }

    // 檢查每一行資料
    const userArray = inputRows
      .filter((row) => row.name.trim() !== '' || row.phone.trim() !== '')
      .map((row) => ({
        realname: row.name.trim(),
        phoneNumber: row.phone.trim(),
        // 這兩個值是在過濾後才加進userArray
        grade: chooseGrade,
        role: chooseRole,
      }))
    if (userArray.length === 0) {
      setMessage('請完整輸入欲註冊的用戶資訊')
      return
    }
    // 用some檢查物件內是否有重複資料
    const duplicateFound = userArray.some((newUser) => users.some((existingUser) => existingUser.realname === newUser.realname && existingUser.phoneNumber === newUser.phoneNumber && existingUser.role === newUser.role))
    if (duplicateFound) {
      setMessage('註冊失敗，已有相同的用戶資料')
      return
    }

    // 將新資料加入 users 陣列
    userArray.forEach((user) => users.push(user))

    // 組裝要送出的資料格式
    userArray.forEach((item) => {
      let studentInfo = {
        realname: item.realname,
        phoneNumber: item.phoneNumber,
        grade: item.grade,
      }
      let teachertInfo = {
        realname: item.realname,
        phoneNumber: item.phoneNumber,
      }
      if (item.grade) {
        Busers.push({ userinfo: studentInfo, role: item.role })
      } else {
        Busers.push({ userinfo: teachertInfo, role: item.role })
      }
    })
    setLoading(true)
    // 預註冊請求
    adminService
      .preRegisterUser(token, Busers)
      .then((res) => {
        setLoading(false)
        // 如果有成員是被註冊過的
        if (res.data.successMsg.alreadyRegistered !== '') {
          let content = res.data.successMsg.alreadyRegistered
          setMessage(`新增成員成功，${content}`)
          return res
        } else if (res.data.successMsg.successStudentId.length > 0 && chooseCourses.length === 0) {
          setMessage(`新增成員成功`)
          return res
        }
        return res
      })
      .then((res) => {
        setLoading(false)
        if (chooseCourses.length > 0 && res.data.successMsg.alreadyRegistered !== '') {
          registerCourseToNewMember(res.data.successMsg.successStudentId, res.data.successMsg.alreadyRegistered)
        } else {
          registerCourseToNewMember(res.data.successMsg.successStudentId)
        }
      })
    // 重置 state，用於清空欄位
    setInputRows([{ name: '', phone: '' }])
    setChooseRole('')
    setTimeout(() => {
      setMessage(null)
    }, 2000)
  }

  // 切換身分組時更改State，用於控制年級選擇是否顯示
  const switchRoleOption = (value) => {
    setChooseRole(value)
  }

  // 移除選擇的課程
  const removeChoseCourse = (index) => {
    setChooseCourses(
      chooseCourses.filter((item) => {
        return item !== chooseCourses[index]
      })
    )
    setChooseCoursesName(
      chooseCoursesName.filter((item) => {
        return item !== chooseCoursesName[index]
      })
    )
  }

  const test = () => {}

  // 獲取課程給select
  useEffect(() => {
    if (token) {
      setLoading(true)
      adminService.getCourses(token).then((res) => {
        if (res?.success) {
          setGetCourses(res.data.courses)
        } else {
          setMessage('發生錯誤')
        }
        setLoading(false)
      })
    }
  }, [token])

  return (
    <div className={`${style.preRegister_main}`}>
      {loading && <LoadingAnime top={'10%'}></LoadingAnime>}
      {message && (
        <MessageAnime
          message={message}
          top="100px"
          duration={2000}
        />
      )}
      {/* message */}
      <div
        className="right-bottom-loading-area"
        style={{ right: loading ? '8px' : '-100%' }}>
        <div className="loading"></div>
      </div>
      {loading && (
        <div className="loading-main">
          <div className="loader"></div>
        </div>
      )}
      <BackGround></BackGround>
      <div className={style.header}>
        <div className={style.title}>預註冊系統</div>
      </div>
      <div className={`${style.chose_courses_card_area}`}>
        {chooseCoursesName.length > 0 &&
          chooseCoursesName.map((item, index) => (
            <div
              key={index}
              className={`${style.course_card}`}>
              {item}
              <div
                className={`${style.delete_btn}`}
                onClick={() => {
                  removeChoseCourse(index)
                }}>
                X
              </div>
            </div>
          ))}
      </div>
      <div className={style.form}>
        <div className={`${style.form_line}`}>
          {/* 選擇身分組 */}
          <div className={`${style.form_selects}`}>
            <div className={`${style.choose_role_cantainer}`}>
              選擇身分組
              <select
                value={chooseRole}
                onChange={(e) => switchRoleOption(e.target.value)}>
                <option value="">請選擇</option>
                <option value="teacher">老師</option>
                <option value="student">學生</option>
              </select>
            </div>
            <div className={`${style.chose_grade}`}>
              {/* 如果是學生，顯示年級欄位 */}
              {chooseRole === 'student' && (
                <>
                  <div>年級</div>
                  <input
                    type="text"
                    style={{ width: 120 }}
                    onChange={(e) => {
                      setChooseGrade(e.target.value)
                    }}
                  />
                </>
              )}
            </div>
            <div className={`${style.choose_course_cantainer}`}>
              選擇要直接加入的課程
              <select
                onChange={(e) => {
                  if (e.target.value === '') return
                  if (
                    chooseCourses.find((item) => {
                      return item === e.target.value.split(',')[0]
                    })
                  ) {
                    // 檢查是否已有存course_id
                    return
                  } else {
                    setChooseCourses([...chooseCourses, e.target.value.split(',')[0]])
                  }
                  // 檢查是否已有存course_name
                  if (
                    chooseCoursesName.find((item) => {
                      return item === e.target.value.split(',')[1]
                    })
                  ) {
                    return
                  } else {
                    setChooseCoursesName([...chooseCoursesName, e.target.value.split(',')[1]])
                  }
                }}>
                <option value="">請選擇</option>
                {getCourses &&
                  getCourses.map((item, index) => (
                    <option
                      key={index}
                      value={[item._id, item.courseName]}>
                      {item.courseName}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className={`${style.copy_area}`}>
            {inputRows.map((row, index) => (
              <div
                key={index}
                className={`${style.input_area}`}>
                <div>姓名:</div>
                <input
                  className={`input ${style.name_input}`}
                  type="text"
                  value={row.name}
                  onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                />
                <div>電話:</div>
                <input
                  className={style.input}
                  type="text"
                  value={row.phone}
                  onChange={(e) => handleInputChange(index, 'phone', e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* 送出按鈕 */}
      <div className={`${style.form_submit}`}>
        <button
          className={`g-blue-btn ${style.submit}`}
          onClick={submitBtnClick}>
          送出
        </button>
      </div>
    </div>
  )
}
