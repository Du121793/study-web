// 組件庫
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
// TSU
import { Upload } from 'tus-js-client'
// method
import videoUploader from '../../../../method/videoUploader'
import { useUserToken } from '../../../../method/useUserToken'
import { useStrictClickHandler } from '../../../../method/userful'
// style
import style from './style.module.css'
export default function UploadVideoFc({ messageControl, getCourseVideos, isShowVideoUpload, course_id, setUploadSuccess, uploadSuccess }) {
  const token = useUserToken()
  // 控制是否顯示UI
  const [showUploadVideoUI, setShowUploadVideoUI] = useState(false)
  const [videoFiles, setVideoFiles] = useState([])
  const [isPublic, setIsPublic] = useState(false)
  const [uploads, setUploads] = useState([])
  const fileInput = useRef(null)
  const fileAvatarInput = useRef(null)
  // 單檔顯示用
  const [videoFile, setVideoFile] = useState(null)
  const [thumbFile, setThumbFile] = useState(null)
  const [recordDate, setRecordDate] = useState(null)
  // req
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('MainClass')
  const [duration, setDuration] = useState(0)
  const [fileSize, setFileSize] = useState(0)
  // pre view
  const [preViewVideoImage, setPreViewVideoImage] = useState(null)
  // const [autoExtractFrame, setAutoExtractFrame] = useState('')
  // ui控制
  const uiRef = useRef(null)

  const test = () => {}

  const getVideoPreviewImage = async (file) => {
    const blobUrl = URL.createObjectURL(await autoExtractFrame(file))
    setPreViewVideoImage(blobUrl)
  }

  // STEP 1: 選擇影片 (可支援多檔)
  const handleVideoSelect = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setVideoFiles(files)

    // 若只顯示第一個檔案資訊
    const file = files[0]
    if (!file) return
    setVideoFile(file)
    setFileSize(file.size)

    const fileURL = URL.createObjectURL(file)
    const videoEl = document.createElement('video')
    videoEl.preload = 'metadata'
    videoEl.onloadedmetadata = () => {
      setDuration(videoEl.duration)
    }
    videoEl.src = fileURL
  }

  // STEP 2: 若用戶有選擇自訂縮圖
  const handleThumbSelect = (e) => {
    const file = e.target.files?.[0]
    const url = URL.createObjectURL(e.target.files[0])
    if (!file) return
    setPreViewVideoImage(url)
    setThumbFile(file)
  }

  // (可選) 從影片自動擷取第1秒當縮圖
  const autoExtractFrame = (file, captureTimeSec = 1) => {
    return new Promise((resolve) => {
      const fileURL = URL.createObjectURL(file)
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.src = fileURL

      video.addEventListener('loadedmetadata', () => {
        video.currentTime = Math.min(video.duration, captureTimeSec)
      })

      video.addEventListener('seeked', () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          const ctx = canvas.getContext('2d')
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

          canvas.toBlob((blob) => {
            URL.revokeObjectURL(fileURL)
            resolve(blob)
          }, 'image/png')
        } catch (err) {
          console.error(err)
          URL.revokeObjectURL(fileURL)
          resolve(null)
        }
      })

      video.addEventListener('error', (err) => {
        console.error('video load error: ', err)
        URL.revokeObjectURL(fileURL)
        resolve(null)
      })
    })
  }

  const isUserHasInputVideoTitle = () => {
    const titleInput = document.querySelector('#video-title')
    if (titleInput && titleInput.value.length) {
      return true
    } else {
      console.error('請先輸入標題')
      return false
    }
  }

  // STEP 3: 建立上傳連結 → 批量上傳
  async function handleCreateUploadLink() {
    if (videoFiles.length === 0) {
      alert('請先選擇影片檔')
      return
    }

    // 如果沒有手動選縮圖，就自動擷取影片第一秒
    let finalThumbnailBlob = thumbFile
    if (!finalThumbnailBlob && videoFiles.length > 0) {
      finalThumbnailBlob = await autoExtractFrame(videoFiles[0])
    }

    // 逐一處理每個檔案
    for (const file of videoFiles) {
      const uploadId = Date.now() + '-' + file.name

      // 加入待上傳列表
      setUploads((prev) => [
        ...prev,
        {
          id: uploadId,
          fileName: file.name,
          progress: 0,
          message: '等待上傳',
          tusInstance: null,
          videoId: '',
        },
      ])

      // 準備表單資料
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('fileSize', file.size)
      formData.append('length', duration)
      formData.append('recordDate', recordDate || '')
      formData.append('type', type)
      formData.append('isPrivate', isPublic ? 'true' : 'false')
      if (finalThumbnailBlob) {
        formData.append('thumbnail', finalThumbnailBlob)
      }

      try {
        // 呼叫後端取得上傳連結
        const data = await videoUploader.requestUploadLink(token, course_id, formData)
        if (!data.success) {
          throw new Error(data.message || '後端建立上傳連結失敗')
        }

        // 開始 tus 上傳
        startTusUpload(data.uploadLink, data.videoId, file, uploadId)
      } catch (err) {
        const msg = err?.error?.response?.data?.msg || err.message
        messageControl(msg, false)
        setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, message: '建立連結失敗', progress: 0 } : u)))
        setTimeout(() => handleRemoveUploadItem(uploadId), 3000)
        continue
      }
    }

    // 全部檔案都處理完後關閉上傳視窗
    setShowUploadVideoUI(false)
  }

  // STEP 4: 開始 TUS 上傳
  const startTusUpload = (upUrl, vidId, file, uploadId) => {
    if (!file || !upUrl) {
      ;(async () => {
        try {
          await videoUploader.returnUploadStatus(token, course_id, vidId, false)
        } catch (err) {
          console.error('通知後端失敗: ', err)
        }
      })()
      return
    }
    const tusUpload = new Upload(file, {
      uploadUrl: upUrl,
      chunkSize: 5 * 1024 * 1024,
      uploadLength: file.size,
      // 上傳失敗
      onError: async (error) => {
        // 1) 移除 localStorage 的紀錄
        localStorage.removeItem('uploadProgress')

        // 2) 顯示訊息
        messageControl(`上傳失敗:${error}`, false)

        // 3) 把對應檔案標記為「上傳失敗」
        setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, message: '上傳失敗', progress: 0 } : u)))

        // 4) 倒數3秒後，幫使用者自動移除
        setTimeout(() => {
          handleRemoveUploadItem(uploadId)
        }, 3000)

        // 5) 通知後端上傳失敗
        if (vidId && course_id) {
          try {
            await videoUploader.returnUploadStatus(token, course_id, vidId, false)
          } catch (err) {
            console.error('通知後端失敗: ', err)
          }
        }
      },

      onProgress: (bytesUploaded, bytesTotal) => {
        const pct = ((bytesUploaded / bytesTotal) * 100).toFixed(2)
        setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, progress: pct, message: '上傳中' } : u)))
      },

      onSuccess: () => {
        // 當上傳成功，移除tus斷點保護生成的localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key === tusUpload._urlStorageKey) {
            localStorage.removeItem(tusUpload._urlStorageKey)
          }
        }
        localStorage.removeItem('uploadProgress')
        // 回傳上傳狀態給後端
        videoUploader.returnUploadStatus(token, course_id, vidId, true).then((res) => {
          getCourseVideos(false)
          messageControl('上傳完成', true)
          setUploads((prev) => prev.filter((u) => u.id !== uploadId))
          setUploadSuccess(!uploadSuccess)
        })
      },
    })
    // 更新 tusInstance, videoId
    setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, tusInstance: tusUpload, videoId: vidId } : u)))

    tusUpload.start()
  }

  // 移除進度列
  const handleRemoveUploadItem = (uploadId) => {
    setUploads((prev) => prev.filter((u) => u.id !== uploadId))
  }

  // 暫停上傳
  const handlePauseUpload = (uploadId) => {
    setUploads((prev) =>
      prev.map((u) => {
        if (u.id === uploadId) {
          if (u.tusInstance && typeof u.tusInstance.abort === 'function' && u.message === '上傳中') {
            u.tusInstance.abort()
            return { ...u, message: '已暫停' }
          }
        }
        return u
      })
    )
  }

  // 繼續上傳
  const handleResumeUpload = (uploadId) => {
    setUploads((prev) =>
      prev.map((u) => {
        if (u.id === uploadId) {
          if (u.tusInstance && typeof u.tusInstance.start === 'function' && u.message === '已暫停') {
            u.tusInstance.start()
            return { ...u, message: '上傳中' }
          }
        }
        return u
      })
    )
  }

  // 終止上傳
  const handleCancelUpload = async (uploadId) => {
    let found = null
    setUploads((prev) => {
      found = prev.find((u) => u.id === uploadId)
      return prev
    })
    if (!found) return

    if (found.tusInstance && (found.message === '上傳中' || found.message === '已暫停') && typeof found.tusInstance.abort === 'function') {
      found.tusInstance.abort()
    } else {
      console.error('無有效的 tusInstance，無法真正終止上傳。')
    }

    if (found.videoId) {
      try {
        await videoUploader.returnUploadStatus(token, course_id, found.videoId, false)
      } catch (err) {
        console.error('通知後端刪除失敗: ', err)
      }
    }

    setUploads((prev) => prev.filter((u) => u.id !== uploadId))
  }

  // upload loading bar
  function UploadProgressDisplay({ uploads }) {
    return (
      <div
        className={style['upload-progress-container']}
        style={{ padding: uploads?.length > 0 ? '12px' : 'none' }}>
        {uploads.map((upload) => {
          const { id, fileName, message, progress } = upload

          return (
            <div
              key={id}
              className={style['upload-progress-item']}>
              <div className={style['header-row']}>
                {(message === '上傳中' || message === '等待上傳') && <div className={style['spinner']} />}
                {(message === '上傳失敗' || message === '建立連結失敗') && <span className={style['fail-icon']}>X</span>}

                <div className={style['file-info']}>
                  <div
                    className={style['file-name']}
                    title={fileName}>
                    {fileName}
                  </div>
                  <div className={style['status-message']}>{message === '上傳中' ? `${progress}%` : message === '等待上傳' ? '等待上傳…' : message}</div>
                </div>

                <div className={style['actions']}>
                  {(message === '上傳失敗' || message === '建立連結失敗') && <button onClick={() => handleRemoveUploadItem(id)}>移除</button>}
                  {message === '上傳中' && (
                    <>
                      <button onClick={() => handlePauseUpload(id)}>暫停</button>
                      <button onClick={() => handleCancelUpload(id)}>終止</button>
                    </>
                  )}
                  {message === '已暫停' && (
                    <>
                      <button onClick={() => handleResumeUpload(id)}>繼續</button>
                      <button onClick={() => handleCancelUpload(id)}>終止</button>
                    </>
                  )}
                </div>
              </div>
              {message === '上傳中' && (
                <div className={style['progress-bar-container']}>
                  <div
                    className={style['progress-bar']}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // 初始化欄位
  useEffect(() => {
    if (fileInput?.current) {
      fileInput.current.value = ''
    }
    if (fileAvatarInput?.current) {
      fileAvatarInput.current.value = ''
    }
  }, [isShowVideoUpload, fileInput, fileAvatarInput])

  // 第一次載入從 sessionStorage 讀取先前的上傳狀態
  useEffect(() => {
    setVideoFiles([])
    setVideoFile(null)
    setThumbFile(null)
    setRecordDate(null)
    setTitle('')
    setDescription('')
    setType('MainClass')
    setDuration(0)
    setFileSize(0)
    setIsPublic(false)
    setPreViewVideoImage(null)
    const storedUploads = JSON.parse(sessionStorage.getItem('uploadProgress')) || []
    setUploads(storedUploads)
  }, [])

  // 每當 uploads 改變，就存回 sessionStorage
  useEffect(() => {
    sessionStorage.setItem('uploadProgress', JSON.stringify(uploads))
  }, [uploads])

  return (
    <div className={style['upload-vidoe-main']}>
      <AnimatePresence>
        <div
          key="upload-ui"
          className={`g-blue-btn`}
          onClick={() => {
            setShowUploadVideoUI(true)
          }}>
          上傳影片
        </div>
        {/* 上傳視窗 */}
        {showUploadVideoUI && (
          <motion.div
            key="upload-ui-inner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className={style['upload-vidoe-contianer']}>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.1 }}
              className={style['container']}
              ref={uiRef}
              onClick={(e) => {
                e.stopPropagation()
              }}>
              <div className={style['top-section']}>
                {/* 左邊按鈕區域 */}
                <div className={style['btn-area']}>
                  <label
                    className={style['label']}
                    onClick={test}>
                    影片檔案上傳
                  </label>
                  <button
                    className="g-blue-btn"
                    onClick={() => {
                      fileInput.current.click()
                    }}>
                    選擇檔案
                  </button>
                  {fileInput.current?.value.length > 0 && <div className={style['content']}>{fileInput.current.value}</div>}
                  <input
                    style={{ display: 'none' }}
                    ref={fileInput}
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.value) {
                        handleVideoSelect(e)
                        getVideoPreviewImage(e.target.files[0])
                      }
                    }}
                    className={style['input']}
                  />

                  <div className={style[('section', 'title-section')]}>
                    <input
                      style={{ display: 'none' }}
                      ref={fileAvatarInput}
                      type="file"
                      accept=".png, .jpg, .jpeg"
                      onChange={(e) => {
                        if (e.target.value) handleThumbSelect(e)
                      }}
                      className={style['input']}
                    />
                  </div>
                </div>
                {/* 預覽圖片 */}
                <div
                  className={style['preview-image']}
                  onClick={() => {
                    fileAvatarInput.current.click()
                  }}>
                  <div className={style['hint']}>預覽圖片區域</div>
                  {preViewVideoImage && preViewVideoImage.length > 0 && (
                    <Image
                      src={preViewVideoImage}
                      className={style['image-pre-view']}
                      width={0}
                      height={0}
                      alt="video image pre view"
                    />
                  )}
                </div>
              </div>

              {/* 輸入區域 */}
              <div className={style['section']}>
                <label className={style['label']}>錄影日期 (可選)</label>
                <input
                  id="video-record-date"
                  type="datetime-local"
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  className={style['input']}
                />
              </div>

              <div className={style['section']}>
                <label className={style['label']}>影片標題</label>
                <input
                  id="video-title"
                  placeholder="此處輸入標題"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={style['input']}
                />
              </div>

              <div className={style['section']}>
                <label className={style['label']}>影片描述</label>
                <textarea
                  rows={3}
                  placeholder="此處輸入影片描述"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={style['textarea']}></textarea>
              </div>

              <div className={style['public-setting']}>
                <div className={style['content']}>是否公開此影片:</div>
                <div className="confirm">
                  <label>是</label>
                  <input
                    type="radio"
                    name="contact"
                    defaultValue="confirm"
                    defaultChecked={!isPublic}
                    onClick={() => {
                      setIsPublic(false)
                    }}
                  />
                </div>
                <div className={style['reject']}>
                  <label>否</label>
                  <input
                    type="radio"
                    name="contact"
                    defaultValue="reject"
                    defaultChecked={isPublic}
                    onClick={() => {
                      setIsPublic(true)
                    }}
                  />
                </div>
              </div>

              <div className={style['section']}>
                <p>
                  <strong>影片時長:</strong> {duration.toFixed(2)} 秒
                </p>
                <p>
                  <strong>檔案大小:</strong> {fileSize >= 1024 * 1024 ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB` : fileSize >= 1024 ? `${(fileSize / 1024).toFixed(1)} KB` : `${fileSize} B`}
                </p>
              </div>

              <div className={style['buttonContainer']}>
                <button
                  onClick={() => {
                    if (isUserHasInputVideoTitle()) {
                      handleCreateUploadLink()
                    }
                  }}
                  className="g-blue-btn">
                  建立上傳連結並上傳
                </button>
                <div
                  className="g-red-btn"
                  onClick={() => {
                    setShowUploadVideoUI(false)
                    setPreViewVideoImage('')
                    setTitle('')
                    setDescription('')
                  }}>
                  關閉介面
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* 右下角的多檔上傳進度（含暫停、終止、刪除等功能） */}
      <UploadProgressDisplay uploads={uploads} />
    </div>
  )
}
