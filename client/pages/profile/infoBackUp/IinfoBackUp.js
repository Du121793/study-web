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

  const alertList = [`本備份機制僅在緊急遷移服務器或重大資料遺失時使用。`, `使用者若超過 24 小時未重新登入，將無法執行備份或還原等敏感操作。`, `備份會將圖片與文件資料回復至指定的時間點。`, `恢復資料不會回復 Vimeo 影片的狀態，且之後的刪除/新增影片仍會保留。`, `因為 Vimeo 影片狀態不一致，可能導致影片失去索引或殘留於平台，操作前請謹慎。`, `系統最多保留最近 10 筆備份（含手動建立的備份）。`, `每週日凌晨 03:00 執行一次備份，並依排程刪除超出保留上限的舊備份。`, `建議在進行任何還原前先手動建立並下載一筆備份以防萬一。`, `被刪除的備份在移除前可先下載備份檔以保留一份本地備份。`]

  const initMessage = () => {
    const timer = setTimeout(() => {
      setHasMessage('')
    }, 2000)
    setLoading(false)
    return clearTimeout(timer)
  }

  // 獲取備份
  const getBackupList = () => {
    const token = localStorage.getItem('token')
    setLoading(true)
    adminService
      .getBackupList(token)
      .then((res) => {
        if (res.msg === '距離上次登陸超過24小時，請重新登錄') {
          console.log(123456)
          setHasMessage('登陸逾期，請重新登錄')
          initMessage()
          return
        }
        if (res?.status === 401) {
          setHasMessage('登陸逾期，請重新登錄')
        }
        if (Array.isArray(res.files) && res.files.length >= 0) {
          const nextArray = res.files.map((item) => {
            return item.split('.')[0]
          })
          setBackupList(nextArray)
        }
      })
      .catch((err) => {
        setHasMessage('發生錯誤')
        console.error(err)
      })
      .finally(() => {
        initMessage()
      })
  }
  // 執行備份
  const runBackup = () => {
    const token = localStorage.getItem('token')
    setLoading(true)
    adminService.runBackup(token).then((res) => {
      if (res?.success) getBackupList()
      if (res?.status === 401) {
        setHasMessage('登陸逾期，請重新登錄')
      }
      setTimeout(() => {
        setHasMessage(null)
      }, 1000)
    })
    setLoading(false)
  }
  // 下載備份
  const downloadBackup = (filename) => {
    const token = localStorage.getItem('token')
    setLoading(true)
    if (filename) {
      adminService.downloadBackup(token, filename + '.zip').then((res) => {
        if (res?.msg === '距離上次登陸超過24小時，請重新登錄') {
          setHasMessage('登陸逾期，請重新登錄')
          return
        }
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
      .then((res) => {
        setLoading(false)
        setHasMessage('成功套用')
        if (res?.status === 401) {
          setHasMessage('登陸逾期，請重新登錄')
        }
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
        setHasMessage('成功刪除')
      }
      if (res?.status === 401) {
        setHasMessage('登陸逾期，請重新登錄')
      }
      setTimeout(() => {
        setHasMessage(null)
      }, 1000)
      setLoading(false)
    })
  }

  return (
    <div className={style['body']}>
      <div className={style['container']}>
        <div className={style['title']}>備份功能</div>
        <div className={style['hint-title']}>備份須知:</div>
        <ul className={style['hints']}>
          {alertList.map((item, idx) => {
            return (
              <li key={idx}>
                <span>{idx + 1}</span>
                <span>{item}</span>
              </li>
            )
          })}
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
                  <div className={style['alerts']}>
                    {/* 加載動畫 */}
                    {loading && <LoadingAnime top={'12px'}></LoadingAnime>}
                    {/* 訊息框 */}
                    {hasMessage && (
                      <MessageAnime
                        message={hasMessage}
                        top="100px"
                        duration={2000}
                      />
                    )}
                  </div>
                  {/* 頂部按鈕 */}
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
                  {/* 備份列表 */}
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
