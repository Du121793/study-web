import React, { use, useState, useEffect } from 'react'
import { Upload } from 'tus-js-client'
import videoUploader from '../../method/videoUploader'
import userService from '../../method/userService'

export default function QAMsgUpload({
  token,
  question_id,
  file, // 影片檔案 (File)
  images, // 圖片檔案陣列 (File[])
  content,
  fileSize,
  isPrivate,
  isBest,
  submitSuccess,
  setSubmitSuccess,
}) {
  // 組成 FormData
  const formData = new FormData()
  formData.append('content', content)
  if (fileSize) formData.append('fileSize', fileSize)
  formData.append('isPrivate', isPrivate)
  formData.append('isBest', isBest)
  // ★ 將多張圖片依序 append，key 皆為 "image" ★
  if (images && images.length > 0) {
    images.forEach((imgFile) => {
      formData.append('image', imgFile)
    })
  }

  /* 控制上傳狀態 */
  const [uploads, setUploads] = useState([])
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploading, setUploading] = useState(false)

  /* 第一次請求拿到上傳影片的Link與留言ID */
  const [uploadLink, setUploadLink] = useState(null)
  const [commentID, setCommentID] = useState(null)

  // 新增一個狀態來存儲待上傳的文件
  const [pendingFile, setPendingFile] = useState(null)

  // 監聽 uploadLink 的變化
  useEffect(() => {
    if (uploadLink && pendingFile) {
      startTusUpload(pendingFile)
      setPendingFile(null)
    }
  }, [uploadLink])

  // 將 TUS 上傳邏輯抽離成單獨的函數
  const startTusUpload = (file) => {
    const uploadId = Date.now() + '-' + file.name
    const tusUpload = new Upload(file, {
      endpoint: uploadLink,
      uploadUrl: uploadLink,
      chunkSize: 5 * 1024 * 1024,
      uploadLength: file.size,

      onError: async (error) => {
        console.error('TUS 上傳失敗:', error)
        setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, message: '上傳失敗', progress: 0 } : u)))
        try {
          await videoUploader.returnQuestionUploadStatus(token, question_id, commentID, false)
        } catch (err) {
          console.error('通知後端失敗: ', err)
        }
      },

      onProgress: (bytesUploaded, bytesTotal) => {
        const pct = ((bytesUploaded / bytesTotal) * 100).toFixed(2)
        setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, progress: pct, message: '上傳中' } : u)))
      },

      onSuccess: async () => {
        setSubmitSuccess(!submitSuccess)
        try {
          const response = await videoUploader.returnQuestionUploadStatus(token, question_id, commentID, true)
        } catch (err) {
          console.error('通知後端失敗: ', err)
        }

        setUploads((prev) => prev.filter((u) => u.id !== uploadId))
        setUploadSuccess(true)
      },
    })

    setUploads((prev) => [...prev, { id: uploadId, progress: 0, message: '準備上傳中' }])
    tusUpload.start()
  }

  // 「開始上傳」按鈕事件
  const handleTusUpload = async () => {
    if (uploading) return
    setUploading(true)

    try {
      // (1) 送出留言並取得 uploadLink、commentID
      const res = await userService.submitQaMessage(token, question_id, formData)

      if (res.success === true && Object.keys(res.data.uploadLink).length === 0) {
        setSubmitSuccess(!submitSuccess)
      }
      if (res) {
        const { uploadLink, commentID } = res.data
        setUploadLink(uploadLink)
        setCommentID(commentID)

        if (!uploadLink) {
          console.error('後端沒有回傳 uploadLink, 上傳影片失敗')
          await videoUploader.returnQuestionUploadStatus(token, question_id, commentID, false)
          return
        }
      }

      // (2) 若沒有要上傳影片，就結束
      if (!file) {
        console.log('沒有影片需要上傳，流程結束')
        setUploadSuccess(true)
        return
      }

      // 設置待上傳的文件，等待 uploadLink 更新後再上傳
      setPendingFile(file)
    } catch (err) {
      console.error('handleTusUpload流程失敗:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div>
        {uploads.map((upload) => (
          <div
            key={upload.id}
            style={{ marginBottom: '8px' }}>
            <p>進度: {upload.progress}%</p>
          </div>
        ))}
      </div>
      <button onClick={handleTusUpload}>{uploading ? '上傳中...' : '開始上傳'}</button>
    </div>
  )
}
