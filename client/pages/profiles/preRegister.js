// 組件庫
import { use, useEffect } from 'react'
// 導入方法
import adminService from '../methods/service/adminService'
import { useUserToken } from '../methods/service/useUserToken'
export default function PreRegister() {
  // 這裡改為儲存平鋪的使用者物件，而非陣列的陣列
  let users = []
  let Busers = []
  const token = useUserToken()

  const submitBtnClick = () => {
    const role = document.querySelector('.chose-role').value
    if (!role) {
      alert('請先選擇身分組')
      return
    }

    // 取得 .copy-area 下的所有「行」
    const rowDivs = document.querySelectorAll('.copy-area > div')

    // 用來存放使用者輸入的每筆資料
    let userArray = []

    rowDivs.forEach((row) => {
      // 取出每行中的 name 與 phone 輸入欄位
      const nameInput = row.querySelector('.name-input')
      const phoneInput = row.querySelector('.phone-input')
      const gradeInput = row.querySelector('.grade-input')

      if (nameInput && phoneInput) {
        const nameValue = nameInput.value.trim()
        const phoneValue = phoneInput.value.trim()
        const gradeValue = gradeInput.value.trim()

        // 若該行有輸入資料就組成物件
        if (nameValue !== '' || phoneValue !== '' || gradeValue !== '') {
          userArray.push({
            realname: nameValue,
            phoneNumber: phoneValue,
            grade: gradeValue,
            role: role,
          })
        }
      }
    })

    // 檢查新資料中是否有重複的物件 (與 users 陣列內已有的比較)
    const duplicateFound = userArray.some((newUser) => users.some((existingUser) => existingUser.name === newUser.name && existingUser.phone === newUser.phone && existingUser.role === newUser.role))

    if (duplicateFound) {
      alert('警告：已有相同的使用者資料')
      return
    }

    // 沒有重複才將新資料加入 users 陣列
    userArray.forEach((user) => users.push(user))
    console.log('收集到的資料：', userArray)
    console.log('目前的所有資料：', users)

    // 重置 input 欄位到初始狀態：
    // 清空 .copy-area 內容，並重新插入初始那一行
    const copyArea = document.querySelector('.copy-area')
    copyArea.innerHTML = `
      <div>
        <div class="form-title">姓名:</div>
        <input class="input name-input" type="text" />
        <div class="form-title">年級:</div>
        <input class="input grade-input" type="text" />
        <div class="form-title">電話:</div>
        <input class="input phone-input" type="text" />
      </div>
    `
    // 重置下拉選單為預設值
    document.querySelector('.chose-role').value = ''

    // {userinfo , role}
    users.map((item) => {
      console.log(item)
      let userinfo = {
        realname: item.realname,
        phoneNumber: item.phoneNumber,
        grade: item.grade,
      }
      Busers.push({ userinfo }, role)
    })
    adminService.preRegisterUser(token, Busers).then((res) => {
      console.log(res)
    })
  }

  useEffect(() => {
    const area = document.querySelector('.copy-area')

    // 當使用者在電話欄位輸入第一個字時，自動新增一行
    const handleInput = (event) => {
      if (event.target.matches('.phone-input')) {
        const inputValue = event.target.value
        if (inputValue.length === 1) {
          area.insertAdjacentHTML(
            'beforeend',
            `
            <div>
              <div class="form-title">姓名:</div>
              <input class="input name-input" type="text" />
              <div class="form-title">年級:</div>
              <input class="input grade-input" type="text" />
              <div class="form-title">電話:</div>
              <input class="input phone-input" type="text" />
            </div>
            `
          )
        }
      }
    }

    // 監聽 .copy-area 的 input 事件
    area.addEventListener('input', handleInput)

    // 清除監聽器 (避免 React 18 Strict Mode 重複掛載)
    return () => {
      area.removeEventListener('input', handleInput)
    }
  }, [])

  // layout
  return (
    <div className="preRegister-main">
      <div className="header">
        <div className="title">預註冊系統</div>
      </div>
      <div className="form">
        <div className="form-line">
          {/* 選擇身分組 */}
          <div className="form-select">
            <div className="form-title">選擇身分組</div>
            <select className="chose-role">
              <option value="">請選擇</option>
              <option value="teacher">老師</option>
              <option value="student">學生</option>
            </select>
          </div>
          <div className="copy-area">
            {/* 初始那一行 */}
            <div>
              <div className="form-title">姓名:</div>
              <input
                className="input name-input"
                type="text"
              />
              <div className="form-title">年級:</div>
              <input
                className="input grade-input"
                type="text"
              />
              <div className="form-title">電話:</div>
              <input
                className="input phone-input"
                type="text"
              />
            </div>
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
