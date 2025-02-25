import React from 'react'
// 組件庫
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// method
import { useUserToken } from '../methods/service/useUserToken'
import userService from '../methods/service/userService'

// public
import downArrow from '../../public/course/downArrow.png'
import leftArrow from '../../public/course/leftArrow.png'

// env
const clientIp = process.env.NEXT_PUBLIC_CLIENT_IP

const qaNav = (courseId, courseName) => {
  // 假資料 (Q&A)
  const QAs = [
    {
      type: '天文',
      title: '112-1-1 天文問題',
      date: '2024年1月1號',
      time: '下午4點',
    },
    {
      type: '天文',
      title: '112-1-1 天文問題',
      date: '2024年1月1號',
      time: '下午4點',
    },
    {
      type: '天文',
      title: '112-1-1 天文問題',
      date: '2024年1月1號',
      time: '下午4點',
    },
    {
      type: '地質',
      title: '112-1-1 地質問題',
      date: '2024年1月1號',
      time: '下午4點',
    },
    {
      type: '地質',
      title: '112-1-1 地質問題',
      date: '2024年1月1號',
      time: '下午4點',
    },
    {
      type: '無知識點',
      title: '112-1-1 無知識點問題',
      date: '2024年1月1號',
      time: '下午4點',
    },
    {
      type: '大氣',
      title: '112-1-1 大氣問題',
      date: '2024年1月1號',
      time: '下午4點',
    },
    {
      type: '大氣',
      title: '112-1-1 大氣問題',
      date: '2024年1月1號',
      time: '下午4點',
    },
    {
      type: '天然災害',
      title: '112-1-1 天然災害問題',
      date: '2024年1月1號',
      time: '下午4點',
    },
    {
      type: '天然災害',
      title: '112-1-1 天然災害問題',
      date: '2024年1月1號',
      time: '下午4點',
    },
  ]

  // 獲取資料
  const token = useUserToken()

  // 參數
  const baseUrl = `${clientIp}/`
  const backToMyCoursePageUrl = `${clientIp}/profiles/profile`
  const [course_id, setCourse_id] = useState('')
  const [isLogined, setLogined] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const [isShowVideoUpload, setIsShowVideoUpload] = useState(false)

  // Q&A 區塊 - 同樣使用 ref 與 state 控制展開/收合
  const [qaOpen, setQaOpen] = useState(false)
  const qaContentRef = useRef(null)
  const [qaContentHeight, setQaContentHeight] = useState(0)

  // 請求使用者資料
  useEffect(() => {
    if (token) {
      userService
        .getUserInfo(token)
        .then((res) => {
          setUserInfo(res.data)
          setLogined(true)
        })
        .catch((err) => console.error('Error:', err.message))
    }
  }, [token])

  // 計算QA的高度，用於transition
  useEffect(() => {
    if (qaOpen && qaContentRef.current) {
      setQaContentHeight(qaContentRef.current.scrollHeight)
    }
  }, [qaOpen])

  // 切換Q&A的展示收回狀態
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

  const types = [...new Set(QAs.map((item) => item.type))]

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
      {/* 打開部分 */}
      <div
        className="QA-area"
        ref={qaContentRef}
        style={{
          height: qaOpen ? qaContentHeight + 'px' : '0px',
          overflow: 'hidden',
          transition: 'height 0.3s ease',
        }}>
        <div className="QA-header">
          <span>排序根據</span>
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
          {types.map((type) => {
            const filteredQAs = QAs.filter((qa) => qa.type === type)
            return (
              <div
                className="type-section"
                key={type}>
                <h2>{type}</h2>
                <ul className="qa-list">
                  {filteredQAs.map((qa, index) => (
                    <li
                      key={index}
                      className="qa-item">
                      <div className="image"></div>
                      <div className="qa-title">{qa.title}</div>
                      <div className="qa-dateTime">
                        {qa.date}　{qa.time}
                      </div>
                    </li>
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

export default qaNav
