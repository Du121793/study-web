import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'

// method
import { useUserToken } from '../../method/useUserToken'
import userService from '../../method/userService'

// public
import downArrow from '../../public/course/downArrow.png'
import leftArrow from '../../public/course/leftArrow.png'

// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

export default function QaNav({ course_id, courseName }) {
  const token = useUserToken()
  const baseUrl = `${clientIp}/`
  const backToMyCoursePageUrl = `${clientIp}/profiles/profile`
  const [isLogined, setLogined] = useState(false)
  const [isShowVideoUpload, setIsShowVideoUpload] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  // 改為初始值空陣列，方便後續 map 遍歷
  const [courseQas, setCourseQas] = useState([])
  const [qaOpen, setQaOpen] = useState(false)
  const qaContentRef = useRef(null)
  const [qaContentHeight, setQaContentHeight] = useState(0)

  // 切換 Q&A 展開/收合
  const toggleQA = () => {
    if (!qaOpen) {
      if (qaContentRef.current) {
        setQaContentHeight(qaContentRef.current.scrollHeight)
      }
      setQaOpen(true)
    } else {
      setQaContentHeight(0)
      setQaOpen(false)
    }
  }

  // 請求使用者資料與課程 Q&A 資料
  useEffect(() => {
    if (token) {
      userService
        .getUserInfo(token)
        .then((res) => {
          setUserInfo(res.data)
          setLogined(true)
        })
        .catch((err) => console.error('Error:', err.message))
      userService
        .getCourseQA(token, course_id)
        .then((res) => {
          setCourseQas(res.data)
        })
        .catch((err) => console.error('Error:', err.message))
    }
  }, [token, course_id])

  // 監控展開狀態以調整高度
  useEffect(() => {
    if (qaOpen && qaContentRef.current) {
      setQaContentHeight(qaContentRef.current.scrollHeight)
    }
  }, [qaOpen])

  // 從每筆 QA 的 hints (陣列) 取出所有不重複的標籤
  const types = courseQas.length > 0 ? [...new Set(courseQas.flatMap((item) => item.hints))] : []

  const test = () => {
    console.log(courseQas)
  }
  return (
    <div
      className="nav"
      id="qa-nav">
      <div
        onClick={toggleQA}
        className="header">
        <Image
          src={downArrow}
          alt="open Q & A nav's icon"
          width={40}
          height={40}
        />
        <span>Q & A</span>
      </div>
      {/* 展開部分 */}
      <div
        className="QA-area"
        ref={qaContentRef}
        style={{
          height: qaOpen ? qaContentHeight + 'px' : '0px',
          overflow: 'hidden',
          transition: 'height 0.3s ease',
        }}>
        <div className="QA-header">
          <span onClick={test}>排序根據</span>
          <div className="select">
            <select>
              <option value="">主題排序</option>
              <option value="">內容排序</option>
            </select>
          </div>
          <div className="select">
            <select>
              <option value="">倒序</option>
              <option value="">正序</option>
            </select>
          </div>
        </div>
        <div className="QA-grid">
          {types.map((type, index) => {
            // 篩選出 hints 包含當前 type 的 Q&A
            const filteredQAs = courseQas.filter((qa) => qa.hints.includes(type))
            return (
              <div
                className="type-section"
                key={index}>
                <h2>{type}</h2>
                <ul className="qa-list">
                  {filteredQAs.map((qa) => (
                    <Link href={`${clientIp}/courses/QaPage?qa_id=${qa._id}&courseName=${courseName}`}>
                      <li
                        key={qa._id}
                        className="qa-item">
                        <div className="image-area">
                          {qa.image && qa.image.length > 0 && (
                            <Image
                              className="image"
                              src={qa.image[0]}
                              alt="QA image"
                              width={200}
                              height={200}
                            />
                          )}
                        </div>
                        <div className="qa-title">{qa.description}</div>
                        <div className="qa-dateTime">{new Date(qa.date).toLocaleString()}</div>
                      </li>
                    </Link>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
