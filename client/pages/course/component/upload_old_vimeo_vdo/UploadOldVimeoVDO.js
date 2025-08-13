// 原生組件庫
import React, { useState } from 'react'
// 附加庫
import { motion, AnimatePresence } from 'framer-motion'
// method
import adminService from '../../../../method/adminService'
import { useUserToken } from '../../../../method/useUserToken'
// style
import style from './style.module.css'

export default function UploadOldVimeoVDO({ setContainerIndex, course_id, setUploadOldVimeoVDOInnerEleOpacity, setUploadOldVimeoVDOWidht, setUploadOldVimeoVDOHeight }) {
  const token = useUserToken()
  // 控制開關ui
  const [showUploadOldVimeoVDOUI, setShowUploadOldVimeoVDOUI] = useState(false)
  // 卡片資料
  const [cards, setCards] = useState([])
  // 獲得response
  const [videoMsg, setVideoMsg] = useState([])
  const [getResponse, setGetResponse] = useState(false)
  const [videoIds, setVideoIds] = useState(false)

  const closeWidow = () => {
    setUploadOldVimeoVDOHeight(0)
    setUploadOldVimeoVDOWidht(0)
    setUploadOldVimeoVDOInnerEleOpacity(0)

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
      console.error('每個影片必須有標題與描述')
      return
    }
    if (
      cards.find((item) => {
        return item.description === ''
      })
    ) {
      console.error('每個影片必須有標題與描述')
      return
    }
    let cardsTemp = cards.map((item, index) => {
      return { ...item, uid: index }
    })
    let data = { videos: cardsTemp }
    adminService.batchCreate(token, data, course_id).then((res) => {
      if (res.success) {
        setGetResponse(true)
        setVideoMsg(res.data.returnInfo)
        setVideoIds(res.data.videoIds)
      }
    })
    // 可以在這裡調用 adminService.batchCreate 等 API 上傳影片資料
  }

  const patchVideo = () => {
    let data = {
      videoIds: videoIds,
    }
    const tempId = course_id
    adminService.updateUrls(token, data, tempId).then((res) => {})
  }

  return (
    <div className={style['upload-old-vimeo-vdo-main']}>
      <AnimatePresence>
        <div
          className="g-blue-btn"
          onClick={() => {
            setShowUploadOldVimeoVDOUI(true)
            setContainerIndex('99')
          }}>
          編輯舊有Vimeo影片
        </div>
        {showUploadOldVimeoVDOUI && (
          <motion.div
            key={'ui-background'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className={style['upload-old-vimeo-vdo-area']}
            onClick={() => {
              setShowUploadOldVimeoVDOUI(false)
              setContainerIndex('1')
            }}>
            <motion.div
              key={'ui-inner'}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.1 }}
              className={style['container']}>
              <div
                className={style['ui']}
                onClick={(e) => e.stopPropagation()}>
                <div className={style['inner-element']}>
                  <div className={style['btn-area']}>
                    <div
                      className="g-red-btn"
                      onClick={() => {
                        setShowUploadOldVimeoVDOUI(false)
                        setContainerIndex('1')
                      }}>
                      關閉
                    </div>
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
                        className={`${style['confirm']} g-blue-btn `}
                        onClick={() => {
                          closeWidow()
                          patchVideo()
                        }}>
                        確認完成後點擊此處
                      </div>
                    )}
                  </div>

                  <div className={style['card-area']}>
                    {!getResponse &&
                      cards.map((item, index) => (
                        <div
                          className={style['card']}
                          key={index}>
                          {/* 標題欄位 */}
                          <div className={style['input-area']}>
                            <div className={style[('content', 'title-area')]}>
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
                          <div className={style['input-area']}>
                            <div className={style['content']}>描述</div>
                            <textarea
                              value={item.description}
                              onChange={(e) => {
                                const newCards = cards.map((card, i) => (i === index ? { ...card, description: e.target.value } : card))
                                setCards(newCards)
                              }}></textarea>
                          </div>
                          {/* 錄影日期欄位 */}
                          <div className={style['input-area']}>
                            <div className={style['content']}>錄影日期</div>
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
                          <div className={style[('input-area', 'checkbox')]}>
                            <div className={style['content']}>是否公開</div>
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
                      videoMsg.length > 0 &&
                      videoMsg.map((item, index) => (
                        <div
                          className={style['card']}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
