import style from './style.module.css'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import Image from 'next/image'
// methods
import adminService from '../../../method/adminService'
import LoadingAnime from '../../../components/loading_anime/LoadingAnime'
import MessageAnime from '../../../components/message_anime/MessageAnime'
// image
import whiteZipIcon from '../../../public/zip/white.png'
function InfoBackUp() {
  const [backupList, setBackupList] = useState([])
  const [isVisible, setIsVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasMessage, setHasMessage] = useState(null)
  const [coldDown, setColdDown] = useState(false)

  const [showPup, setShowPup] = useState(false) // 二次彈窗
  const [actionType, setActionType] = useState(null) // 儲存要執行的動作
  const [selectedBackup, setSelectedBackup] = useState(null) // 儲存要操作的備份檔名
  // 獲取備份
  const getBackupList = () => {
    const token = localStorage.getItem('token')
    setLoading(true)
    adminService.getBackupList(token).then((res) => {
      if (Array.isArray(res.files) && res.files.length >= 0) {
        const nextArray = res.files.map((item) => {
          return item.split('.')[0]
        })
        setBackupList(nextArray)
      }
      setLoading(false)
    })
  }
  // 執行備份
  const runBackup = () => {
    const token = localStorage.getItem('token')
    setLoading(true)
    adminService.runBackup(token).then((res) => {
      if (res?.success) getBackupList()
    })
    setLoading(false)
  }
  // 下載備份
  const downloadBackup = (filename) => {
    const token = localStorage.getItem('token')
    setLoading(true)
    if (filename) {
      adminService.downloadBackup(token, filename + '.zip').then((res) => {
        const blob = res // 這裡直接就是 Blob，res === response.data

        const url = window.URL.createObjectURL(blob)

        const a = document.createElement('a')
        a.href = url
        a.download = `${filename}.zip`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        window.URL.revokeObjectURL(url)
      })
      setLoading(false)
    }
  }
  // 套用備份
  const applyBackup = (filename) => {
    const token = localStorage.getItem('token')
    const body = { mode: 'full' }
    setLoading(true)
    setColdDown(true)
    adminService
      .applyBackup(token, filename + '.zip', body)
      .then(() => {
        setLoading(false)
        setHasMessage('成功套用')
      })
      .then(() => {
        setTimeout(() => {
          setColdDown(false)
        }, 15000)
        setTimeout(() => {
          setHasMessage(null)
        }, 1000)
      })
  }
  // 刪除備份
  const deleteBackup = (filename) => {
    const token = localStorage.getItem('token')
    setLoading(true)
    adminService.deleteBackup(token, filename + '.zip').then((res) => {
      if (res?.success) {
        getBackupList()
      }
      setLoading(false)
    })
  }

  return (
    <div className={style['body']}>
      <div className={style['container']}>
        <div className={style['title']}>備份功能</div>
        <div className={style['hint-title']}>備份須知:</div>
        <ul className={style['hints']}>
          <li>
            <span>1</span>
            <span>備份功能用於緊急遷移服務器或者發生重大資料遺失事件</span>
          </li>
          <li>
            <span>2</span>
            <span>登入時間超過1天不允許操作</span>
          </li>
          <li>
            <span>3</span>
            <span>備份會將圖片資料，文件資料回覆到特定時間</span>
          </li>
          <li>
            <span>4</span>
            <span>恢復到特定時間並不會回覆Vimeo影片狀態，也表示你在此回覆點之後做的刪除影片新增影片都會保留，這將會造成影片失去索引或者影片遺留於Vimeo，進行此操作請謹慎執行</span>
          </li>
          <li>
            <span>5</span>
            <span>備份資料最多保留10個，包含手動備份（刪除前可以先下載） 建議進行資料恢復前，先手動備份一次並下載</span>
          </li>
          <li>
            <span>6</span>
            <span>每周日會自動備份</span>
          </li>
        </ul>
        <div
          className="g-blue-btn"
          onClick={() => {
            setIsVisible(!isVisible)
            getBackupList()
          }}>
          進入頁面
        </div>
        <AnimatePresence>
          {/* 第一次彈窗 */}
          {isVisible && (
            <motion.div
              key="main-popup"
              className={style['popup-overlay']}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsVisible(false)}>
              <motion.div
                className={style['popup']}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()} // 防止點擊內容區域關閉
              >
                <div className={style['popup-content']}>
                  {loading && <LoadingAnime top={'12px'}></LoadingAnime>}
                  {hasMessage && (
                    <MessageAnime
                      message={hasMessage}
                      top="100px"
                      duration={2000}
                    />
                  )}

                  <div className={style['outside-option-btns']}>
                    <div
                      className={`g-red-btn ${style['close-btn']}`}
                      onClick={() => {
                        setIsVisible(false)
                      }}>
                      關閉
                    </div>
                    <div
                      className={`g-blue-btn ${style['backup-btn']}`}
                      onClick={() => {
                        runBackup()
                      }}>
                      立即備份
                    </div>
                  </div>
                  <ul className={style['back-list']}>
                    {backupList.map((item, idx) => {
                      return (
                        <li
                          key={idx}
                          className={style['back-list-container']}>
                          <div className={style['text-area']}>
                            <Image
                              src={whiteZipIcon}
                              width={24}
                              height={24}
                              alt="zip icon"></Image>
                            {item}
                          </div>
                          <div className={style['btns']}>
                            <div
                              className={style['blue-btn']}
                              onClick={() => {
                                downloadBackup(item)
                              }}>
                              下載 ZIP
                            </div>
                            <div
                              className={style['green-btn']}
                              style={{ pointerEvents: coldDown ? 'none' : 'auto', backgroundColor: coldDown && 'gray' }}
                              onClick={() => {
                                // applyBackup(item)
                                setActionType('apply') // 設定動作為 'apply'
                                setSelectedBackup(item) // 儲存當前項目
                                setShowPup(true) // 顯示彈窗
                              }}>
                              套用
                            </div>
                            <div
                              className={style['red-btn']}
                              onClick={() => {
                                // deleteBackup(item)
                                setActionType('delete') // 設定動作為 'delete'
                                setSelectedBackup(item) // 儲存當前項目
                                setShowPup(true) // 顯示彈窗
                              }}>
                              刪除
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </motion.div>
            </motion.div>
          )}
          {/* 二次確認彈窗 */}
          {showPup && (
            <motion.div
              key="confirm-popup"
              className={style['next-popup-overlay']}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}>
              <motion.div
                className={style['popup']}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}>
                <div className={style['popup-content']}>
                  <div className={style['hint']}>執行之前建議備份一次</div>
                  <div className={style['hint']}>確定已經了解備份須知</div>
                  <div className={style['confirm-message']}>
                    {/* 根據 actionType 顯示不同的提示訊息 */}
                    <span>{actionType === 'apply' && `確定要套用此備份嗎？`}</span>
                    <span>{actionType === 'apply' && selectedBackup}</span>
                    <span>{actionType === 'delete' && `確定要刪除此備份嗎？`}</span>
                    <span>{actionType === 'delete' && selectedBackup}</span>
                  </div>
                  <div className={style['btns']}>
                    {/* 確認按鈕：根據 actionType 執行不同操作 */}
                    <div
                      className={`g-blue-btn ${style['confirm-btn']}`}
                      onClick={() => {
                        // 根據 actionType 判斷要執行哪個函數
                        if (actionType === 'apply') {
                          applyBackup(selectedBackup)
                        } else if (actionType === 'delete') {
                          deleteBackup(selectedBackup)
                        }
                        setShowPup(false) // 執行後隱藏彈窗
                      }}>
                      確認
                    </div>
                    <div className={style['confirm-btns']}>
                      {/* 取消按鈕：隱藏彈窗 */}
                      <div
                        className={`g-red-btn ${style['close-btn']}`}
                        onClick={() => setShowPup(false)}>
                        取消
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
export default InfoBackUp
