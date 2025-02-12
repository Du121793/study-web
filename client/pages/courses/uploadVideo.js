import React, { useState } from 'react'
import { Upload } from 'tus-js-client'
import Image from 'next/image'

export default function VimeoUploadPage({ isShowVideoUpload, setIsShowVideoUpload, course_id }) {
  const [videoFiles, setVideoFiles] = useState([])
  const [uploads, setUploads] = useState([]) // 儲存各檔上傳狀態
  const [videoFile, setVideoFile] = useState(null)
  const [thumbFile, setThumbFile] = useState(null) // 若用戶自行上傳縮圖
  const [thumbnailBase64, setThumbnailBase64] = useState('')

  const [title, setTitle] = useState('此處輸入影片標題')
  const [description, setDescription] = useState('測試描述')
  const [type, setType] = useState('MainClass') // 任意字串, 依照後端需求
  const [duration, setDuration] = useState(0)
  const [fileSize, setFileSize] = useState(0)

  const LocalStorageToken = localStorage.getItem('token')
  // 從後端API拿到
  const [uploadUrl, setUploadUrl] = useState('')
  const [videoId, setVideoId] = useState('')

  const isUserHasInputVideoTitle = () => {
    const videoTitle = document.querySelector('#video-title')
    if (videoTitle.value.length) {
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
      videoUpload.style.height = '0'
      background.style.display = 'none'
      setIsShowVideoUpload(false)
    }
  }

  // 渲染上傳多部影片佇列任務區
  function UploadProgressDisplay({ uploads }) {
    return (
      <div className="upload-progress-container">
        {uploads.map((upload) => (
          <div
            key={upload.id}
            className="upload-progress-item">
            <div className="spinner"></div>
            <span>
              {upload.fileName}: {upload.progress}%
            </span>
          </div>
        ))}
      </div>
    )
  }

  // STEP 1: 選擇影片
  const handleVideoSelect = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setVideoFiles(files)
    const file = e.target.files?.[0]
    if (!file) return
    setVideoFile(file)
    setFileSize(file.size)

    const fileURL = URL.createObjectURL(file)
    const videoEl = document.createElement('video')
    videoEl.preload = 'metadata'
    videoEl.onloadedmetadata = () => {
      setDuration(videoEl.duration)
      console.log('影片時長:', videoEl.duration)
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
      setThumbnailBase64(ev.target.result) // "data:image/jpeg;base64,xxx"
    }
    reader.readAsDataURL(file)
  }

  // STEP 3: 建立上傳連結，submit按鈕觸發的函式
  const handleCreateUploadLink = async () => {
    if (videoFiles.length === 0) {
      alert('請先選擇影片檔')
      return
    }

    // 若沒選縮圖，則自動擷取影片第一秒的畫面
    let finalThumbnail = thumbnailBase64
    if (!finalThumbnail && videoFiles.length > 0) {
      finalThumbnail = await autoExtractFrame(videoFiles[0])
    }

    // 針對每一部影片進行上傳處理
    videoFiles.forEach(async (file) => {
      // 產生唯一 id
      const uploadId = Date.now() + '-' + file.name

      // 將此部影片的上傳資訊加入 uploads state
      setUploads((prev) => [...prev, { id: uploadId, fileName: file.name, progress: 0, message: '等待上傳' }])

      // 從影片取得基本資訊
      const fileSize = file.size
      // 這邊可用上面 autoExtractFrame 取得影片長度（示範省略）
      const duration = 0 // 可依需求補上

      // 向後端請求上傳連結 (API 路徑及 Authorization 請依專案實際狀況修改)
      const reqBody = {
        title,
        description,
        fileSize,
        length: duration,
        thumbnail: finalThumbnail,
        type,
      }
      try {
        const resp = await fetch(`http://localhost:8080/course/${course_id}/uploadVideo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: LocalStorageToken,
          },
          body: JSON.stringify(reqBody),
        })
        const data = await resp.json()
        if (!data.success) {
          throw new Error(data.message || '後端建立上傳連結失敗')
        }

        // 拿到上傳連結及影片 id 後，開始 TUS 上傳
        startTusUpload(data.uploadLink, data.videoId, file, uploadId)
      } catch (err) {
        console.error(err)
        // 更新此部影片的上傳訊息
        setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, message: '建立連結失敗', progress: 0 } : u)))
      }
    })
    // 關閉上傳視窗
    closeVideoUploadOnclick()
  }

  // (可選) 從影片自動擷取指定時間的畫面 (預設擷取第 1 秒)
  const autoExtractFrame = (file, captureTimeSec = 1) => {
    return new Promise((resolve, reject) => {
      const fileURL = URL.createObjectURL(file)
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.src = fileURL

      video.addEventListener('loadedmetadata', () => {
        video.currentTime = video.duration < captureTimeSec ? 0 : captureTimeSec
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

  // STEP 4: TUS 上傳
  const startTusUpload = (upUrl, vidId, file, uploadId) => {
    if (!videoFile || !upUrl) {
      ;(async () => {
        try {
          await fetch(`http://localhost:8080/course/${course_id}/deleteVideo`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: LocalStorageToken,
            },
            body: JSON.stringify({ videoId: vidId }),
          })
          console.log('已通知 deleteVideo: videoId=', vidId)
        } catch (err) {
          console.error('通知失敗: ', err)
        }
      })()
      return
    }

    const tusUpload = new Upload(videoFile, {
      uploadUrl: upUrl,
      chunkSize: 5 * 1024 * 1024,
      uploadLength: videoFile.size,
      onError: async (error) => {
        console.error('TUS 上傳失敗:', error)
        setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, message: '上傳失敗', progress: 0 } : u)))
        if (vidId && course_id) {
          try {
            await fetch(`http://localhost:8080/course/${course_id}/deleteVideo`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                Authorization: LocalStorageToken,
              },
              body: JSON.stringify({ videoId: vidId }),
            })
            console.log('已通知 deleteVideo: videoId=', vidId)
          } catch (err) {
            console.error('通知失敗: ', err)
          }
        }
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        // 目前上傳進度
        const pct = ((bytesUploaded / bytesTotal) * 100).toFixed(2)
        setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, progress: pct, message: '上傳中' } : u)))
      },
      onSuccess: () => {
        console.log('影片上傳完成')
        setUploads((prev) => prev.filter((u) => u.id !== uploadId))
      },
    })
    tusUpload.start()
  }

  return (
    <div>
      <div className="upload-vidoe-main">
        <h1 className="title">影片上傳</h1>

        <div className="section">
          <label className="label">上傳影片檔案:</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoSelect}
            className="input"
          />
        </div>

        <div className="section">
          <label className="label">上傳影片縮圖 ( 可選 ):</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleThumbSelect}
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
        {/* 
        <div className="section">
          <label className="label">影片 type:</label>
          <input
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="input"
          />
        </div> */}

        <div className="section">
          <p>
            <strong>影片秒數:</strong> {duration.toFixed(2)} 秒
          </p>
          <p>
            <strong>檔案大小:</strong>
            <span>{fileSize >= 1024 * 1024 ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB` : fileSize >= 1024 ? `${(fileSize / 1024).toFixed(1)} KB` : `${fileSize} B`}</span>
          </p>
        </div>

        <div className="buttonContainer">
          <button
            onClick={() => {
              {
                // 確定有輸入標題
                {
                  isUserHasInputVideoTitle() && startTusUpload()
                }
                {
                  isUserHasInputVideoTitle() && handleCreateUploadLink()
                }
              }
            }}
            className="button">
            建立上傳連結並上傳
          </button>
        </div>

        <div className="messageContainer">
          <p></p>
        </div>

        <div className="thumbnailContainer">
          {/* <Image
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEJklEQVQ4Ea1UW2xUVRRd9zXTefQ5bZHSYKUOg3WIDZE6LbFCqEowFDVggqKS6I/G+OGXUUz0w8iXIgpNhDQG5ceg0JZRDBqI2jJtU61UW8uElNLSQplOh+m00+l9HPe+01GJ+OdO1r377sc6+5y9zwX+Z5H+iy9QhOCWO/HEAytRX1mqVnLceMwY776C86dHcWI4gd9ul/svwpI8lL+5Hvv2NJc+m1+7SVVWboDkqbBzxdwEzCudmO0/a3zaHvvs3V68Hl/A1O2I2SbdVYA13S/IUf3rJiFip4SY6xciGRFi5ocsWGcb+TiGYzmHc3OkOUUqdqL8zHNypPaZLVXK2peBzCxgzQNC5GKzb4lSZDfgzIc5cAj9x05ffvioFZrJ2JUKZSlaea9RamnetapRDe4C0hOATjuxiNQk6EnA4AVSWZs+TQtOQ/YFUO6KFrmuJZZ/exltxGUTyv4i1La86Drguq9OgqxRMJFpaWCRiBSqMkNvk8hU0nO2dJxsC5BdMmocY8Eve4x2Os/rMrEq26qlp92VXhmSAcyPUGIMg92/4vndn+BcRyd9X7fBOtvYxzF2rGKAc5mDuVR6qPXVakgpcNDq1+iTKoSFk8d/R4XHQrjtAjbeT9slCbeN2LaTx/tQs+ZeYIHr0cG5zIE+XWWLVuFTyqExISUuxiDicRSv8OLtD4IIrCtFKmHZYP0dsrGPYzjWbp7DAZuDuLjLJZ0vOSKh7WV+2Uk9cpiAlzrroOIti0C2DNlY2C+TznXM0/GkKF1XYJE/0n4juqFlMcRbFlfjZgx6yg8XsPetOfh8BgJ3A8vuAIpKgDyy0ykgTX1KUGGTk8DgH8Rlatj7hgeYFSCOG8zFhHpkxLrweEavl70GdHch5IeOIu5OYyw2CvPSFCxjPju5mgeaexncNVVAqQGzZw/gmYc5poE4BpiLAM1fjObkQacpBrziu/0QOxvrxKGD74sfe38Rk0lT6EKIDGE8nhFnu7rFgf37xJMNa0X3YRr7fq9IfuQ0mYO5uEIjOoO+1g49/Ooqbdvm7V6MDvVg5HAPJr4AvqLjsrh1JHx81HiIBLCzCah7hJpDdbWG9TBzUIiRu3oO+ik0fP+K+nntDtcK0L/lm2M6UkMGCvJMWjZ7/XRdRjIjo7hWRdNTNF40sv0n0lc3f2zspqHuIsLF3NWz0gZunhm0og+6rNDyMqXQv0mDu0rFTUVBmsZVL9TgqtYQ3OrAugba2LCFnzsWxnYcMV6bSOE8kdE1ulW42jKfC49+uFU+NdvqNESXR4hLBUKMLYH1nzxi9ojT4BiO5RxCbqd/K0vc7MgnVAZ8WP/YamljaLV8T2W5VMr+8SkRi1y0hsIXxbnhafSyicDXKHsmpPzFTPo/hdtQRCgm0KCBrpEti/ScI8wQqDU8nbfKny8J3bgvSgspAAAAAElFTkSuQmCC"
          alt="Thumbnail"
          width={100}
          height={100}
          className="thumbnail"
        /> */}
        </div>
      </div>
      <UploadProgressDisplay uploads={uploads} />
    </div>
  )
}
