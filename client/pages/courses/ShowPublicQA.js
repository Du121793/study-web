// 組件庫
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// method
import userService from '../../method/userService'

// env
const client_base_URL = process.env.NEXT_PUBLIC_CLIENT_IP
const server_base_URL = process.env.NEXT_PUBLIC_SERVER_IP

export default function ShowPublicQA({ courseName, token, course_id, showPublicQA, setShowPublicQA, publicQAInfo, resourceCategory, hint }) {
  const image_base_url = `${server_base_URL}/resource/questionIMG/`
  const [page_body, setPage_body] = useState([])

  // 控制頁面scroll狀態
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setPage_body(document.querySelector('body'))
    }
    if (page_body && page_body.style) {
      page_body.style.overflow = 'hidden'
    }
  }, [page_body])

  const test = () => {
    console.log(publicQAInfo)
  }

  return (
    <div
      className="show-more-public-main"
      onClick={test}>
      <div className="qa-info-area">
        <div
          className="close-ui-btn"
          onClick={() => {
            page_body.style.overflow = 'scroll'
            setShowPublicQA(!showPublicQA)
          }}>
          關閉
        </div>
        <div className="title">公開QA</div>
        <div className="info-container">
          {publicQAInfo &&
            publicQAInfo.map((item, index) => (
              <div
                className="qa-card"
                key={index}>
                <div className="tag-area">
                  {/* 大tag */}
                  {/* 第一個判斷條件為目前選擇的排序(tag)是哪個 */}
                  {resourceCategory && (
                    <div className="big-tag-area">
                      {item.resourceCategories.map((tagName, index) => (
                        <div
                          className="tag-content"
                          key={index}>
                          {tagName === '' && '無主題'}
                          {tagName}
                        </div>
                      ))}
                    </div>
                  )}
                  {hint && (
                    <div className="big-tag-area">
                      {item.hints.map((tagName, index) => (
                        <div
                          className="tag-content"
                          key={index}>
                          {tagName === '' && '無標籤'}
                          {tagName}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* 小tag */}
                  {!resourceCategory && (
                    <div className="little-tag-area">
                      {item.resourceCategories.map((tagName, index) => (
                        <div
                          className="tag-content"
                          key={index}>
                          {tagName === '' && '無特定主題'}
                          {tagName}
                        </div>
                      ))}
                    </div>
                  )}
                  {!hint && (
                    <div className="little-tag-area">
                      {item.hints.map((tagName, index) => (
                        <div
                          className="tag-content"
                          key={index}>
                          {tagName === '' && '無特定標籤'}
                          {tagName}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="image-area">
                  {item.image.map((url, index) => (
                    <div>
                      <Image
                        key={index}
                        src={`${url}`}
                        className="image"
                        alt="qa image"
                        width={200}
                        height={200}></Image>
                    </div>
                  ))}
                </div>
                <div className="content-area">
                  <div className="time">
                    <div className="create-time">發布時間 : {new Date(item.date).toLocaleString()}</div>
                  </div>
                  <div className="description">{item.description}</div>
                  <div className="into-qustion-page-btn">
                    <Link
                      className="link"
                      onClick={() => {
                        page_body.style.overflow = 'scroll'
                      }}
                      href={`${client_base_URL}/courses/QaPage?qa_id=${item._id}&courseName=${courseName}`}>
                      進到問題頁面
                    </Link>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
