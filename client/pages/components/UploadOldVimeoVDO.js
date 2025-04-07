import React, { useEffect, useRef, useState } from 'react'
import adminService from '../../method/adminService'
import { useStrictClickHandler } from '../../method/userful'
import { useUserToken } from '../../method/useUserToken'

export default function UploadOldVimeoVDO({ course_id, uploadOldVimeoVDOInnerEleOpacity, setUploadOldVimeoVDOInnerEleOpacity, uploadOldVimeoVDOWidht, setUploadOldVimeoVDOWidht, setShowUploadOldVimeoVDOUI, showUploadOldVimeoVDOUI, setUploadOldVimeoVDOHeight, UploadOldVimeoVDOHeight }) {
  const token = useUserToken()
  // 控制 body 的滾動條
  const [page_body, setPage_body] = useState(null)
  // 卡片資料
  const [cards, setCards] = useState([])
  // 獲得response
  const [videoMsg, setVideoMsg] = useState([])
  const [getResponse, setGetResponse] = useState(false)
  // 關閉 UI 的嚴格點擊處理
  const strictClickCloseUI = useStrictClickHandler(() => {
    if (getResponse) return
    setUploadOldVimeoVDOHeight(0)
    setUploadOldVimeoVDOWidht(0)
    setUploadOldVimeoVDOInnerEleOpacity(0)
    if (page_body && page_body.style) {
      page_body.style.overflow = 'auto'
    }
    setTimeout(() => {
      setShowUploadOldVimeoVDOUI(false)
    }, 200)
  })

  const closeWidow = () => {
    setUploadOldVimeoVDOHeight(0)
    setUploadOldVimeoVDOWidht(0)
    setUploadOldVimeoVDOInnerEleOpacity(0)
    if (page_body && page_body.style) {
      page_body.style.overflow = 'auto'
    }
    setTimeout(() => {
      setShowUploadOldVimeoVDOUI(false)
    }, 200)
  }

  // 新增一個空的卡片（預設各欄位值）
  const addNewCard = () => {
    setCards([...cards, { title: '', description: '', recordDate: '', isPrivate: false, uid: 0 }])
  }

  // 移除指定索引的卡片
  const removeCard = (index) => {
    const newCards = cards.filter((_, i) => i !== index)
    setCards(newCards)
  }

  // 模擬上傳動作：這裡僅 console.log cards 資料
  const uploadVideo = () => {
    if (
      cards.find((item) => {
        return item.title === ''
      })
    ) {
      console.log('每個影片必須有標題與描述')
      return
    }
    if (
      cards.find((item) => {
        return item.description === ''
      })
    ) {
      console.log('每個影片必須有標題與描述')
      return
    }
    let cardsTemp = cards.map((item, index) => {
      return { ...item, uid: index }
    })
    let data = { videos: cardsTemp }
    adminService.batchCreate(token, data, course_id).then((res) => {
      console.log(res)
      if (res.success) {
        setGetResponse(true)
        console.log(res.msg)
        setVideoMsg(res.data)
      }
    })
    // 可以在這裡調用 adminService.batchCreate 等 API 上傳影片資料
  }

  // 控制頁面 scroll 狀態
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setPage_body(document.querySelector('body'))
    }
    if (page_body && page_body.style) {
      page_body.style.overflow = 'hidden'
    }
  }, [page_body])

  return (
    <div
      className="upload-old-vimeo-vdo-area"
      {...strictClickCloseUI}>
      <div className="container">
        <div
          className="ui"
          onClick={(e) => e.stopPropagation()}
          style={{ height: UploadOldVimeoVDOHeight, width: uploadOldVimeoVDOWidht }}>
          <div
            className="inner-element"
            style={{ opacity: uploadOldVimeoVDOInnerEleOpacity }}>
            <div className="btn-area">
              <div
                className="g-blue-btn"
                onClick={addNewCard}>
                新增影片資訊
              </div>
              <div
                className="g-blue-btn"
                onClick={uploadVideo}>
                上傳
              </div>
              {getResponse && (
                <div
                  className="g-blue-btn confirm"
                  onClick={closeWidow}>
                  確認完成後點擊此處
                </div>
              )}
            </div>

            <div className="card-area">
              {!getResponse &&
                cards.map((item, index) => (
                  <div
                    className="card"
                    key={index}>
                    {/* 標題欄位 */}
                    <div className="input-area">
                      <div className="content title-area">
                        標題
                        <div
                          className="g-red-btn"
                          id="remove-card-btn"
                          onClick={() => removeCard(index)}>
                          X
                        </div>
                      </div>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const newCards = cards.map((card, i) => (i === index ? { ...card, title: e.target.value } : card))
                          setCards(newCards)
                        }}
                      />
                    </div>
                    {/* 描述欄位 */}
                    <div className="input-area">
                      <div className="content">描述</div>
                      <textarea
                        value={item.description}
                        onChange={(e) => {
                          const newCards = cards.map((card, i) => (i === index ? { ...card, description: e.target.value } : card))
                          setCards(newCards)
                        }}></textarea>
                    </div>
                    {/* 錄影日期欄位 */}
                    <div className="input-area">
                      <div className="content">錄影日期</div>
                      <input
                        type="date"
                        value={item.recordDate}
                        onChange={(e) => {
                          const newCards = cards.map((card, i) => (i === index ? { ...card, recordDate: e.target.value } : card))
                          setCards(newCards)
                        }}
                      />
                    </div>
                    {/* 是否公開欄位 */}
                    <div className="input-area checkbox">
                      <div className="content">是否公開</div>
                      <input
                        type="checkbox"
                        checked={item.isPrivate}
                        onChange={(e) => {
                          const newCards = cards.map((card, i) => (i === index ? { ...card, isPrivate: e.target.checked } : card))
                          setCards(newCards)
                        }}
                      />
                    </div>
                  </div>
                ))}
              {getResponse &&
                videoMsg.map((item, index) => (
                  <div
                    className="card"
                    key={index}>
                    {/* 標題欄位 */}
                    <div className="uid">{item.uid + 1}</div>
                    <div className="input-area">
                      <div className="content title-area active">請根據內容對vimeo進行操作</div>
                    </div>
                    {/* 描述欄位 */}

                    <div className="title-area">
                      <div className="content active">title</div>
                      <div className="inner-text">
                        {item.title}
                        <div
                          className="title-copy-btn"
                          onClick={async (e) => {
                            try {
                              await navigator.clipboard.writeText(item.title)
                              e.target.innerText = '複製成功'
                              setTimeout(() => {
                                e.target.innerText = '複製'
                              }, 2000)
                            } catch (err) {
                              e.target.innerText = '複製失敗'
                              setTimeout(() => {
                                e.target.innerText = '複製'
                              }, 2000)
                            }
                          }}>
                          複製
                        </div>
                      </div>
                    </div>

                    <div className="description-area">
                      <div className="content active">Description</div>
                      <div className="inner-text">
                        {item.description.split(';').map((info, i) => (
                          <div key={i}>{info}</div>
                        ))}
                        <div
                          className="description-copy-btn"
                          onClick={async (e) => {
                            try {
                              // 將分號分割後的內容以換行連接
                              const textToCopy = item.description.split(';').join('\n')
                              await navigator.clipboard.writeText(textToCopy)
                              e.target.innerText = '複製成功'
                              setTimeout(() => {
                                e.target.innerText = '複製'
                              }, 2000)
                            } catch (err) {
                              e.target.innerText = '複製失敗'
                              setTimeout(() => {
                                e.target.innerText = '複製'
                              }, 2000)
                            }
                          }}>
                          複製
                        </div>
                      </div>
                    </div>

                    <div className="movePath">
                      <div className="content active">資料夾路徑</div>
                      <div className="inner-text">{item.movePath}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
