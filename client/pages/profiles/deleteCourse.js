// 組件庫
import { useState, useEffect } from 'react'
import { useUserToken } from '../methods/service/useUserToken'
import Image from 'next/image'
// 導入方法
import adminService from '../methods/service/adminService'
// public 資料夾的圖片
import searchIcon from '../../public/global/search.png'

export default function DeleteCourse() {
  const token = useUserToken()
  const [message, setMessage] = useState('')
  const [getCourses, setGetCourses] = useState({ courses: [] })
  const [deleteAlert, setDeleteAlert] = useState('none')

  const [tempCourseId, setTempCourseId] = useState({ courses: [] })
  // 刪除二次確認
  let doubleCheckDelete = false

  // 請求課程資料
  const initCourses = (token) => {
    if (token) {
      try {
        adminService.getCourses(token, { page: 1, pageSize: 10 }).then((res) => {
          setGetCourses(res)
        })
      } catch (error) {
        console.log(error)
      }
    }
  }

  // 按鈕刪除並且if確認是否要刪除才發請求
  const deleteThisCourse = (course) => {
    setTempCourseId(course)
    if (doubleCheckDelete) {
      // 取得 alert 與 spinner 的 DOM 節點
      const alertElem = document.querySelector('.alert')
      const spinner = document.getElementById('spinner')

      // 點擊後馬上顯示 spinner 轉圈動畫
      alertElem.style.display = 'flex'
      spinner.style.display = 'block'
      spinner.classList.add('spin-animation')

      // 發送刪除請求
      adminService
        .deleteCourse(token, course)
        .then((message) => {
          console.log('成功刪除: ' + message)
          // 初始化二次確認
          doubleCheckDelete = false

          // 刪除成功後馬上隱藏 spinner
          alertElem.style.display = 'none'
          spinner.style.display = 'none'
          spinner.classList.remove('spin-animation')

          // 重新載入課程資料、更新訊息
          initCourses(token)
          setMessage('成功刪除')

          // 顯示 alert 訊息（先立即出現，再啟用淡出動畫）
          alertElem.style.transition = '0s'
          alertElem.style.opacity = '1'
          alertElem.style.marginTop = '0px'
          alertElem.style.backgroundColor = 'rgba(236, 104, 104,1)'

          // 延遲 50 毫秒後啟用淡出動畫
          setTimeout(() => {
            alertElem.style.transition = '1s ease-in-out'
            alertElem.style.marginTop = '-100px'
            alertElem.style.opacity = '0'
            alertElem.style.backgroundColor = 'rgba(236, 104, 104,0)'
          }, 50)
        })
        .catch((error) => {
          console.log('刪除出現錯誤: ' + error)
          // 如果發生錯誤，也要立即隱藏 spinner
          spinner.style.display = 'none'
          spinner.classList.remove('spin-animation')
        })
    } else {
      setDeleteAlert('flex')
    }
  }

  // 二次確認刪除
  const confirmDelete = (e) => {
    if (e.innerText === '確定') {
      doubleCheckDelete = true
      setDeleteAlert('none')
      deleteThisCourse(tempCourseId)
    } else if (e.innerText === '取消') {
      doubleCheckDelete = false
      setDeleteAlert('none')
    }
  }
  // 元件掛載後以及 token 改變時請求課程資料
  useEffect(() => {
    if (token) initCourses(token)
  }, [token])

  return (
    <div>
      <div className="delete-course-main">
        <div className="delete-course-page-header">
          刪除課程系統
        </div>
        <div
          className="delete-alert-container"
          style={{ display: deleteAlert }}>
          <div className="delete-alert">
            <span>確定要刪除該課程嗎? (影片會被一起刪除!)</span>
            <div className="btns">
              <button
                onClick={(e) => {
                  confirmDelete(e.target)
                }}>
                確定
              </button>
              <button
                onClick={(e) => {
                  confirmDelete(e.target)
                }}>
                取消
              </button>
            </div>
          </div>
        </div>
        {/* spinner 元素，預設隱藏 */}
        <div
          id="spinner"
          style={{ display: 'none' }}></div>
        {/* alert 元素 */}
        <div className="alert">{message}</div>
        <div className="header">
          {/* 年級 */}
          <div className="option-area">
            <span>年級:</span>
            <input
              className="grade-input"
              type="text"
            />
          </div>
          {/* 科目 */}
          <div className="option-area">
            <span>科目:</span>
            <input
              className="subject-input"
              type="text"
            />
          </div>
          {/* 班級 */}
          <div className="option-area">
            <span>班級:</span>
            <input
              className="class-input"
              type="text"
            />
          </div>
          {/* 送出按鈕 */}
          <div className="option-area">
            <div className="search-btn">
              <Image
                alt="search button"
                src={searchIcon}
                width={24}
                height={24}
              />
            </div>
          </div>
        </div>
        <div className="courses-area">
          <div className="cousers-titles">
            <span className="count">筆數</span>
            <span className="course-name">課程名稱</span>
            <span className="grade">學年度</span>
            <span className="subject">班級</span>
          </div>
          {getCourses.courses.map((item, index) => (
            <div
              key={item._id}
              className="courses-per-map">
              {/* 第幾筆資料 */}
              <div className="course count">
                <span>{index + 1}</span>
              </div>
              {/* 課程名稱 */}
              <div className="course course-name">
                <span>{item.courseName}</span>
              </div>
              {/* 學年度 */}
              <div className="course grade">
                <span>{item.grade}</span>
              </div>
              {/* 班級 */}
              <div className="course subject">
                <span>{item.subject}</span>
                <button
                  className="delete-btn"
                  onClick={() => deleteThisCourse(item._id)}>
                  刪除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
