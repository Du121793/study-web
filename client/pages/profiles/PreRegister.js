'use client'
// 組件庫
import { useCallback, useEffect, useState } from 'react'
// 導入methmod
import adminService from '../../method/adminService'
import { useUserToken } from '../../method/useUserToken'

export default function PreRegister() {
  const token = useUserToken()
  const [getCourses, setGetCourses] = useState([])
  // 選擇身分組
  const [chooseRole, setChooseRole] = useState('')
  // 選擇年級
  const [chooseGrade, setChooseGrade] = useState('')
  // 選擇課程
  const [chooseCourse, setChooseCourse] = useState('')
  // 使用 state 儲存所有使用者輸入的行資料
  const [inputRows, setInputRows] = useState([{ name: '', grade: '', phone: '' }])
  // 存儲user_id
  const [user_id, setUser_id] = useState([])
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

  // 提交按鈕
  const submitBtnClick = () => {
    // 檢查是否選擇身分組
    if (!chooseRole) {
      alert('請先選擇身分組')
      return
    }

    // 檢查每一行資料
    const userArray = inputRows
      .filter((row) => row.name.trim() !== '' || row.phone.trim() !== '')
      .map((row) => ({
        realname: row.name.trim(),
        phoneNumber: row.phone.trim(),
        grade: chooseGrade,
        role: chooseRole,
      }))

    // 檢查重複
    const duplicateFound = userArray.some((newUser) => users.some((existingUser) => existingUser.realname === newUser.realname && existingUser.phoneNumber === newUser.phoneNumber && existingUser.role === newUser.role))
    if (duplicateFound) {
      alert('警告：已有相同的使用者資料')
      return
    }

    // 將新資料加入 users 陣列
    userArray.forEach((user) => users.push(user))
    console.log('收集到的資料：', userArray)
    console.log('目前的所有資料：', users)

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

    // 預註冊請求
    adminService.preRegisterUser(token, Busers).then((res) => {
      console.log(res)
      setUser_id(res.successStudentId)
    })
    // 重置 state，用於清空欄位
    setInputRows([{ name: '', phone: '' }])
    setChooseRole('')
  }

  // 將新的成員註冊到所選課程內
  const registerCourseToNewMember = useCallback(() => {
    // 註冊課程請求
    if (chooseCourse) {
      adminService.registerMember(token, { user_ids: user_id, course_id: chooseCourse }).then((res) => {
        console.log('registerMember結果', res)
      })
    }
  }, [token, chooseCourse, user_id])

  // 切換身分組時更改State，用於控制年級選擇是否顯示
  const switchRoleOption = (value) => {
    setChooseRole(value)
  }

  // 獲取課程給select
  useEffect(() => {
    if (token) {
      try {
        adminService.getCourses(token).then((res) => {
          setGetCourses(res.data.courses)
        })
      } catch (e) {
        console.log(e)
      }
    }
  }, [token])

  useEffect(() => {
    registerCourseToNewMember()
  }, [user_id, registerCourseToNewMember])

  return (
    <div className="preRegister-main">
      <div className="header">
        <div className="title">預註冊系統</div>
      </div>
      <div className="form">
        <div className="form-line">
          {/* 選擇身分組 */}
          <div className="form-selects">
            <div className="choose-role-cantainer">
              選擇身分組
              <select
                className="chose-role"
                value={chooseRole}
                onChange={(e) => switchRoleOption(e.target.value)}>
                <option value="">請選擇</option>
                <option value="teacher">老師</option>
                <option value="student">學生</option>
              </select>
            </div>
            <div className="chose-grade">
              {/* 如果是學生，顯示年級欄位 */}
              {chooseRole === 'student' && (
                <>
                  <div className="form-title">年級</div>
                  <select
                    onChange={(e) => {
                      console.log(e.target.value)
                      setChooseGrade(e.target.value)
                    }}>
                    <option value="111">111</option>
                    <option value="112">112</option>
                  </select>
                </>
              )}
            </div>
            <div className="choose-course-cantainer">
              選擇要直接加入的課程
              <select
                className="chose-course"
                onChange={(e) => {
                  setChooseCourse(e.target.value)
                }}>
                <option value="">請選擇</option>
                {getCourses &&
                  getCourses.map((item, index) => (
                    <option
                      key={index}
                      value={item._id}>
                      {item.courseName}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="copy-area">
            {inputRows.map((row, index) => (
              <div key={index}>
                <div className="form-title">姓名:</div>
                <input
                  className="input name-input"
                  type="text"
                  value={row.name}
                  onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                />
                <div className="form-title">電話:</div>
                <input
                  className="input phone-input"
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
      <div className="form-submit">
        <button
          className="submit"
          onClick={submitBtnClick}>
          送出
        </button>
      </div>
    </div>
  )
}
