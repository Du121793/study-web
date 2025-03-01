// 組件庫
import React, { useState, useEffect } from 'react'
// TSU
import { Upload } from 'tus-js-client'
import videoUploader from '../../method/videoUploader'
// method
import { useUserToken } from '../../method/useUserToken'

export default function uploadVideoFc({ isShowVideoUpload, setIsShowVideoUpload, course_id, setUploadSuccess, uploadSuccess, uploadError, setUploadError }) {
  const token = useUserToken()
  const [videoFiles, setVideoFiles] = useState([])

  // 每個 uploads item:
  // {
  //   id: string,
  //   fileName: string,
  //   progress: number,
  //   message: '等待上傳' | '上傳中' | '上傳失敗' | '建立連結失敗' | '已暫停' | ...,
  //   tusInstance: object | null,
  //   videoId: string,
  // }
  
  const [uploads, setUploads] = useState([])

  // ★ 第一次載入：從 localStorage 讀取先前的上傳狀態
  useEffect(() => {
    const storedUploads = JSON.parse(localStorage.getItem('uploadProgress')) || []
    setUploads(storedUploads)
  }, [])

  // ★ 每當 uploads 改變，就存回 localStorage
  useEffect(() => {
    localStorage.setItem('uploadProgress', JSON.stringify(uploads))
  }, [uploads])

  // 單檔顯示用
  const [videoFile, setVideoFile] = useState(null)
  const [thumbFile, setThumbFile] = useState(null)
  const [thumbnailBase64, setThumbnailBase64] = useState('')
  const [recordDate, setRecordDate] = useState(null)

  const [title, setTitle] = useState('此處輸入影片標題')
  const [description, setDescription] = useState('測試描述')
  const [type, setType] = useState('MainClass')
  const [duration, setDuration] = useState(0)
  const [fileSize, setFileSize] = useState(0)

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
  const handleThumbSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setThumbFile(file)

    const reader = new FileReader()
    reader.onload = (ev) => {
      setThumbnailBase64(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  // (可選) 從影片自動擷取指定時間的畫面 (預設第1秒)
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
          const base64 = canvas.toDataURL('image/png')
          URL.revokeObjectURL(fileURL)
          resolve(base64)
        } catch (err) {
          console.error(err)
          URL.revokeObjectURL(fileURL)
          resolve('')
        }
      })

      video.addEventListener('error', (err) => {
        console.error('video load error: ', err)
        URL.revokeObjectURL(fileURL)
        resolve('')
      })
    })
  }

  // 用來判斷使用者是否有輸入標題
  const isUserHasInputVideoTitle = () => {
    const titleInput = document.querySelector('#video-title')
    if (titleInput && titleInput.value.length) {
      return true
    } else {
      console.error('請先輸入標題')
      return false
    }
  }

  // 關閉上傳影片組件
  const closeVideoUploadOnclick = () => {
    if (isShowVideoUpload) {
      let videoUpload = document.querySelector('.upload-vidoe-main')
      let background = document.querySelector('.background')
      if (videoUpload) videoUpload.style.height = '0'
      if (background) background.style.display = 'none'
      setIsShowVideoUpload(false)
    }
  }

  // STEP 3: 建立上傳連結 → 批量上傳
  const handleCreateUploadLink = async () => {
    if (videoFiles.length === 0) {
      alert('請先選擇影片檔')
      return
    }

    // 若沒選縮圖，則自動擷取第一秒畫面
    let finalThumbnail = thumbnailBase64
    if (!finalThumbnail && videoFiles.length > 0) {
      finalThumbnail = await autoExtractFrame(videoFiles[0])
    }

    // 逐一為每部影片建立上傳任務
    videoFiles.forEach(async (file) => {
      const uploadId = Date.now() + '-' + file.name

      // 放入等待上傳
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

      const reqBody = {
        title,
        description,
        fileSize: file.size,
        length: duration,
        thumbnail: finalThumbnail,
        recordDate,
        type,
      }

      try {
        const data = await videoUploader.requestUploadLink(token, course_id, reqBody)
        if (!data.success) {
          throw new Error(data.message || '後端建立上傳連結失敗')
        }

        const { uploadLink, videoId } = data
        startTusUpload(uploadLink, videoId, file, uploadId)
      } catch (err) {
        console.error(err)
        // 只更新該檔案為「建立連結失敗」
        setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, message: '建立連結失敗', progress: 0 } : u)))
      }
    })

    // 建立完所有任務後，關閉上傳視窗
    closeVideoUploadOnclick()
  }

  // STEP 4: 開始 TUS 上傳
  const startTusUpload = (upUrl, vidId, file, uploadId) => {
    if (!file || !upUrl) {
      // 如果連結或檔案不存在 → 自動標記失敗 / 通知後端
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
        console.error('TUS 上傳失敗:', error)
        setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, message: '上傳失敗', progress: 0 } : u)))
        if (vidId && course_id) {
          try {
            await videoUploader.returnUploadStatus(token, course_id, vidId, false)
          } catch (err) {
            console.error('通知後端失敗: ', err)
          }
        }
      },

      // 上傳中
      onProgress: (bytesUploaded, bytesTotal) => {
        const pct = ((bytesUploaded / bytesTotal) * 100).toFixed(2)
        setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, progress: pct, message: '上傳中' } : u)))
      },

      // 上傳完成
      onSuccess: () => {
        console.log('TUS 上傳成功')
        ;(async () => {
          const res = await videoUploader.returnUploadStatus(token, course_id, vidId, true)
          console.log('後端返回訊息:', res)
        })()

        // 上傳完就從進度列表中移除
        setUploads((prev) => prev.filter((u) => u.id !== uploadId))
        setUploadSuccess(!uploadSuccess)
      },
    })

    // 更新 tusInstance, videoId
    setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, tusInstance: tusUpload, videoId: vidId } : u)))

    tusUpload.start()
  }

  /** 按鈕：移除進度列 (適用「上傳失敗」或「建立連結失敗」等) **/
  const handleRemoveUploadItem = (uploadId) => {
    // 從 state 移除即可，自動觸發同步更新到 localStorage
    setUploads((prev) => prev.filter((u) => u.id !== uploadId))
  }

  // 可選：暫停上傳
  const handlePauseUpload = (uploadId) => {
    setUploads((prev) =>
      prev.map((u) => {
        if (u.id === uploadId) {
          // 確認 tusInstance 仍存在且具備 abort 方法
          if (u.tusInstance && typeof u.tusInstance.abort === 'function' && u.message === '上傳中') {
            u.tusInstance.abort()
            return { ...u, message: '已暫停' }
          } else {
            // tusInstance 已失效，無法暫停
            console.log('無有效的 tusInstance，無法暫停。')
          }
        }
        return u
      })
    )
  }

  // 可選：繼續上傳
  const handleResumeUpload = (uploadId) => {
    setUploads((prev) =>
      prev.map((u) => {
        if (u.id === uploadId) {
          // 確認 tusInstance 仍存在且具備 start 方法
          if (u.tusInstance && typeof u.tusInstance.start === 'function' && u.message === '已暫停') {
            u.tusInstance.start()
            return { ...u, message: '上傳中' }
          } else {
            console.log('無有效的 tusInstance，無法繼續上傳。')
          }
        }
        return u
      })
    )
  }

  // 可選：終止上傳 (中斷後直接從列表移除)
  const handleCancelUpload = async (uploadId) => {
    let found = null
    setUploads((prev) => {
      found = prev.find((u) => u.id === uploadId)
      return prev
    })
    if (!found) return

    // 如果 tusInstance 存在且在「上傳中/已暫停」，先嘗試 abort
    if (found.tusInstance && (found.message === '上傳中' || found.message === '已暫停') && typeof found.tusInstance.abort === 'function') {
      found.tusInstance.abort()
    } else {
      console.log('無有效的 tusInstance，無法真正終止上傳。')
    }

    // 通知後端刪除（非必要，依你的後端需求）
    if (found.videoId) {
      try {
        await videoUploader.returnUploadStatus(token, course_id, found.videoId, false)
      } catch (err) {
        console.error('通知後端刪除失敗: ', err)
      }
    }

    // 從 state 移除
    setUploads((prev) => prev.filter((u) => u.id !== uploadId))
  }

  // 右下角進度顯示
  function UploadProgressDisplay({ uploads }) {
    return (
      <div className="upload-progress-container">
        {uploads.map((upload) => {
          const { id, fileName, message, progress } = upload

          return (
            <div
              key={id}
              className="upload-progress-item">
              {/* 第一行：顯示狀態圖示 + 檔案資訊 + 操作按鈕 */}
              <div className="header-row">
                {/* 若正在上傳或等待中 → 顯示 spinner */}
                {(message === '上傳中' || message === '等待上傳') && <div className="spinner" />}

                {/* 若上傳或連結建立失敗 → 顯示失敗圖示 (可用 icon 或文字) */}
                {(message === '上傳失敗' || message === '建立連結失敗') && <span className="fail-icon">X</span>}

                {/* 檔案名稱 + 狀態訊息 */}
                <div className="file-info">
                  <div
                    className="file-name"
                    title={fileName}>
                    {fileName}
                  </div>
                  <div className="status-message">{message === '上傳中' ? `${progress}%` : message === '等待上傳' ? '等待上傳…' : message}</div>
                </div>

                {/* 右側操作按鈕 (根據各種狀態顯示不同按鈕) */}
                <div className="actions">
                  {/* 上傳失敗或建立連結失敗 → 移除 */}
                  {(message === '上傳失敗' || message === '建立連結失敗') && <button onClick={() => handleRemoveUploadItem(id)}>移除</button>}

                  {/* 上傳中 → 暫停、終止 */}
                  {message === '上傳中' && (
                    <>
                      <button onClick={() => handlePauseUpload(id)}>暫停</button>
                      <button onClick={() => handleCancelUpload(id)}>終止</button>
                    </>
                  )}

                  {/* 已暫停 → 繼續、終止 */}
                  {message === '已暫停' && (
                    <>
                      <button onClick={() => handleResumeUpload(id)}>繼續</button>
                      <button onClick={() => handleCancelUpload(id)}>終止</button>
                    </>
                  )}
                </div>
              </div>

              {/* 第二行：若正在上傳 (message === '上傳中')，顯示進度條 */}
              {message === '上傳中' && (
                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    style={{ width: `${progress}%` }}></div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      {/* 上傳視窗 */}
      <div className="upload-vidoe-main">
        <h1 className="title">影片上傳</h1>
        <div className="section">
          <label className="label">上傳影片檔案(可多選):</label>
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={handleVideoSelect}
            className="input"
          />
        </div>

        <div className="section">
          <label className="label">上傳影片縮圖(可選):</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleThumbSelect}
            className="input"
          />
        </div>

        <div className="section">
          <label className="label">輸入錄影日期(可選):</label>
          <input
            id="video-record-date"
            type="datetime-local"
            onChange={(e) => setRecordDate(e.target.value)}
            className="input"
          />
        </div>

        <div className="section">
          <label className="label">標題:</label>
          <input
            id="video-title"
            placeholder="此處輸入標題"
            onChange={(e) => setTitle(e.target.value)}
            className="input"
          />
        </div>

        <div className="section">
          <label className="label">描述:</label>
          <textarea
            rows={3}
            placeholder="此處輸入影片描述"
            onChange={(e) => setDescription(e.target.value)}
            className="textarea"></textarea>
        </div>

        <div className="section">
          <p>
            <strong>影片時長:</strong> {duration.toFixed(2)} 秒
          </p>
          <p>
            <strong>檔案大小:</strong> {fileSize >= 1024 * 1024 ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB` : fileSize >= 1024 ? `${(fileSize / 1024).toFixed(1)} KB` : `${fileSize} B`}
          </p>
        </div>

        <div className="buttonContainer">
          <button
            onClick={() => {
              if (isUserHasInputVideoTitle()) {
                handleCreateUploadLink()
              }
            }}
            className="button">
            建立上傳連結並上傳
          </button>
        </div>
      </div>

      {/* 右下角的多檔上傳進度（含暫停、終止、刪除等功能） */}
      <UploadProgressDisplay uploads={uploads} />
    </div>
  )
}
